import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envPath = ".env.local";
const envText = fs.readFileSync(envPath, "utf8");

for (const line of envText.split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);

  if (match) {
    process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi.",
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const simulationPattern = "[SIMULASI]%";

const samples = [
  {
    username: "admin",
    judul: "[SIMULASI] Pengajuan PKL baru",
    pesan: "Ada pengajuan PKL baru yang menunggu verifikasi admin.",
    tautan: "/admin/pengajuan",
  },
  {
    username: "admin",
    judul: "[SIMULASI] Dokumen izin diunggah",
    pesan: "Izin orang tua sudah diunggah dan menunggu pemeriksaan.",
    tautan: "/admin/pengajuan",
  },
  {
    username: "20240001",
    judul: "[SIMULASI] Pengajuan PKL diterima",
    pesan: "Pengajuan PKL sudah diterima. Cek halaman pengajuan.",
    tautan: "/siswa/pengajuan",
  },
  {
    username: "20240001",
    judul: "[SIMULASI] Surat keberangkatan terbit",
    pesan: "Surat keberangkatan sudah bisa dilihat dan diunduh.",
    tautan: "/siswa/surat",
  },
  {
    username: "guru.sandi",
    judul: "[SIMULASI] Jurnal menunggu verifikasi",
    pesan: "Ada jurnal siswa bimbingan yang perlu diverifikasi.",
    tautan: "/guru/verifikasi",
  },
  {
    username: "instruktur.mitra",
    judul: "[SIMULASI] Siswa ditempatkan",
    pesan: "Siswa PKL sudah ditempatkan di perusahaan Anda.",
    tautan: "/instruktur/siswa",
  },
  {
    username: "ortu",
    judul: "[SIMULASI] Anak mengisi mutaba'ah",
    pesan: "Anak Anda sudah mengisi mutaba'ah hari ini.",
    tautan: "/ortu/mutabaah",
  },
];

async function clearSimulation() {
  const { error } = await admin
    .from("notifikasi")
    .delete()
    .like("judul", simulationPattern);

  if (error) {
    throw new Error(`Gagal menghapus simulasi notifikasi: ${error.message}`);
  }

  console.log("Semua notifikasi [SIMULASI] sudah dihapus.");
}

async function createSimulation() {
  const usernames = Array.from(
    new Set(samples.map((sample) => sample.username)),
  );
  const { data: users, error: userError } = await admin
    .from("pengguna")
    .select("id, username")
    .in("username", usernames);

  if (userError) {
    throw new Error(`Gagal memuat akun demo: ${userError.message}`);
  }

  const userIdByUsername = new Map(
    (users ?? []).map((user) => [user.username, user.id]),
  );
  const missing = usernames.filter(
    (username) => !userIdByUsername.has(username),
  );

  if (missing.length) {
    throw new Error(
      `Akun demo belum lengkap: ${missing.join(", ")}. Jalankan npm run seed:demo lebih dulu.`,
    );
  }

  await admin
    .from("notifikasi")
    .delete()
    .like("judul", simulationPattern);

  const rows = samples.map((sample) => ({
    pengguna_id: userIdByUsername.get(sample.username),
    judul: sample.judul,
    pesan: sample.pesan,
    tautan: sample.tautan,
    dibaca: false,
  }));

  const { data: inserted, error: insertError } = await admin
    .from("notifikasi")
    .insert(rows)
    .select("id, judul");

  if (insertError) {
    throw new Error(
      `Gagal membuat simulasi notifikasi: ${insertError.message}`,
    );
  }

  console.log(`Simulasi notifikasi dibuat: ${inserted?.length ?? 0} notifikasi.`);
  console.log("");
  console.log("Login sebagai salah satu akun demo, lalu buka lonceng notifikasi:");
  for (const sample of samples) {
    console.log(`- ${sample.username}: ${sample.judul}`);
  }
  console.log("");
  console.log("Hapus simulasi: npm run notif:clear");
}

async function withRetry(action) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

try {
  if (process.argv.includes("--clear")) {
    await withRetry(clearSimulation);
  } else {
    await withRetry(createSimulation);
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Simulasi notifikasi gagal.",
  );
  process.exitCode = 1;
}
