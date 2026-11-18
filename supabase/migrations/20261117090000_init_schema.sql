-- ============================================================================
--  Web PKL — Initial schema
--  Source: ERD.dbml (29 tables, 15 enums)
--  Supabase/PostgreSQL
--
--  Catatan:
--  - auth.users dibuat otomatis oleh Supabase. Jangan dibuat manual.
--  - Semua updated_at diurus trigger public.set_updated_at().
--  - RLS ada di migration berikutnya.
-- ============================================================================

set search_path = public;

CREATE TYPE public."peran_pengguna" AS ENUM (
  'admin',
  'guru',
  'siswa',
  'instruktur',
  'ortu'
);

CREATE TYPE public."status_pengajuan" AS ENUM (
  'draft',
  'diajukan',
  'izin_ortu_terbit',
  'izin_ortu_diunggah',
  'pengajuan_terbit',
  'balasan_diunggah',
  'diterima',
  'keberangkatan_terbit',
  'berlangsung',
  'penarikan_terbit',
  'selesai',
  'ditolak',
  'dibatalkan'
);

CREATE TYPE public."jenis_surat" AS ENUM (
  'izin_orang_tua',
  'pernyataan',
  'pengajuan',
  'keberangkatan',
  'tugas_monitoring',
  'perjanjian',
  'penarikan'
);

CREATE TYPE public."status_surat" AS ENUM (
  'draft',
  'terbit',
  'dibatalkan'
);

CREATE TYPE public."jenis_dokumen" AS ENUM (
  'izin_orang_tua_ttd',
  'surat_balasan_perusahaan',
  'surat_pernyataan',
  'dokumen_pendukung',
  'lainnya'
);

CREATE TYPE public."status_verifikasi" AS ENUM (
  'menunggu',
  'diterima',
  'revisi',
  'ditolak'
);

CREATE TYPE public."status_jurnal" AS ENUM (
  'menunggu',
  'terverifikasi_guru',
  'terverifikasi_instruktur',
  'revisi'
);

CREATE TYPE public."status_tugas" AS ENUM (
  'belum',
  'selesai',
  'terlambat'
);

CREATE TYPE public."tipe_pertanyaan" AS ENUM (
  'ya_tidak',
  'pilih_satu',
  'pilih_banyak',
  'isian_singkat',
  'isian_angka',
  'essay'
);

CREATE TYPE public."status_form" AS ENUM (
  'draft',
  'aktif',
  'arsip'
);

CREATE TYPE public."peran_anggota" AS ENUM (
  'ketua',
  'anggota'
);

CREATE TYPE public."peran_verifikator" AS ENUM (
  'guru',
  'instruktur'
);

CREATE TYPE public."peran_instruktur" AS ENUM (
  'instruktur',
  'pembimbing'
);

CREATE TYPE public."hubungan_ortu" AS ENUM (
  'ayah',
  'ibu',
  'wali'
);

CREATE TYPE public."peran_penilai" AS ENUM (
  'guru',
  'instruktur'
);

CREATE TABLE public."pengguna" (
  "id" uuid PRIMARY KEY,
  "username" varchar(100) UNIQUE NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "nama_lengkap" varchar(150) NOT NULL,
  "peran" peran_pengguna NOT NULL,
  "telepon" varchar(25),
  "avatar_url" text,
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."jurusan" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nama" varchar(150) UNIQUE NOT NULL,
  "kode" varchar(20) UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."guru" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid UNIQUE NOT NULL,
  "nip" varchar(30) UNIQUE,
  "nuptk" varchar(30) UNIQUE,
  "jabatan" varchar(100),
  "jurusan_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."siswa" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid UNIQUE NOT NULL,
  "nis" varchar(30) UNIQUE NOT NULL,
  "nisn" varchar(30) UNIQUE,
  "kelas" varchar(30),
  "jurusan_id" uuid,
  "telepon" varchar(25),
  "alamat" text,
  "tempat_lahir" varchar(100),
  "tanggal_lahir" date,
  "nama_orangtua" varchar(150),
  "telepon_orangtua" varchar(25),
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."perusahaan" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nama" varchar(200) NOT NULL,
  "alamat" text NOT NULL,
  "kota" varchar(100),
  "telepon" varchar(30),
  "email" varchar(255),
  "website" varchar(255),
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."periode_pkl" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nama" varchar(100) NOT NULL,
  "tahun_ajaran" varchar(20) NOT NULL,
  "tanggal_mulai" date NOT NULL,
  "tanggal_selesai" date NOT NULL,
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."instruktur" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid NOT NULL,
  "perusahaan_id" uuid NOT NULL,
  "peran" peran_instruktur NOT NULL DEFAULT 'instruktur',
  "jabatan" varchar(100),
  "telepon" varchar(30),
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."orang_tua_siswa" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid NOT NULL,
  "siswa_id" uuid NOT NULL,
  "hubungan" hubungan_ortu NOT NULL DEFAULT 'wali',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."pengajuan_pkl" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "perusahaan_id" uuid NOT NULL,
  "periode_id" uuid NOT NULL,
  "dibuat_oleh" uuid NOT NULL,
  "guru_pembimbing_id" uuid,
  "instruktur_id" uuid,
  "pembimbing_id" uuid,
  "tanggal_mulai" date,
  "tanggal_selesai" date,
  "status" status_pengajuan NOT NULL DEFAULT 'draft',
  "catatan" text,
  "alasan_penolakan" text,
  "diverifikasi_oleh" uuid,
  "diverifikasi_pada" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."pengajuan_anggota" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengajuan_id" uuid NOT NULL,
  "siswa_id" uuid NOT NULL,
  "peran" peran_anggota NOT NULL DEFAULT 'anggota',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."surat" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengajuan_id" uuid NOT NULL,
  "jenis" jenis_surat NOT NULL,
  "nomor" varchar(100) UNIQUE,
  "tanggal_terbit" date,
  "file_path" text,
  "kode_verifikasi" varchar(50) UNIQUE,
  "status" status_surat NOT NULL DEFAULT 'draft',
  "dibuat_oleh" uuid,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."dokumen" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengajuan_id" uuid NOT NULL,
  "jenis" jenis_dokumen NOT NULL,
  "file_path" text NOT NULL,
  "file_name" varchar(255),
  "mime_type" varchar(100),
  "ukuran" integer,
  "diunggah_oleh" uuid NOT NULL,
  "diunggah_pada" timestamptz NOT NULL DEFAULT (now()),
  "status" status_verifikasi NOT NULL DEFAULT 'menunggu',
  "catatan" text,
  "diverifikasi_oleh" uuid,
  "diverifikasi_pada" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."jurnal" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "siswa_id" uuid NOT NULL,
  "pengajuan_id" uuid,
  "tanggal" date NOT NULL,
  "waktu_mulai" time,
  "waktu_selesai" time,
  "kegiatan" varchar(200) NOT NULL,
  "deskripsi" text,
  "ringkasan_ai" text,
  "foto_path" text,
  "status" status_jurnal NOT NULL DEFAULT 'menunggu',
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."verifikasi_jurnal" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "jurnal_id" uuid NOT NULL,
  "verifikator_id" uuid NOT NULL,
  "peran" peran_verifikator NOT NULL,
  "status" status_verifikasi NOT NULL DEFAULT 'menunggu',
  "catatan" text,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."tugas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengajuan_id" uuid NOT NULL,
  "guru_id" uuid NOT NULL,
  "judul" varchar(200) NOT NULL,
  "deskripsi" text,
  "deadline" date,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."tugas_siswa" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "tugas_id" uuid NOT NULL,
  "siswa_id" uuid NOT NULL,
  "status" status_tugas NOT NULL DEFAULT 'belum',
  "catatan" text,
  "file_path" text,
  "selesai_pada" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_form" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nama" varchar(150) NOT NULL,
  "deskripsi" text,
  "versi" integer NOT NULL DEFAULT 1,
  "periode_id" uuid,
  "status" status_form NOT NULL DEFAULT 'draft',
  "dibuat_oleh" uuid,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_pertanyaan" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "form_id" uuid NOT NULL,
  "pertanyaan" varchar(255) NOT NULL,
  "deskripsi" text,
  "tipe" tipe_pertanyaan NOT NULL DEFAULT 'ya_tidak',
  "wajib" boolean NOT NULL DEFAULT true,
  "urutan" integer NOT NULL DEFAULT 0,
  "min_angka" numeric(10,2),
  "max_angka" numeric(10,2),
  "satuan" varchar(30),
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_opsi" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pertanyaan_id" uuid NOT NULL,
  "label" varchar(150) NOT NULL,
  "nilai" varchar(100),
  "urutan" integer NOT NULL DEFAULT 0,
  "aktif" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_harian" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "siswa_id" uuid NOT NULL,
  "form_id" uuid NOT NULL,
  "tanggal" date NOT NULL,
  "catatan" text,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_jawaban" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "harian_id" uuid NOT NULL,
  "pertanyaan_id" uuid NOT NULL,
  "jawaban_teks" text,
  "jawaban_angka" numeric(10,2),
  "jawaban_boolean" boolean,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."mutabaah_jawaban_opsi" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "jawaban_id" uuid NOT NULL,
  "opsi_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."penilaian" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengajuan_id" uuid NOT NULL,
  "siswa_id" uuid NOT NULL,
  "penilai_id" uuid NOT NULL,
  "peran" peran_penilai NOT NULL,
  "nilai" numeric(5,2),
  "catatan" text,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."sertifikat" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "siswa_id" uuid NOT NULL,
  "pengajuan_id" uuid,
  "nomor" varchar(100) UNIQUE NOT NULL,
  "tanggal_terbit" date NOT NULL,
  "file_path" text,
  "dibuat_oleh" uuid,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."pengaturan_sekolah" (
  "id" smallint PRIMARY KEY DEFAULT 1,
  "nama_sekolah" varchar(200) NOT NULL,
  "alamat" text NOT NULL,
  "telepon" varchar(30),
  "email" varchar(255),
  "website" varchar(255),
  "kepala_sekolah" varchar(150),
  "nip_kepala" varchar(30),
  "akreditasi" varchar(100),
  "logo_path" text,
  "kop_path" text,
  "footer_path" text,
  "format_nomor_surat" varchar(200),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."penomoran_surat" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "jenis" jenis_surat NOT NULL,
  "tahun" integer NOT NULL,
  "urutan_terakhir" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."log_aktivitas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid,
  "aksi" varchar(100) NOT NULL,
  "entitas" varchar(100) NOT NULL,
  "entitas_id" uuid,
  "detail" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE public."notifikasi" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "pengguna_id" uuid NOT NULL,
  "judul" varchar(150) NOT NULL,
  "pesan" text NOT NULL,
  "tautan" text,
  "dibaca" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE INDEX ON public."pengguna" ("peran");

CREATE INDEX ON public."pengguna" ("aktif");

CREATE INDEX ON public."guru" ("jurusan_id");

CREATE INDEX ON public."siswa" ("jurusan_id");

CREATE INDEX ON public."siswa" ("aktif");

CREATE INDEX ON public."perusahaan" ("nama");

CREATE INDEX ON public."perusahaan" ("kota");

CREATE INDEX ON public."perusahaan" ("aktif");

CREATE UNIQUE INDEX ON public."periode_pkl" ("tahun_ajaran", "nama");

CREATE INDEX ON public."periode_pkl" ("aktif");

CREATE UNIQUE INDEX ON public."instruktur" ("pengguna_id", "perusahaan_id", "peran");

CREATE INDEX ON public."instruktur" ("perusahaan_id");

CREATE INDEX ON public."instruktur" ("pengguna_id");

CREATE UNIQUE INDEX ON public."orang_tua_siswa" ("pengguna_id", "siswa_id");

CREATE INDEX ON public."orang_tua_siswa" ("siswa_id");

CREATE INDEX ON public."pengajuan_pkl" ("perusahaan_id", "periode_id");

CREATE INDEX ON public."pengajuan_pkl" ("guru_pembimbing_id");

CREATE INDEX ON public."pengajuan_pkl" ("instruktur_id");

CREATE INDEX ON public."pengajuan_pkl" ("status");

CREATE UNIQUE INDEX ON public."pengajuan_anggota" ("pengajuan_id", "siswa_id");

CREATE INDEX ON public."pengajuan_anggota" ("siswa_id");

CREATE INDEX ON public."surat" ("pengajuan_id", "jenis");

CREATE INDEX ON public."surat" ("status");

CREATE INDEX ON public."surat" ("nomor");

CREATE INDEX ON public."dokumen" ("pengajuan_id", "jenis");

CREATE INDEX ON public."dokumen" ("status");

CREATE UNIQUE INDEX ON public."jurnal" ("siswa_id", "tanggal");

CREATE INDEX ON public."jurnal" ("status");

CREATE INDEX ON public."jurnal" ("pengajuan_id");

CREATE UNIQUE INDEX ON public."verifikasi_jurnal" ("jurnal_id", "peran");

CREATE INDEX ON public."verifikasi_jurnal" ("verifikator_id");

CREATE INDEX ON public."tugas" ("pengajuan_id");

CREATE INDEX ON public."tugas" ("guru_id");

CREATE INDEX ON public."tugas" ("deadline");

CREATE UNIQUE INDEX ON public."tugas_siswa" ("tugas_id", "siswa_id");

CREATE INDEX ON public."tugas_siswa" ("siswa_id");

CREATE INDEX ON public."tugas_siswa" ("status");

CREATE UNIQUE INDEX ON public."mutabaah_form" ("nama", "versi");

CREATE INDEX ON public."mutabaah_form" ("periode_id");

CREATE INDEX ON public."mutabaah_form" ("status");

CREATE INDEX ON public."mutabaah_pertanyaan" ("form_id");

CREATE INDEX ON public."mutabaah_pertanyaan" ("urutan");

CREATE INDEX ON public."mutabaah_pertanyaan" ("aktif");

CREATE INDEX ON public."mutabaah_opsi" ("pertanyaan_id");

CREATE INDEX ON public."mutabaah_opsi" ("urutan");

CREATE UNIQUE INDEX ON public."mutabaah_harian" ("siswa_id", "tanggal");

CREATE INDEX ON public."mutabaah_harian" ("form_id");

CREATE UNIQUE INDEX ON public."mutabaah_jawaban" ("harian_id", "pertanyaan_id");

CREATE INDEX ON public."mutabaah_jawaban" ("pertanyaan_id");

CREATE UNIQUE INDEX ON public."mutabaah_jawaban_opsi" ("jawaban_id", "opsi_id");

CREATE INDEX ON public."mutabaah_jawaban_opsi" ("opsi_id");

CREATE UNIQUE INDEX ON public."penilaian" ("pengajuan_id", "siswa_id", "peran");

CREATE INDEX ON public."penilaian" ("penilai_id");

CREATE INDEX ON public."sertifikat" ("siswa_id");

CREATE UNIQUE INDEX ON public."penomoran_surat" ("jenis", "tahun");

CREATE INDEX ON public."log_aktivitas" ("entitas", "entitas_id");

CREATE INDEX ON public."log_aktivitas" ("pengguna_id", "created_at");

CREATE INDEX ON public."notifikasi" ("pengguna_id", "dibaca");

COMMENT ON TABLE "pengguna" IS 'Profil user. id = auth.users.id (Supabase Auth).';

COMMENT ON COLUMN "pengguna"."id" IS 'Sama dengan auth.users.id';

COMMENT ON COLUMN "pengguna"."username" IS 'Pengganti kolom id_login lama (NIS/NIP/username)';

COMMENT ON TABLE "guru" IS 'Data khusus guru. Nama diambil dari pengguna.nama_lengkap.';

COMMENT ON TABLE "siswa" IS 'Data khusus siswa. Nama diambil dari pengguna.nama_lengkap.';

COMMENT ON COLUMN "siswa"."nama_orangtua" IS 'Kontak darurat; akun orang tua ada di orang_tua_siswa';

COMMENT ON TABLE "perusahaan" IS 'Master tempat PKL / DUDI.';

COMMENT ON COLUMN "periode_pkl"."nama" IS 'contoh: PKL Ganjil 2026/2027';

COMMENT ON COLUMN "periode_pkl"."tahun_ajaran" IS 'contoh: 2026/2027';

COMMENT ON TABLE "instruktur" IS 'Akun instruktur/pembimbing perusahaan. Bisa login dan verifikasi jurnal.';

COMMENT ON COLUMN "orang_tua_siswa"."pengguna_id" IS 'pengguna dengan peran ortu';

COMMENT ON TABLE "pengajuan_pkl" IS 'Satu baris = satu pengajuan/penempatan PKL (bisa berkelompok). Satu siswa hanya boleh punya satu pengajuan aktif; ditegakkan di aplikasi + partial unique index.';

COMMENT ON COLUMN "pengajuan_pkl"."dibuat_oleh" IS 'pengguna.id siswa yang mengajukan';

COMMENT ON COLUMN "pengajuan_pkl"."guru_pembimbing_id" IS 'guru.id pembimbing dari sekolah';

COMMENT ON COLUMN "pengajuan_pkl"."instruktur_id" IS 'instruktur.id verifikator dari perusahaan';

COMMENT ON COLUMN "pengajuan_pkl"."pembimbing_id" IS 'instruktur.id pembimbing lapangan (opsional)';

COMMENT ON COLUMN "pengajuan_pkl"."diverifikasi_oleh" IS 'pengguna.id admin yang approve/reject';

COMMENT ON TABLE "pengajuan_anggota" IS 'Anggota kelompok pada satu pengajuan.';

COMMENT ON TABLE "surat" IS 'Surat yang DITERBITKAN sistem (PDF). File disimpan di Supabase Storage.';

COMMENT ON COLUMN "surat"."file_path" IS 'path di bucket Storage, contoh: surat/2025/izin-ortu-xxx.pdf';

COMMENT ON COLUMN "surat"."kode_verifikasi" IS 'isi QR verifikasi surat (opsional)';

COMMENT ON TABLE "dokumen" IS 'File yang DIUNGGAH user (scan TTD, balasan perusahaan, dll).';

COMMENT ON COLUMN "dokumen"."file_path" IS 'path di bucket Storage, contoh: dokumen/izin-ortu-xxx.pdf';

COMMENT ON COLUMN "dokumen"."ukuran" IS 'ukuran file dalam byte';

COMMENT ON TABLE "jurnal" IS 'Jurnal kegiatan harian siswa. Maksimal 1 entri per siswa per tanggal.';

COMMENT ON COLUMN "jurnal"."ringkasan_ai" IS 'Opsional; ringkasan AI. Perhatikan privasi.';

COMMENT ON COLUMN "jurnal"."foto_path" IS 'path di bucket Storage foto-jurnal';

COMMENT ON COLUMN "verifikasi_jurnal"."verifikator_id" IS 'pengguna.id guru atau instruktur';

COMMENT ON COLUMN "tugas_siswa"."file_path" IS 'path di bucket Storage tugas';

COMMENT ON TABLE "mutabaah_form" IS 'Template/versi form mutabaah. Hanya satu form aktif per periode; form berjawaban tidak boleh diubah, buat versi baru.';

COMMENT ON COLUMN "mutabaah_form"."nama" IS 'contoh: Mutabaah Harian';

COMMENT ON TABLE "mutabaah_pertanyaan" IS 'Pertanyaan dinamis. Tipe mengikuti enum tipe_pertanyaan.';

COMMENT ON COLUMN "mutabaah_pertanyaan"."deskripsi" IS 'Petunjuk/placeholder untuk siswa';

COMMENT ON COLUMN "mutabaah_pertanyaan"."min_angka" IS 'Hanya untuk isian_angka';

COMMENT ON COLUMN "mutabaah_pertanyaan"."max_angka" IS 'Hanya untuk isian_angka';

COMMENT ON COLUMN "mutabaah_pertanyaan"."satuan" IS 'contoh: halaman, menit, kali';

COMMENT ON TABLE "mutabaah_opsi" IS 'Pilihan untuk pertanyaan pilih_satu / pilih_banyak.';

COMMENT ON COLUMN "mutabaah_opsi"."nilai" IS 'Nilai untuk rekap; opsional';

COMMENT ON TABLE "mutabaah_harian" IS 'Satu entri per siswa per tanggal. form_id mencatat versi form yang dipakai.';

COMMENT ON TABLE "mutabaah_jawaban" IS 'Satu baris jawaban per pertanyaan per hari. Pilihan ganda disimpan di mutabaah_jawaban_opsi.';

COMMENT ON TABLE "mutabaah_jawaban_opsi" IS 'Opsi terpilih untuk pilih_satu / pilih_banyak.';

COMMENT ON TABLE "penilaian" IS 'Nilai akhir dari guru dan/atau instruktur. Opsional di MVP, disiapkan untuk sertifikat.';

COMMENT ON COLUMN "penilaian"."penilai_id" IS 'pengguna.id guru atau instruktur';

COMMENT ON COLUMN "penilaian"."nilai" IS '0-100';

COMMENT ON COLUMN "sertifikat"."file_path" IS 'path di bucket Storage sertifikat';

COMMENT ON TABLE "pengaturan_sekolah" IS 'Baris tunggal (id = 1). Dipakai untuk kop, footer, dan nomor surat.';

COMMENT ON COLUMN "pengaturan_sekolah"."id" IS 'Selalu 1';

COMMENT ON COLUMN "pengaturan_sekolah"."akreditasi" IS 'contoh: A (Unggul) — wajib di kop surat';

COMMENT ON COLUMN "pengaturan_sekolah"."format_nomor_surat" IS 'contoh: {nomor}/{kode}/{tahun}';

COMMENT ON TABLE "penomoran_surat" IS 'Counter nomor surat per jenis per tahun. Hindari nomor ganda.';

COMMENT ON COLUMN "log_aktivitas"."pengguna_id" IS 'nullable: aksi sistem';

COMMENT ON COLUMN "log_aktivitas"."aksi" IS 'contoh: approve_pengajuan, verifikasi_jurnal';

COMMENT ON COLUMN "log_aktivitas"."entitas" IS 'contoh: pengajuan_pkl, jurnal';


ALTER TABLE public."guru" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."guru" ADD FOREIGN KEY ("jurusan_id") REFERENCES public."jurusan" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."siswa" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."siswa" ADD FOREIGN KEY ("jurusan_id") REFERENCES public."jurusan" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."instruktur" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."instruktur" ADD FOREIGN KEY ("perusahaan_id") REFERENCES public."perusahaan" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."orang_tua_siswa" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."orang_tua_siswa" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("perusahaan_id") REFERENCES public."perusahaan" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("periode_id") REFERENCES public."periode_pkl" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("dibuat_oleh") REFERENCES public."pengguna" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("guru_pembimbing_id") REFERENCES public."guru" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("instruktur_id") REFERENCES public."instruktur" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("pembimbing_id") REFERENCES public."instruktur" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_pkl" ADD FOREIGN KEY ("diverifikasi_oleh") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_anggota" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."pengajuan_anggota" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."surat" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."surat" ADD FOREIGN KEY ("dibuat_oleh") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."dokumen" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."dokumen" ADD FOREIGN KEY ("diunggah_oleh") REFERENCES public."pengguna" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."dokumen" ADD FOREIGN KEY ("diverifikasi_oleh") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."jurnal" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."jurnal" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."verifikasi_jurnal" ADD FOREIGN KEY ("jurnal_id") REFERENCES public."jurnal" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."verifikasi_jurnal" ADD FOREIGN KEY ("verifikator_id") REFERENCES public."pengguna" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."tugas" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."tugas" ADD FOREIGN KEY ("guru_id") REFERENCES public."guru" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."tugas_siswa" ADD FOREIGN KEY ("tugas_id") REFERENCES public."tugas" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."tugas_siswa" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_form" ADD FOREIGN KEY ("periode_id") REFERENCES public."periode_pkl" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_form" ADD FOREIGN KEY ("dibuat_oleh") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_pertanyaan" ADD FOREIGN KEY ("form_id") REFERENCES public."mutabaah_form" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_opsi" ADD FOREIGN KEY ("pertanyaan_id") REFERENCES public."mutabaah_pertanyaan" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_harian" ADD FOREIGN KEY ("form_id") REFERENCES public."mutabaah_form" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_harian" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_jawaban" ADD FOREIGN KEY ("harian_id") REFERENCES public."mutabaah_harian" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_jawaban" ADD FOREIGN KEY ("pertanyaan_id") REFERENCES public."mutabaah_pertanyaan" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_jawaban_opsi" ADD FOREIGN KEY ("jawaban_id") REFERENCES public."mutabaah_jawaban" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."mutabaah_jawaban_opsi" ADD FOREIGN KEY ("opsi_id") REFERENCES public."mutabaah_opsi" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."penilaian" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."penilaian" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."penilaian" ADD FOREIGN KEY ("penilai_id") REFERENCES public."pengguna" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."sertifikat" ADD FOREIGN KEY ("siswa_id") REFERENCES public."siswa" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."sertifikat" ADD FOREIGN KEY ("pengajuan_id") REFERENCES public."pengajuan_pkl" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."sertifikat" ADD FOREIGN KEY ("dibuat_oleh") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."log_aktivitas" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public."notifikasi" ADD FOREIGN KEY ("pengguna_id") REFERENCES public."pengguna" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

-- Pengguna terhubung ke Supabase Auth
ALTER TABLE public."pengguna"
  ADD CONSTRAINT pengguna_id_fkey
  FOREIGN KEY ("id") REFERENCES auth.users ("id") ON DELETE CASCADE;

-- ============================================================================
--  Constraints & indexes tambahan
-- ============================================================================

alter table public.pengaturan_sekolah
  add constraint pengaturan_sekolah_singleton check (id = 1);

alter table public.penilaian
  add constraint penilaian_nilai_range
  check (nilai is null or (nilai >= 0 and nilai <= 100));

alter table public.mutabaah_pertanyaan
  add constraint mutabaah_pertanyaan_angka_range
  check (min_angka is null or max_angka is null or min_angka <= max_angka);

alter table public.pengajuan_pkl
  add constraint pengajuan_pkl_tanggal_check
  check (tanggal_mulai is null or tanggal_selesai is null or tanggal_selesai >= tanggal_mulai);

alter table public.periode_pkl
  add constraint periode_pkl_tanggal_check
  check (tanggal_selesai >= tanggal_mulai);

alter table public.jurnal
  add constraint jurnal_waktu_check
  check (waktu_mulai is null or waktu_selesai is null or waktu_selesai >= waktu_mulai);

-- Hanya satu form mutaba'ah aktif per periode
create unique index mutabaah_form_satu_aktif_per_periode
  on public.mutabaah_form (periode_id)
  where status = 'aktif' and periode_id is not null;

-- Hanya satu periode PKL aktif
create unique index periode_pkl_satu_aktif
  on public.periode_pkl (aktif)
  where aktif;

-- ============================================================================
--  updated_at trigger
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'pengguna','jurusan','guru','siswa','perusahaan','periode_pkl','instruktur',
    'pengajuan_pkl','surat','dokumen','jurnal','verifikasi_jurnal','tugas',
    'tugas_siswa','mutabaah_form','mutabaah_pertanyaan','mutabaah_harian',
    'mutabaah_jawaban','penilaian','pengaturan_sekolah','penomoran_surat'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ============================================================================
--  Profil otomatis saat user Supabase Auth dibuat
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_nama text;
  v_role public.peran_pengguna;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(coalesce(new.email, new.id::text), '@', 1)
  );
  v_nama := coalesce(
    nullif(new.raw_user_meta_data->>'nama_lengkap', ''),
    v_username
  );

  begin
    v_role := coalesce(
      (new.raw_app_meta_data->>'peran')::public.peran_pengguna,
      'siswa'
    );
  exception when others then
    v_role := 'siswa';
  end;

  if exists (select 1 from public.pengguna where username = v_username) then
    v_username := v_username || '-' || substr(new.id::text, 1, 6);
  end if;

  insert into public.pengguna (id, username, email, nama_lengkap, peran)
  values (
    new.id,
    v_username,
    coalesce(new.email, new.id::text || '@local'),
    v_nama,
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
--  Satu pengajuan aktif per siswa
-- ============================================================================

create or replace function public.enforce_one_active_pengajuan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.pengajuan_anggota pa
    join public.pengajuan_pkl p on p.id = pa.pengajuan_id
    where pa.siswa_id = new.siswa_id
      and pa.id is distinct from new.id
      and p.status not in ('ditolak', 'dibatalkan', 'selesai')
  ) then
    raise exception 'Siswa sudah memiliki pengajuan PKL aktif';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_one_active_pengajuan on public.pengajuan_anggota;
create trigger enforce_one_active_pengajuan
before insert or update on public.pengajuan_anggota
for each row execute function public.enforce_one_active_pengajuan();
