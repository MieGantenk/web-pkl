# Web PKL — Dokumentasi Proyek

Sistem Informasi PKL SMK-IT As-Syifa Boarding School.
Stack: Next.js App Router + TypeScript + Tailwind CSS + Supabase.

> **Mulai dari sini.** Dokumen di folder ini adalah satu paket. Baca sesuai urutan, jangan lompat.

---

## Dokumen

| Dokumen | Untuk apa | Kapan dibaca |
|---|---|---|
| [`PRD.md`](./PRD.md) | Fitur, role, alur, status, acceptance criteria | Sebelum menentukan pekerjaan |
| [`ERD.dbml`](./ERD.dbml) | Tabel, kolom, enum, relasi (import ke dbdiagram.io) | Sebelum membuat migrasi/query |
| [`TECH_STACK.md`](./TECH_STACK.md) | Pustaka yang dipakai & dilarang | Sebelum menambah dependency |
| [`DESIGN.md`](./DESIGN.md) | Arah desain, audit web lama, voice, prinsip | Sebelum mendesain halaman |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Token warna, tipografi, komponen, print | Sebelum menulis UI |
| [`LAYOUT.md`](./LAYOUT.md) | App shell, halaman, responsif, route Next.js | Sebelum membuat halaman |
| [`ANIMATION.md`](./ANIMATION.md) | Gerak, durasi, momen, implementasi `motion` | Sebelum menambah animasi |
| [`ROUTES.md`](./ROUTES.md) | Daftar halaman, endpoint, Server Actions | Sebelum membuat route/action |
| [`STRUCTURE.md`](./STRUCTURE.md) | Struktur folder & status proyek | Sebelum menulis kode |
| [`AGENTS.md`](./AGENTS.md) | Aturan kerja AI agent/developer | Sebelum menulis kode |

---

## Urutan baca

1. `PRD.md` — apa yang dibangun.
2. `ERD.dbml` — data apa yang disimpan.
3. `TECH_STACK.md` — alat apa yang dipakai.
4. `DESIGN.md` — seperti apa rasanya.
5. `DESIGN_SYSTEM.md` — token & komponen.
6. `LAYOUT.md` — susunan halaman.
7. `ANIMATION.md` — gerak.
8. `AGENTS.md` — aturan main.

---

## Keputusan inti

- **5 role:** admin, guru, siswa, instruktur, ortu.
- **Satu sekolah** (bukan multi-tenant) untuk v1.
- **Satu pengajuan aktif per siswa**; kelompok diperbolehkan.
- **Surat per pengajuan**; nomor otomatis; kop + akreditasi wajib.
- **Verifikasi jurnal 2 langkah** berurutan: guru → instruktur.
- **Mutaba'ah** masuk database, memakai form dinamis + versioning; admin punya halaman sendiri.
- **Tugas guru** ada di MVP, dengan peringatan porsi.
- **Notifikasi in-app** di v1; email/WA ditunda.
- **Light & dark mode** aktif; preferensi tersimpan per perangkat.
- **Scan tanda tangan**; digital signature ditunda.
- **Sertifikat & penilaian** v1.1; skema sudah disiapkan.

---

## Warna & tipografi

- Teal sekolah `#1D9A96` = identitas.
- Tombol utama `#147A76` (kontras 5,15:1).
- Sidebar `#0B2F2D`.
- Gold `#D1AE6C`; maroon `#820101` hanya untuk cap/surat.
- Font: **Sora** (judul/angka) + **Plus Jakarta Sans** (UI/isi).

Detail: `DESIGN_SYSTEM.md`.

---

## Prinsip yang tidak boleh dilanggar

1. Satu AppShell untuk semua role.
2. Token desain, bukan hex/ukuran hardcode.
3. RLS di semua tabel; role di `pengguna.peran`.
4. Service role key hanya di server.
5. Server Components default; Client Components hanya untuk interaksi.
6. Tabel server-side pagination; jangan muat semua baris.
7. Animasi hanya untuk menjelaskan; tanpa scroll reveal.
8. Hormati `prefers-reduced-motion`.
9. Surat A4 = pratinjau = hasil cetak.
10. Jangan menambah library/tabel/status tanpa update dokumen.

---

## Konflik dokumen

Prioritas: **PRD → ERD → TECH_STACK → DESIGN/LAYOUT → ANIMATION**.
Kalau masih bertentangan, berhenti dan minta keputusan. Jangan menebak.

---

## Langkah berikutnya

1. Selesai: `AppShell`, login, role guard, beranda siswa, profil siswa, surat siswa, ringkasan admin, pengelolaan data siswa + akun, penempatan admin, surat admin + cetak A4, filter otomatis, beranda orang tua, profil orang tua, pengaturan admin, halaman guru inti + surat tugas, halaman instruktur inti, serta dark/light mode.
2. Vertical slice berikutnya: pengajuan PKL, verifikasi dokumen, dan jurnal.
3. Lanjut ke modul surat, mutaba'ah, tugas, dan laporan.
4. Untuk data demo pengembangan: `npm run seed:demo` (jangan dijalankan di produksi).
