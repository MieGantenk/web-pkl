# TECH_STACK.md — Teknologi Proyek Sistem Informasi PKL

> Dokumen ini adalah acuan teknologi. Tujuannya menjaga stack tetap kecil, konsisten, dan tidak menambah framework baru tanpa alasan.
> Produk: [`PRD.md`](./PRD.md) · Data: [`ERD.dbml`](./ERD.dbml) · Aturan agent: [`AGENTS.md`](./AGENTS.md) · Desain: [`DESIGN.md`](./DESIGN.md) · Token: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) · Layout: [`LAYOUT.md`](./LAYOUT.md) · Gerak: [`ANIMATION.md`](./ANIMATION.md)

Versi 1.1 · 16 November 2026

**Catatan verifikasi:** file `TECH_STACK.md` yang ada sudah sesuai arah proyek — tidak ada Prisma, NextAuth, Firebase, Redux, Express, atau MongoDB. Yang ditambahkan di versi ini hanya:
- `motion` untuk animasi (kebutuhan baru, diatur di `ANIMATION.md`),
- `@hookform/resolvers` sebagai penghubung resmi React Hook Form + Zod,
- `browser-image-compression` untuk kompresi gambar sebelum upload (jurnal, dokumen pengajuan, surat, aset sekolah).
- `tesseract.js` dan model `@tesseract.js-data/eng` untuk validasi timestamp foto jurnal di server.

Tidak ada teknologi di luar pembicaraan proyek yang dimasukkan.

---

## 1. Gambaran umum

| Bagian | Teknologi | Tugas |
|---|---|---|
| Aplikasi | **Next.js App Router + TypeScript** | Menampilkan halaman, menerima input, menjalankan logika server |
| Database & layanan | **Supabase** (PostgreSQL, Auth, Storage) | Menyimpan data, login, file, dan aturan akses |
| Library pendukung | Library React sesuai kebutuhan | Form, tabel, grafik, PDF, animasi |

**Arsitektur:** Next.js berkomunikasi langsung dengan Supabase. Tidak ada backend terpisah kecuali benar-benar diperlukan dan disetujui.

### Peran setiap bagian

- **Next.js** — aplikasi utama untuk semua role.
- **Supabase PostgreSQL** — data siswa, pengajuan, penempatan, jurnal, surat, mutaba'ah.
- **Supabase Auth** — akun, login, sesi.
- **Supabase Storage** — surat balasan, scan surat izin, foto jurnal, lampiran.
- **Supabase RLS** — aturan akses di level database.

Jangan membuat database, autentikasi, atau penyimpanan file kedua jika Supabase sudah cukup.

---

## 2. Teknologi wajib

| Kebutuhan | Paket / teknologi | Fungsi |
|---|---|---|
| Framework | `next` | Halaman + server |
| Bahasa | `typescript` | Tipe dan keamanan kode |
| Styling | `tailwindcss` | Utility CSS + token |
| Komponen UI | `shadcn/ui` | Button, dialog, input, tabel (kode dimiliki proyek) |
| Ikon | `lucide-react` | Ikon antarmuka |
| Notifikasi | `sonner` | Toast sukses/gagal |
| Supabase client | `@supabase/supabase-js` | Database, auth, storage |
| Supabase SSR | `@supabase/ssr` | Sesi di server Next.js |
| Form | `react-hook-form` | State form |
| Validasi | `zod` | Skema validasi |
| Penghubung form | `@hookform/resolvers` | Zod resolver untuk RHF |
| Tabel | `@tanstack/react-table` | Sorting, filter, pagination |
| Tanggal | `date-fns` | Format & olah tanggal |
| Date picker | `react-day-picker` | Kalender |
| Grafik | `recharts` | Grafik dashboard |
| PDF | `@react-pdf/renderer` | Surat & sertifikat |
| QR Code | `qrcode` | Verifikasi surat (opsional) |
| Animasi | `motion` | Hanya 5 kasus di `ANIMATION.md` |
| Kompresi gambar | `browser-image-compression` | Sebelum upload gambar ke Storage |
| OCR foto jurnal | `tesseract.js` + `@tesseract.js-data/eng` | Memeriksa timestamp visual di server; foto tidak dikirim ke layanan OCR luar |
| CLI | `supabase` (dev) | Migrasi & generate tipe |

Catatan:

- `shadcn/ui` bukan library runtime; komponennya disalin ke `components/ui` dan menjadi milik proyek.
- `motion` adalah paket penerus `framer-motion`. Import dari `motion/react`. Jangan memasang keduanya.
- OCR memakai model bahasa Inggris lokal (sekitar 13,9 MB); foto jurnal diproses di server sendiri dan tidak dikirim ke layanan OCR luar.
- Versi paket **tidak ditulis di dokumen ini**. Gunakan versi stabil terbaru saat scaffold, lalu kunci di `package.json` + lockfile.

---

## 3. Aturan penggunaan

1. Gunakan **Next.js App Router**. Jangan memakai Pages Router untuk fitur baru.
2. Gunakan **TypeScript** untuk seluruh kode. Hindari `any` tanpa alasan.
3. Gunakan **Tailwind CSS** dan token di `DESIGN_SYSTEM.md`. Jangan hardcode hex/ukuran.
4. Gunakan **shadcn/ui** sebelum membuat komponen dasar dari nol.
5. Gunakan **Lucide** saja untuk ikon.
6. Gunakan **Sonner** untuk notifikasi.
7. Gunakan **React Hook Form + Zod + @hookform/resolvers** untuk form.
8. Gunakan **Supabase** sebagai sumber data, auth, dan file.
9. Gunakan **TanStack Table** untuk tabel yang butuh sorting/filter/pagination.
10. Gunakan **date-fns** dan **React Day Picker** untuk tanggal.
11. Gunakan **Recharts** hanya di halaman yang punya grafik.
12. Gunakan **@react-pdf/renderer** untuk PDF. Jangan mengganti ekstensi file.
13. Gunakan **qrcode** hanya jika fitur verifikasi surat dipakai.
14. Gunakan **Supabase CLI** untuk migrasi dan generate tipe.
15. Gunakan **motion** hanya untuk kasus yang diizinkan `ANIMATION.md`.
16. Jangan menambah library jika kebutuhan bisa diselesaikan stack ini.
17. Jangan memakai database lain sebagai sumber utama data.
18. Jangan membuat sistem autentikasi sendiri jika Supabase Auth cukup.
19. Jangan memakai layanan penyimpanan file lain jika Supabase Storage cukup.
20. Jangan menganggap QR Code wajib; fitur itu opsional.

---

## 4. Tanggung jawab

### Next.js

- Menampilkan halaman dan navigasi.
- Menjalankan Server Components secara default.
- Client Components hanya untuk interaksi (state, event, tabel interaktif, animasi).
- Menjalankan mutasi lewat Server Actions; Route Handler untuk PDF/unduhan.
- PDF memakai runtime **Node.js**, bukan Edge.
- Menghubungkan UI dengan Supabase.

### Supabase

- Menyimpan data di PostgreSQL.
- Mengelola akun, login, dan sesi (Auth).
- Menyimpan file (Storage).
- Menegakkan akses dengan Row Level Security (RLS).

Semua tabel yang diakses client **wajib** punya RLS. Menyembunyikan tombol di frontend bukan keamanan.

### Library pendukung

Gunakan sesuai tugas. Jangan memakai satu library untuk menggantikan tanggung jawab teknologi lain.

---

## 5. Data & keamanan

- Service role key **hanya** di server; jangan pernah dikirim ke browser.
- Simpan rahasia di environment variables.
- Aktifkan RLS di semua tabel.
- Kebijakan RLS berdasarkan role: `admin`, `guru`, `siswa`, `instruktur`, `ortu`.
- Role disimpan di tabel `pengguna`, **bukan** `user_metadata`.
- Gunakan `security definer` function untuk cek role agar tidak rekursi RLS.
- Validasi data di server, meskipun form sudah divalidasi.
- Periksa hak akses sebelum baca/ubah/hapus/unduh.
- Bucket Storage **private**; akses lewat signed URL berumur pendek.
- Jangan menaruh file sensitif di bucket publik.
- Jangan menulis password/token/secret ke log.
- Audit trail: `created_at`, `updated_at`, `diverifikasi_oleh`/`diverifikasi_pada`, dan `verifikasi_jurnal`.
- Nomor surat memakai `penomoran_surat` di dalam transaksi, bukan input manual.

### Tabel inti

`pengguna`, `jurusan`, `guru`, `siswa`, `perusahaan`, `periode_pkl`, `instruktur`,
`orang_tua_siswa`, `pengajuan_pkl`, `pengajuan_anggota`, `surat`, `dokumen`,
`jurnal`, `verifikasi_jurnal`, `tugas`, `tugas_siswa`, `mutabaah_form`,
`mutabaah_pertanyaan`, `mutabaah_opsi`, `mutabaah_harian`, `mutabaah_jawaban`,
`mutabaah_jawaban_opsi`, `penilaian`, `sertifikat`, `pengaturan_sekolah`,
`penomoran_surat`, `log_aktivitas`, `notifikasi`.

Detail kolom & relasi: `ERD.dbml`.

Role:

| Role | Akses utama |
|---|---|
| `admin` | Semua data sekolah |
| `guru` | Siswa bimbingan, verifikasi langkah 1, tugas |
| `siswa` | Data sendiri, jurnal, mutaba'ah, surat |
| `instruktur` | Siswa di perusahaannya, verifikasi langkah 2, penilaian |
| `ortu` | Data anaknya (read-only) |

---

## 6. Fitur → teknologi

| Fitur | Teknologi |
|---|---|
| Halaman & navigasi | Next.js App Router + AppShell |
| Login & sesi | Supabase Auth + `@supabase/ssr` |
| Data siswa/pengajuan/jurnal | Supabase PostgreSQL + RLS |
| Upload surat & foto | Supabase Storage + signed URL |
| Form siswa/pengajuan | React Hook Form + Zod + `@hookform/resolvers` |
| Tabel admin | TanStack Table (server-side pagination) |
| Filter & pencarian | URL search params + Server Components |
| Tanggal PKL | React Day Picker + date-fns |
| Grafik monitoring | Recharts |
| Surat-surat PKL (izin, pengajuan, keberangkatan, tugas, penarikan) | `@react-pdf/renderer` + `pengaturan_sekolah` + `penomoran_surat` |
| QR verifikasi surat | `qrcode` (opsional) |
| Tugas sekolah | Tabel `tugas` + `tugas_siswa` + form |
| Toast | Sonner |
| Animasi | CSS transition + `motion` |
| Kompresi gambar | `browser-image-compression` |
| Validasi timestamp foto jurnal | `tesseract.js` + model `eng` lokal |
| Mutaba'ah | Form builder + `mutabaah_form` / `mutabaah_pertanyaan` / `mutabaah_opsi` + jawaban dinamis |

Catatan: builder pertanyaan memakai tombol naik/turun, bukan library drag-and-drop. Tidak ada dependency baru untuk fitur ini.
| Role instruktur & orang tua | `pengguna` + `instruktur` / `orang_tua_siswa` + RLS |

---

## 7. Animasi

- Pustaka: **`motion`** (`motion/react`).
- CSS transition dipakai lebih dulu untuk hover, focus, press, tabel, input.
- `motion` hanya untuk:
  1. page transition (`template.tsx`),
  2. indicator sidebar (`layoutId`),
  3. modal/drawer (`AnimatePresence`),
  4. count-up dashboard,
  5. cap verifikasi.
- Jangan memakai Lottie, GSAP, ScrollTrigger, Lenis, atau smooth-scroll library.
- Hormati `prefers-reduced-motion`.
- Detail: [`ANIMATION.md`](./ANIMATION.md).

---

## 8. Yang tidak dipakai di v1

| Teknologi | Alasan |
|---|---|
| **Prisma / Drizzle** | Supabase client + SQL migration cukup; ORM menambah lapisan dan isu koneksi serverless |
| **NextAuth** | Supabase Auth sudah menangani sesi dan terhubung ke RLS |
| **Firebase** | Duplikasi fungsi Supabase |
| **Redux / Zustand** | Server Components + state lokal cukup |
| **Express / NestJS** | Tidak ada backend terpisah |
| **MongoDB** | PostgreSQL sudah cukup |
| **Puppeteer** | Berat di serverless; PDF memakai `@react-pdf/renderer` |
| **TanStack Query** | Belum perlu; Server Components + URL state cukup |
| **MUI / Chakra / Ant Design** | Satu UI kit saja: shadcn/ui |
| **styled-components / Emotion** | Styling memakai Tailwind |
| **Axios** | `fetch` bawaan cukup |
| **Moment.js** | `date-fns` lebih kecil |
| **Chart.js** | Recharts sudah dipakai |
| **react-icons** | Lucide sudah dipakai |
| **jsPDF / html2pdf** | `@react-pdf/renderer` sudah dipakai |
| **framer-motion** | Gunakan `motion` (penerusnya), jangan dua-duanya |
| **GSAP / Lottie / scroll library** | Animasi cukup CSS + `motion` |

---

## 9. Keputusan tertunda

Belum diputuskan, jangan dipasang dulu:

| Fitur | Kandidat | Catatan |
|---|---|---|
| Notifikasi email | Resend + `@react-email/components` | Perlu keputusan produk |
| Notifikasi WhatsApp | Fonnte / Wablas | Orang tua lebih aktif di WA |
| Tanda tangan digital | `signature_pad` | Alternatif: scan tanda tangan |
| PWA / offline | Serwist / Workbox | Berguna untuk sinyal lemah |
| Dark mode | Token + `next-themes` | Aktif (toggle global) |
| Multi-sekolah | Tambahan `sekolah_id` + RLS | Jangan di v1 |
| QR verifikasi | `qrcode` (sudah opsional) | Tergantung kebutuhan |
| Testing framework | Vitest / Playwright | v1: lint + typecheck + build |

---

## 10. Struktur proyek

```
app/
  (auth)/login/page.tsx
  (app)/layout.tsx              # AppShell + role guard
  (app)/admin/...
  (app)/guru/...
  (app)/siswa/...
  (app)/instruktur/...
  (app)/ortu/...
  print/surat/[id]/page.tsx     # tanpa AppShell
  api/surat/[id]/pdf/route.ts   # Node runtime
components/
  ui/                           # shadcn/ui
  app/                          # AppShell, Sidebar, Topbar, BottomNav
  pkl/                          # StatusBadge, LetterTimeline, VerificationStamp, ...
  motion/                       # PageEnter, CountUp, Ring
lib/
  supabase/client.ts
  supabase/server.ts
  navigation.ts
  status.ts
  validators/                   # skema Zod
types/
  database.ts                   # hasil generate Supabase
supabase/
  migrations/
```

Aturan:

- Jangan membuat `pages/` (Pages Router).
- Jangan menaruh service role key di `lib/supabase/client.ts`.
- Jangan menaruh query database di komponen presentasional.
- Jangan menyalin shell di setiap halaman.

---

## 11. Kualitas & perintah

Jalankan sebelum menyatakan selesai:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Supabase:

```bash
supabase db push
supabase gen types typescript --local > types/database.ts
```

Aturan:

- TypeScript strict.
- Tidak ada `any` tanpa alasan.
- Tidak ada `console.log` di production.
- Tidak ada secret di repo.
- Tidak ada komponen yang memakai hex di luar token.
- Periksa error, loading, dan empty state.
- Uji 390/768/1024/1440.
- Jalankan Lighthouse aksesibilitas ≥ 95.
- Saat halaman pertama dibangun: jalankan `gate.mjs` dari skill `design-taste-frontend`.

### Panduan untuk AI Agent

1. Periksa struktur folder dan file proyek sebelum mengubah apa pun.
2. Baca `DESIGN.md`, `DESIGN_SYSTEM.md`, `LAYOUT.md`, dan `ANIMATION.md` sebelum menulis UI.
3. Periksa `package.json` dan lockfile untuk versi dependensi yang sudah terpasang.
4. Gunakan teknologi yang sudah ada jika sesuai; jangan memasang ulang atau mengganti dependensi tanpa alasan.
5. Ikuti pola kode dan struktur folder yang sudah diterapkan.
6. Jangan mengarang nama tabel, kolom, relasi, atau environment variable. Periksa skema dan file proyek.
7. Periksa validasi, hak akses, dan penanganan error di setiap fitur data.
8. Jangan mengubah struktur atau konfigurasi proyek secara besar-besaran tanpa memeriksa implementasi yang ada.
9. Setelah perubahan, jalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build`; perbaiki error sebelum menyatakan selesai.
10. Jika instruksi bertentangan dengan dokumen ini, jangan menebak — jelaskan konflik dan minta keputusan.

Jika ada kebutuhan yang tidak bisa dipenuhi stack ini, jelaskan masalah dan alasan teknisnya sebelum menambah teknologi baru.

---

## 12. Deployment

| Bagian | Platform |
|---|---|
| Aplikasi | Vercel |
| Database/Auth/Storage | Supabase |
| PDF | Route Handler Node runtime di Vercel |
| File | Supabase Storage (private bucket) |

Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only
```

Catatan:

- Jangan commit `.env`.
- Service role key hanya di server action/route handler.
- Supabase free tier cukup untuk pengembangan; produksi pertimbangkan paket berbayar.
- Backup database sebelum migrasi besar.

---

## 13. Migrasi dari Laravel

1. **Data** — export MySQL ke CSV/SQL, import ke PostgreSQL; sesuaikan tipe (`enum`, `timestamp`, JSON).
2. **Password** — hash Laravel tidak kompatibel dengan Supabase Auth; impor user lalu paksa reset password.
3. **File** — unduh dari `storage/app` Laravel, upload ke Supabase Storage lewat script; pertahankan path di database.
4. **Nomor surat** — buat sequence Postgres; jangan salin nomor manual.
5. **Role** — tambah `instruktur` dan `ortu`; jangan paksakan enum lama.
6. **Mutaba'ah** — pindahkan dari Google Form ke tabel.
7. **Paralel** — jalankan Laravel dan Next.js beberapa minggu; jangan matikan Laravel sebelum data cocok.
8. **Audit** — bandingkan jumlah siswa, jurnal, dan surat antara lama dan baru.

---

## 14. Checklist sebelum menambah dependency

1. Apakah Next.js, Supabase, atau library yang sudah ada bisa menyelesaikannya?
2. Apakah teknologi itu sudah tercantum di dokumen ini?
3. Berapa ukuran bundle dan biaya maintenance-nya?
4. Apakah lisensinya aman?
5. Apakah bisa diganti satu komponen kecil tanpa library?
6. Kalau tetap perlu: update `TECH_STACK.md` dulu, jelaskan alasannya, baru pasang.

Jika instruksi lain bertentangan dengan dokumen ini, jangan menebak — jelaskan konflik dan minta keputusan.

---

## 15. Ringkasan stack

- **Framework:** Next.js App Router
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui
- **Ikon:** Lucide React
- **Notifikasi:** Sonner
- **Backend/database/auth/storage:** Supabase
- **Form:** React Hook Form + Zod + `@hookform/resolvers`
- **Tabel:** TanStack Table
- **Tanggal:** date-fns + React Day Picker
- **Grafik:** Recharts
- **PDF:** `@react-pdf/renderer`
- **QR:** `qrcode` (opsional)
- **Animasi:** CSS transition + `motion`
- **Kompresi gambar:** `browser-image-compression`
- **CLI:** Supabase CLI
- **Deployment:** Vercel + Supabase

Dokumen ini menjadi acuan teknologi proyek. Perubahan stack harus punya alasan teknis yang jelas, bukan preferensi pribadi.

---

## 16. Hubungan dengan dokumen lain

| Dokumen | Isi |
|---|---|
| [`PRD.md`](./PRD.md) | Fitur, role, status, acceptance |
| [`ERD.dbml`](./ERD.dbml) | Tabel, enum, relasi |
| [`DESIGN.md`](./DESIGN.md) | Arah desain, audit, voice, prinsip |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Token, komponen, aksesibilitas, print |
| [`LAYOUT.md`](./LAYOUT.md) | Shell, halaman, responsif, route Next.js |
| [`ANIMATION.md`](./ANIMATION.md) | Gerak, durasi, momen, implementasi |
| [`AGENTS.md`](./AGENTS.md) | Aturan kerja agent |

Urutan perubahan: `DESIGN.md` → `DESIGN_SYSTEM.md` → `LAYOUT.md` / `ANIMATION.md` → `TECH_STACK.md` hanya jika perlu pustaka baru.
