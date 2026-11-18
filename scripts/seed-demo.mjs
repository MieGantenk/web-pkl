/**
 * DEV ONLY — data demo untuk halaman login dan beranda siswa.
 *
 *   npm run seed:demo
 *
 * Script ini membuat satu akun siswa dan data contoh yang idempoten.
 * Jangan jalankan pada database produksi.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const text = fs.readFileSync(".env.local", "utf8");

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (!match) continue;

    const [, key, raw] = match;
    const value = raw.replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function uuidFor(key) {
  const hash = crypto.createHash("sha1").update(key).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function must(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

loadEnv();

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "siswa.demo@example.com";
const PASSWORD = "DemoPKL2026!";
const USERNAME = "20240001";
const NAMA = "Farel Ahmad";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const year = Number(today.slice(0, 4));
const tahunAjaran = `${year}/${year + 1}`;

const ids = {
  jurusan: uuidFor("demo-jurusan-rpl"),
  perusahaan: uuidFor("demo-perusahaan-mitracomm"),
  periode: uuidFor("demo-periode-pkl"),
  siswa: uuidFor("demo-siswa-farel"),
  pengajuan: uuidFor("demo-pengajuan-farel"),
  anggota: uuidFor("demo-anggota-farel"),
  surat: uuidFor("demo-surat-keberangkatan"),
  form: uuidFor("demo-mutabaah-form"),
  q1: uuidFor("demo-mutabaah-q1"),
  q2: uuidFor("demo-mutabaah-q2"),
  q3: uuidFor("demo-mutabaah-q3"),
  o1: uuidFor("demo-mutabaah-o1"),
  o2: uuidFor("demo-mutabaah-o2"),
  o3: uuidFor("demo-mutabaah-o3"),
};

const { data: list } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

let user = list.users.find((entry) => entry.email === EMAIL);

if (user) {
  must(
    await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: USERNAME, nama_lengkap: NAMA },
      app_metadata: { peran: "siswa" },
    }),
    "update user demo",
  );
} else {
  const created = must(
    await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: USERNAME, nama_lengkap: NAMA },
      app_metadata: { peran: "siswa" },
    }),
    "create user demo",
  );
  user = created.user;
}

if (!user) {
  throw new Error("User demo tidak terbentuk.");
}

must(
  await admin.from("pengguna").upsert(
    {
      id: user.id,
      username: USERNAME,
      email: EMAIL,
      nama_lengkap: NAMA,
      peran: "siswa",
      aktif: true,
    },
    { onConflict: "id" },
  ),
  "upsert pengguna",
);

must(
  await admin.from("jurusan").upsert(
    {
      id: ids.jurusan,
      nama: "Rekayasa Perangkat Lunak",
      kode: "RPL",
    },
    { onConflict: "id" },
  ),
  "upsert jurusan",
);

must(
  await admin.from("perusahaan").upsert(
    {
      id: ids.perusahaan,
      nama: "PT MitraComm",
      alamat: "Kawasan Industri Jalancagak",
      kota: "Subang",
      aktif: true,
    },
    { onConflict: "id" },
  ),
  "upsert perusahaan",
);

must(
  await admin.from("periode_pkl").upsert(
    {
      id: ids.periode,
      nama: `PKL Ganjil ${tahunAjaran}`,
      tahun_ajaran: tahunAjaran,
      tanggal_mulai: addDays(today, -30),
      tanggal_selesai: addDays(today, 90),
      aktif: true,
    },
    { onConflict: "id" },
  ),
  "upsert periode",
);

must(
  await admin.from("siswa").upsert(
    {
      id: ids.siswa,
      pengguna_id: user.id,
      nis: USERNAME,
      kelas: "XI RPL",
      jurusan_id: ids.jurusan,
      aktif: true,
    },
    { onConflict: "id" },
  ),
  "upsert siswa",
);

must(
  await admin.from("pengajuan_pkl").upsert(
    {
      id: ids.pengajuan,
      perusahaan_id: ids.perusahaan,
      periode_id: ids.periode,
      dibuat_oleh: user.id,
      tanggal_mulai: addDays(today, -16),
      tanggal_selesai: addDays(today, 60),
      status: "berlangsung",
    },
    { onConflict: "id" },
  ),
  "upsert pengajuan",
);

must(
  await admin.from("pengajuan_anggota").upsert(
    {
      id: ids.anggota,
      pengajuan_id: ids.pengajuan,
      siswa_id: ids.siswa,
      peran: "ketua",
    },
    { onConflict: "pengajuan_id,siswa_id" },
  ),
  "upsert anggota",
);

must(
  await admin.from("surat").upsert(
    {
      id: ids.surat,
      pengajuan_id: ids.pengajuan,
      jenis: "keberangkatan",
      nomor: `001/PKL/SMK-IT/XI/${year}`,
      tanggal_terbit: addDays(today, -20),
      status: "terbit",
      dibuat_oleh: user.id,
    },
    { onConflict: "id" },
  ),
  "upsert surat",
);

const journals = [
  {
    date: addDays(today, -1),
    kegiatan: "Menyusun laporan stok gudang",
    deskripsi:
      "Merekap data stok masuk dan keluar, lalu mencocokkannya dengan catatan tim gudang.",
    mulai: "08:00",
    selesai: "16:00",
  },
  {
    date: addDays(today, -2),
    kegiatan: "Pendampingan administrasi pengiriman",
    deskripsi:
      "Membantu menyiapkan dokumen pengiriman dan memeriksa kelengkapan tanda terima.",
    mulai: "07:30",
    selesai: "15:30",
  },
  {
    date: addDays(today, -4),
    kegiatan: "Orientasi alur kerja perusahaan",
    deskripsi:
      "Mengikuti penjelasan alur kerja divisi operasional bersama pembimbing lapangan.",
    mulai: "08:00",
    selesai: "14:00",
  },
];

for (const journal of journals) {
  must(
    await admin.from("jurnal").upsert(
      {
        id: uuidFor(`demo-jurnal-${journal.date}`),
        siswa_id: ids.siswa,
        pengajuan_id: ids.pengajuan,
        tanggal: journal.date,
        waktu_mulai: journal.mulai,
        waktu_selesai: journal.selesai,
        kegiatan: journal.kegiatan,
        deskripsi: journal.deskripsi,
        status: "menunggu",
      },
      { onConflict: "id" },
    ),
    `upsert jurnal ${journal.date}`,
  );
}

must(
  await admin.from("mutabaah_form").upsert(
    {
      id: ids.form,
      nama: "Mutaba'ah Harian",
      deskripsi: "Checklist harian siswa selama PKL.",
      versi: 1,
      periode_id: ids.periode,
      status: "aktif",
    },
    { onConflict: "id" },
  ),
  "upsert form mutabaah",
);

must(
  await admin.from("mutabaah_pertanyaan").upsert(
    [
      {
        id: ids.q1,
        form_id: ids.form,
        pertanyaan: "Shalat subuh berjamaah",
        tipe: "ya_tidak",
        wajib: true,
        urutan: 1,
      },
      {
        id: ids.q2,
        form_id: ids.form,
        pertanyaan: "Tilawah hari ini",
        tipe: "isian_angka",
        wajib: true,
        urutan: 2,
        min_angka: 0,
        max_angka: 20,
        satuan: "halaman",
      },
      {
        id: ids.q3,
        form_id: ids.form,
        pertanyaan: "Amalan yang dilakukan",
        tipe: "pilih_banyak",
        wajib: true,
        urutan: 3,
      },
    ],
    { onConflict: "id" },
  ),
  "upsert pertanyaan mutabaah",
);

must(
  await admin.from("mutabaah_opsi").upsert(
    [
      { id: ids.o1, pertanyaan_id: ids.q3, label: "Membantu orang tua", urutan: 1 },
      { id: ids.o2, pertanyaan_id: ids.q3, label: "Olahraga", urutan: 2 },
      { id: ids.o3, pertanyaan_id: ids.q3, label: "Membaca buku", urutan: 3 },
    ],
    { onConflict: "id" },
  ),
  "upsert opsi mutabaah",
);

for (const offset of [0, -1, -2]) {
  const date = addDays(today, offset);

  must(
    await admin.from("mutabaah_harian").upsert(
      {
        id: uuidFor(`demo-mutabaah-${date}`),
        siswa_id: ids.siswa,
        form_id: ids.form,
        tanggal: date,
      },
      { onConflict: "id" },
    ),
    `upsert mutabaah ${date}`,
  );
}

console.log("Data demo siap.");
console.log(`Login: ${USERNAME}`);
console.log(`Email: ${EMAIL}`);
console.log(`Kata sandi: ${PASSWORD}`);
