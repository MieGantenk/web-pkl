/**
 * DEV ONLY — data demo untuk login, beranda siswa, ringkasan admin,
 * dan beranda orang tua.
 *
 *   npm run seed:demo
 *
 * Script ini membuat akun dan data contoh yang idempoten.
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

function isoAt(isoDate, time = "09:00:00") {
  return `${isoDate}T${time}+07:00`;
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
const ADMIN_EMAIL = "admin.demo@example.com";
const ADMIN_USERNAME = "admin";
const ADMIN_NAMA = "Admin PKL";
const ORTU_EMAIL = "ortu.demo@example.com";
const ORTU_USERNAME = "ortu";
const ORTU_NAMA = "Fauzi Ahmad";

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
  perusahaan2: uuidFor("demo-perusahaan-nusantara"),
  perusahaan3: uuidFor("demo-perusahaan-karya"),
  periode: uuidFor("demo-periode-pkl"),
  siswa: uuidFor("demo-siswa-farel"),
  siswaAhmad: uuidFor("demo-siswa-ahmad"),
  siswaHisyam: uuidFor("demo-siswa-hisyam"),
  siswaAbdullah: uuidFor("demo-siswa-abdullah"),
  siswaIsa: uuidFor("demo-siswa-isa"),
  guruSandi: uuidFor("demo-guru-sandi"),
  guruRina: uuidFor("demo-guru-rina"),
  orangTua: uuidFor("demo-orang-tua-fauzi"),
  relasiOrtuFarel: uuidFor("demo-relasi-ortu-farel"),
  relasiOrtuAhmad: uuidFor("demo-relasi-ortu-ahmad"),
  pengajuan: uuidFor("demo-pengajuan-farel"),
  pengajuanAhmad: uuidFor("demo-pengajuan-ahmad"),
  pengajuanHisyam: uuidFor("demo-pengajuan-hisyam"),
  pengajuanAbdullah: uuidFor("demo-pengajuan-abdullah"),
  anggota: uuidFor("demo-anggota-farel"),
  anggotaAhmad: uuidFor("demo-anggota-ahmad"),
  anggotaHisyam: uuidFor("demo-anggota-hisyam"),
  anggotaAbdullah: uuidFor("demo-anggota-abdullah"),
  surat: uuidFor("demo-surat-keberangkatan"),
  jurnalAhmad: uuidFor("demo-jurnal-ahmad"),
  jurnalHisyam: uuidFor("demo-jurnal-hisyam"),
  verifikasiHisyamGuru: uuidFor("demo-verifikasi-hisyam-guru"),
  form: uuidFor("demo-mutabaah-form"),
  q1: uuidFor("demo-mutabaah-q1"),
  q2: uuidFor("demo-mutabaah-q2"),
  q3: uuidFor("demo-mutabaah-q3"),
  o1: uuidFor("demo-mutabaah-o1"),
  o2: uuidFor("demo-mutabaah-o2"),
  o3: uuidFor("demo-mutabaah-o3"),
  log1: uuidFor("demo-log-1"),
  log2: uuidFor("demo-log-2"),
  log3: uuidFor("demo-log-3"),
  log4: uuidFor("demo-log-4"),
  log5: uuidFor("demo-log-5"),
};

const { data: list } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
const users = list?.users ?? [];

async function ensureDemoUser({ email, username, nama, peran }) {
  let account = users.find((entry) => entry.email === email);

  if (account) {
    must(
      await admin.auth.admin.updateUserById(account.id, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { username, nama_lengkap: nama },
        app_metadata: { peran },
      }),
      `update user ${username}`,
    );
  } else {
    const created = must(
      await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { username, nama_lengkap: nama },
        app_metadata: { peran },
      }),
      `create user ${username}`,
    );
    account = created.user;
    if (account) users.push(account);
  }

  if (!account) {
    throw new Error(`User ${username} tidak terbentuk.`);
  }

  must(
    await admin.from("pengguna").upsert(
      {
        id: account.id,
        username,
        email,
        nama_lengkap: nama,
        peran,
        aktif: true,
      },
      { onConflict: "id" },
    ),
    `upsert pengguna ${username}`,
  );

  return account;
}

const farel = await ensureDemoUser({
  email: EMAIL,
  username: USERNAME,
  nama: NAMA,
  peran: "siswa",
});
const adminUser = await ensureDemoUser({
  email: ADMIN_EMAIL,
  username: ADMIN_USERNAME,
  nama: ADMIN_NAMA,
  peran: "admin",
});
const guruSandi = await ensureDemoUser({
  email: "guru.sandi@example.com",
  username: "guru.sandi",
  nama: "Sandi Pratama",
  peran: "guru",
});
const guruRina = await ensureDemoUser({
  email: "guru.rina@example.com",
  username: "guru.rina",
  nama: "Rina Kusuma",
  peran: "guru",
});
const ahmad = await ensureDemoUser({
  email: "ahmad.demo@example.com",
  username: "20240002",
  nama: "Ahmad Fairuz",
  peran: "siswa",
});
const hisyam = await ensureDemoUser({
  email: "hisyam.demo@example.com",
  username: "20240003",
  nama: "Hisyam",
  peran: "siswa",
});
const abdullah = await ensureDemoUser({
  email: "abdullah.demo@example.com",
  username: "20240004",
  nama: "Abdullah",
  peran: "siswa",
});
const isa = await ensureDemoUser({
  email: "isa.demo@example.com",
  username: "20240005",
  nama: "Isa",
  peran: "siswa",
});
const ortu = await ensureDemoUser({
  email: ORTU_EMAIL,
  username: ORTU_USERNAME,
  nama: ORTU_NAMA,
  peran: "ortu",
});

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
    [
      {
        id: ids.perusahaan,
        nama: "PT MitraComm",
        alamat: "Kawasan Industri Jalancagak",
        kota: "Subang",
        aktif: true,
      },
      {
        id: ids.perusahaan2,
        nama: "PT Nusantara Digital",
        alamat: "Jalan Soekarno-Hatta",
        kota: "Bandung",
        aktif: true,
      },
      {
        id: ids.perusahaan3,
        nama: "CV Karya Mandiri",
        alamat: "Kawasan Industri Subang",
        kota: "Subang",
        aktif: true,
      },
    ],
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
      tanggal_mulai: `${year}-07-01`,
      tanggal_selesai: `${year}-12-31`,
      aktif: true,
    },
    { onConflict: "id" },
  ),
  "upsert periode",
);

must(
  await admin.from("guru").upsert(
    [
      {
        id: ids.guruSandi,
        pengguna_id: guruSandi.id,
        nip: "198701012010011001",
        jabatan: "Guru Pembimbing",
        jurusan_id: ids.jurusan,
      },
      {
        id: ids.guruRina,
        pengguna_id: guruRina.id,
        nip: "199002022015022002",
        jabatan: "Guru Pembimbing",
        jurusan_id: ids.jurusan,
      },
    ],
    { onConflict: "id" },
  ),
  "upsert guru",
);

must(
  await admin.from("siswa").upsert(
    [
      {
        id: ids.siswa,
        pengguna_id: farel.id,
        nis: USERNAME,
        kelas: "XI RPL",
        jurusan_id: ids.jurusan,
        aktif: true,
      },
      {
        id: ids.siswaAhmad,
        pengguna_id: ahmad.id,
        nis: "20240002",
        kelas: "XI RPL",
        jurusan_id: ids.jurusan,
        aktif: true,
      },
      {
        id: ids.siswaHisyam,
        pengguna_id: hisyam.id,
        nis: "20240003",
        kelas: "XI RPL",
        jurusan_id: ids.jurusan,
        aktif: true,
      },
      {
        id: ids.siswaAbdullah,
        pengguna_id: abdullah.id,
        nis: "20240004",
        kelas: "XI RPL",
        jurusan_id: ids.jurusan,
        aktif: true,
      },
      {
        id: ids.siswaIsa,
        pengguna_id: isa.id,
        nis: "20240005",
        kelas: "XI RPL",
        jurusan_id: ids.jurusan,
        aktif: true,
      },
    ],
    { onConflict: "id" },
  ),
  "upsert siswa",
);

must(
  await admin.from("orang_tua_siswa").upsert(
    [
      {
        id: ids.relasiOrtuFarel,
        pengguna_id: ortu.id,
        siswa_id: ids.siswa,
        hubungan: "ayah",
        created_at: isoAt(today, "08:00:00"),
      },
      {
        id: ids.relasiOrtuAhmad,
        pengguna_id: ortu.id,
        siswa_id: ids.siswaAhmad,
        hubungan: "ayah",
        created_at: isoAt(today, "08:01:00"),
      },
    ],
    { onConflict: "pengguna_id,siswa_id" },
  ),
  "upsert relasi orang tua",
);

must(
  await admin.from("pengajuan_pkl").upsert(
    [
      {
        id: ids.pengajuan,
        perusahaan_id: ids.perusahaan,
        periode_id: ids.periode,
        dibuat_oleh: farel.id,
        tanggal_mulai: addDays(today, -16),
        tanggal_selesai: addDays(today, 60),
        status: "berlangsung",
        created_at: isoAt(addDays(today, -16), "08:00:00"),
      },
      {
        id: ids.pengajuanAhmad,
        perusahaan_id: ids.perusahaan2,
        periode_id: ids.periode,
        dibuat_oleh: ahmad.id,
        status: "balasan_diunggah",
        created_at: isoAt(addDays(today, -60), "09:00:00"),
      },
      {
        id: ids.pengajuanHisyam,
        perusahaan_id: ids.perusahaan3,
        periode_id: ids.periode,
        dibuat_oleh: hisyam.id,
        tanggal_mulai: addDays(today, -20),
        tanggal_selesai: addDays(today, 70),
        status: "diterima",
        created_at: isoAt(addDays(today, -90), "10:00:00"),
      },
      {
        id: ids.pengajuanAbdullah,
        perusahaan_id: ids.perusahaan,
        periode_id: ids.periode,
        dibuat_oleh: abdullah.id,
        status: "izin_ortu_diunggah",
        created_at: isoAt(addDays(today, -30), "08:30:00"),
      },
    ],
    { onConflict: "id" },
  ),
  "upsert pengajuan",
);

must(
  await admin.from("pengajuan_anggota").upsert(
    [
      {
        id: ids.anggota,
        pengajuan_id: ids.pengajuan,
        siswa_id: ids.siswa,
        peran: "ketua",
      },
      {
        id: ids.anggotaAhmad,
        pengajuan_id: ids.pengajuanAhmad,
        siswa_id: ids.siswaAhmad,
        peran: "ketua",
      },
      {
        id: ids.anggotaHisyam,
        pengajuan_id: ids.pengajuanHisyam,
        siswa_id: ids.siswaHisyam,
        peran: "ketua",
      },
      {
        id: ids.anggotaAbdullah,
        pengajuan_id: ids.pengajuanAbdullah,
        siswa_id: ids.siswaAbdullah,
        peran: "ketua",
      },
    ],
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
      dibuat_oleh: farel.id,
    },
    { onConflict: "id" },
  ),
  "upsert surat",
);

const journals = [
  {
    id: uuidFor(`demo-jurnal-${addDays(today, -1)}`),
    studentId: ids.siswa,
    pengajuanId: ids.pengajuan,
    date: addDays(today, -1),
    kegiatan: "Menyusun laporan stok gudang",
    deskripsi:
      "Merekap data stok masuk dan keluar, lalu mencocokkannya dengan catatan tim gudang.",
    mulai: "08:00",
    selesai: "16:00",
    status: "menunggu",
  },
  {
    id: uuidFor(`demo-jurnal-${addDays(today, -2)}`),
    studentId: ids.siswa,
    pengajuanId: ids.pengajuan,
    date: addDays(today, -2),
    kegiatan: "Pendampingan administrasi pengiriman",
    deskripsi:
      "Membantu menyiapkan dokumen pengiriman dan memeriksa kelengkapan tanda terima.",
    mulai: "07:30",
    selesai: "15:30",
    status: "menunggu",
  },
  {
    id: uuidFor(`demo-jurnal-${addDays(today, -4)}`),
    studentId: ids.siswa,
    pengajuanId: ids.pengajuan,
    date: addDays(today, -4),
    kegiatan: "Orientasi alur kerja perusahaan",
    deskripsi:
      "Mengikuti penjelasan alur kerja divisi operasional bersama pembimbing lapangan.",
    mulai: "08:00",
    selesai: "14:00",
    status: "menunggu",
  },
  {
    id: ids.jurnalAhmad,
    studentId: ids.siswaAhmad,
    pengajuanId: ids.pengajuanAhmad,
    date: addDays(today, -1),
    kegiatan: "Menyusun rekap data pelanggan",
    deskripsi:
      "Merapikan data pelanggan baru dan memeriksa kelengkapan kontak.",
    mulai: "08:30",
    selesai: "16:30",
    status: "menunggu",
  },
  {
    id: ids.jurnalHisyam,
    studentId: ids.siswaHisyam,
    pengajuanId: ids.pengajuanHisyam,
    date: addDays(today, -2),
    kegiatan: "Pendampingan pengujian aplikasi",
    deskripsi:
      "Membantu tim QA menjalankan skenario pengujian dan mencatat temuan.",
    mulai: "09:00",
    selesai: "17:00",
    status: "terverifikasi_guru",
  },
];

for (const journal of journals) {
  must(
    await admin.from("jurnal").upsert(
      {
        id: journal.id,
        siswa_id: journal.studentId,
        pengajuan_id: journal.pengajuanId,
        tanggal: journal.date,
        waktu_mulai: journal.mulai,
        waktu_selesai: journal.selesai,
        kegiatan: journal.kegiatan,
        deskripsi: journal.deskripsi,
        status: journal.status,
      },
      { onConflict: "id" },
    ),
    `upsert jurnal ${journal.date}`,
  );
}

must(
  await admin.from("verifikasi_jurnal").upsert(
    {
      id: ids.verifikasiHisyamGuru,
      jurnal_id: ids.jurnalHisyam,
      verifikator_id: guruSandi.id,
      peran: "guru",
      status: "diterima",
      catatan: "Kegiatan sudah sesuai.",
    },
    { onConflict: "id" },
  ),
  "upsert verifikasi jurnal",
);

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

must(
  await admin.from("log_aktivitas").upsert(
    [
      {
        id: ids.log1,
        pengguna_id: adminUser.id,
        aksi: "approve_pengajuan",
        entitas: "pengajuan_pkl",
        entitas_id: ids.pengajuanHisyam,
        detail: { sumber: "demo" },
        created_at: isoAt(addDays(today, -10), "11:00:00"),
      },
      {
        id: ids.log2,
        pengguna_id: guruSandi.id,
        aksi: "verifikasi_jurnal",
        entitas: "jurnal",
        entitas_id: ids.jurnalHisyam,
        detail: { sumber: "demo" },
        created_at: isoAt(addDays(today, -2), "15:00:00"),
      },
      {
        id: ids.log3,
        pengguna_id: ahmad.id,
        aksi: "upload_dokumen",
        entitas: "pengajuan_pkl",
        entitas_id: ids.pengajuanAhmad,
        detail: { sumber: "demo" },
        created_at: isoAt(addDays(today, -1), "09:15:00"),
      },
      {
        id: ids.log4,
        pengguna_id: adminUser.id,
        aksi: "terbit_surat",
        entitas: "surat",
        entitas_id: ids.surat,
        detail: { sumber: "demo" },
        created_at: isoAt(addDays(today, -20), "10:00:00"),
      },
      {
        id: ids.log5,
        pengguna_id: adminUser.id,
        aksi: "mulai_pkl",
        entitas: "pengajuan_pkl",
        entitas_id: ids.pengajuan,
        detail: { sumber: "demo" },
        created_at: isoAt(addDays(today, -16), "08:00:00"),
      },
    ],
    { onConflict: "id" },
  ),
  "upsert log aktivitas",
);

console.log("Data demo siap.");
console.log(`Admin: ${ADMIN_USERNAME} / ${PASSWORD}`);
console.log(`Email admin: ${ADMIN_EMAIL}`);
console.log(`Siswa: ${USERNAME} / ${PASSWORD}`);
console.log(`Email siswa: ${EMAIL}`);
console.log(`Orang tua: ${ORTU_USERNAME} / ${PASSWORD}`);
console.log(`Email orang tua: ${ORTU_EMAIL}`);
