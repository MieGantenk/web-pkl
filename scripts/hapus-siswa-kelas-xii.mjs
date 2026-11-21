/**
 * Hapus data siswa kelas XII beserta akun login-nya.
 *
 * Script ini menyimpan cadangan JSON sebelum menghapus. Akun orang tua yang
 * masih terhubung ke anak lain tidak dihapus; akun orang tua yang menjadi
 * yatim setelah siswa XII dihapus ikut dihapus.
 *
 * Contoh:
 *   node scripts/hapus-siswa-kelas-xii.mjs \
 *     --out ~/Downloads/backup-siswa-xii.json
 *
 *   node scripts/hapus-siswa-kelas-xii.mjs \
 *     --out ~/Downloads/backup-siswa-xii.json \
 *     --execute
 *
 * Tanpa --execute, script hanya menampilkan rencana.
 */
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const KELAS_XII = ["XII RPL", "XII DKV"];

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "..",
      ".env.local",
    ),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    throw new Error("Berkas .env.local tidak ditemukan.");
  }

  const text = fs.readFileSync(envPath, "utf8");

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (!match) continue;

    const [, key, raw] = match;
    const value = raw.replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function parseArgs(argv) {
  const args = { execute: false, force: false, out: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--out") {
      args.out = argv[++index];
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Pemakaian:",
          "  node scripts/hapus-siswa-kelas-xii.mjs --out cadangan.json [--execute] [--force]",
          "",
          "--out      Berkas cadangan JSON. Wajib saat --execute.",
          "--execute  Benar-benar menghapus data. Tanpa ini hanya pratinjau.",
          "--force    Izinkan menimpa berkas cadangan yang sudah ada.",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Argumen tidak dikenal: ${arg}`);
    }
  }

  if (!args.out) {
    throw new Error("Wajib memakai --out.");
  }

  return args;
}

function must(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

async function countRows(table, siswaIds) {
  if (!siswaIds.length) return 0;

  const result = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .in("siswa_id", siswaIds);

  if (result.error) {
    throw new Error(`Gagal memuat ${table}: ${result.error.message}`);
  }

  return result.count ?? 0;
}

loadEnv();

const args = parseArgs(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const students = must(
  await admin
    .from("siswa")
    .select(
      [
        "id",
        "pengguna_id",
        "nis",
        "nisn",
        "kelas",
        "jurusan_id",
        "telepon",
        "alamat",
        "tempat_lahir",
        "tanggal_lahir",
        "nama_orangtua",
        "telepon_orangtua",
        "aktif",
        "created_at",
        "updated_at",
        "pengguna:pengguna_id(id, username, email, nama_lengkap, peran, telepon, aktif, created_at, updated_at)",
        "orang_tua_siswa(id, pengguna_id, hubungan, created_at, pengguna:pengguna_id(id, username, email, nama_lengkap, peran, telepon, aktif, created_at, updated_at))",
      ].join(", "),
    )
    .in("kelas", KELAS_XII)
    .order("nis", { ascending: true }),
  "Gagal memuat siswa kelas XII",
);

if (!students.length) {
  console.log("Tidak ada siswa kelas XII.");
  process.exit(0);
}

const siswaIds = students.map((student) => student.id);
const studentPenggunaIds = students.map((student) => student.pengguna_id);
const parentPenggunaIds = Array.from(
  new Set(
    students.flatMap((student) =>
      (student.orang_tua_siswa ?? []).map((relation) => relation.pengguna_id),
    ),
  ),
);

const related = {
  pengajuan_anggota: await countRows("pengajuan_anggota", siswaIds),
  jurnal: await countRows("jurnal", siswaIds),
  tugas_siswa: await countRows("tugas_siswa", siswaIds),
  mutabaah_harian: await countRows("mutabaah_harian", siswaIds),
  penilaian: await countRows("penilaian", siswaIds),
  sertifikat: await countRows("sertifikat", siswaIds),
};

const relatedTotal = Object.values(related).reduce(
  (total, value) => total + value,
  0,
);

const backup = {
  dibuat_pada: new Date().toISOString(),
  kelas: KELAS_XII,
  siswa: students,
};

if (args.execute && fs.existsSync(args.out) && !args.force) {
  throw new Error(
    `Berkas ${args.out} sudah ada. Gunakan --force untuk menimpa.`,
  );
}

console.log(
  JSON.stringify(
    {
      mode: args.execute ? "execute" : "preview",
      out: args.out,
      siswa: students.length,
      relasi_orang_tua: students.reduce(
        (total, student) => total + (student.orang_tua_siswa ?? []).length,
        0,
      ),
      akun_orang_tua_terkait: parentPenggunaIds.length,
      data_terkait: related,
      data_terkait_total: relatedTotal,
    },
    null,
    2,
  ),
);

if (relatedTotal > 0) {
  throw new Error(
    "Masih ada data pengajuan/jurnal/tugas/mutaba'ah/penilaian/sertifikat. Hapus atau arsipkan data tersebut lebih dulu.",
  );
}

if (!args.execute) {
  console.log("\nPratinjau selesai. Tambahkan --execute untuk menghapus.");
  process.exit(0);
}

fs.writeFileSync(args.out, `${JSON.stringify(backup, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600,
});
console.log(`Cadangan ditulis: ${args.out}`);

must(
  await admin.from("orang_tua_siswa").delete().in("siswa_id", siswaIds),
  "Gagal menghapus relasi orang tua",
);

must(
  await admin.from("siswa").delete().in("id", siswaIds),
  "Gagal menghapus siswa",
);

const remainingRelations = must(
  await admin
    .from("orang_tua_siswa")
    .select("pengguna_id")
    .in("pengguna_id", parentPenggunaIds),
  "Gagal memeriksa relasi orang tua yang tersisa",
);

const stillLinked = new Set(
  (remainingRelations ?? []).map((relation) => relation.pengguna_id),
);
const orphanParentIds = parentPenggunaIds.filter(
  (penggunaId) => !stillLinked.has(penggunaId),
);

must(
  await admin
    .from("pengguna")
    .delete()
    .in("id", [...studentPenggunaIds, ...orphanParentIds]),
  "Gagal menghapus profil pengguna",
);

const authErrors = [];

for (const penggunaId of [...studentPenggunaIds, ...orphanParentIds]) {
  const result = await admin.auth.admin.deleteUser(penggunaId);

  if (result.error && !result.error.message.toLowerCase().includes("not found")) {
    authErrors.push(`${penggunaId}: ${result.error.message}`);
  }
}

await admin.from("log_aktivitas").insert({
  pengguna_id: null,
  aksi: "hapus_siswa_kelas_xii",
  entitas: "siswa",
  detail: {
    jumlah_siswa: students.length,
    nis: students.map((student) => student.nis),
    jumlah_akun_orang_tua_dihapus: orphanParentIds.length,
    akun_orang_tua_dipertahankan: parentPenggunaIds.length - orphanParentIds.length,
  },
});

console.log(
  JSON.stringify(
    {
      dihapus: {
        siswa: students.length,
        akun_siswa: studentPenggunaIds.length,
        akun_orang_tua: orphanParentIds.length,
        relasi_orang_tua: backup.siswa.reduce(
          (total, student) => total + (student.orang_tua_siswa ?? []).length,
          0,
        ),
      },
      akun_orang_tua_dipertahankan:
        parentPenggunaIds.length - orphanParentIds.length,
      auth_errors: authErrors,
    },
    null,
    2,
  ),
);

if (authErrors.length) {
  console.error("\nAkun Auth yang gagal dihapus:");
  for (const error of authErrors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}
