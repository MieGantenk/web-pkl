# AGENTS.md — Panduan Kerja Web PKL

> Dokumen ini untuk **AI agent dan developer** yang mengerjakan proyek ini.
> Tujuannya: hasilnya konsisten, aman, dan tidak menyimpang dari keputusan yang sudah dibuat.

Versi 1.0 · 16 November 2026
Proyek: Sistem Informasi PKL SMK-IT As-Syifa
Stack: Next.js App Router + TypeScript + Tailwind CSS + Supabase

---

## 0. Baca dulu, dalam urutan ini

| Urutan | Dokumen | Yang diambil |
|---|---|---|
| 1 | [`PRD.md`](./PRD.md) | Fitur, role, status, acceptance criteria |
| 2 | [`ERD.dbml`](./ERD.dbml) | Tabel, kolom, enum, relasi |
| 3 | [`TECH_STACK.md`](./TECH_STACK.md) | Pustaka yang dipakai & yang dilarang |
| 4 | [`DESIGN.md`](./DESIGN.md) | Arah desain, voice, audit |
| 5 | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Token warna, tipografi, komponen |
| 6 | [`LAYOUT.md`](./LAYOUT.md) | Shell, halaman, responsif, route |
| 7 | [`ROUTES.md`](./ROUTES.md) | Halaman, endpoint, Server Actions |
| 8 | [`STRUCTURE.md`](./STRUCTURE.md) | Struktur folder & status proyek |
| 9 | [`ANIMATION.md`](./ANIMATION.md) | Gerak, durasi, momen |

Jangan menulis kode sebelum membaca minimal PRD, ERD, TECH_STACK, dan DESIGN_SYSTEM.

---

## 1. Sumber kebenaran

| Pertanyaan | Dokumen |
|---|---|
| Fitur ini perlu atau tidak? | `PRD.md` |
| Siapa yang boleh akses? | `PRD.md` §8 + RLS |
| Tabel/kolom ini namanya apa? | `ERD.dbml` |
| Library apa yang boleh? | `TECH_STACK.md` |
| Warna/ukuran/komponen? | `DESIGN_SYSTEM.md` |
| Halaman ini susunannya bagaimana? | `LAYOUT.md` |
| Animasi ini boleh? | `ANIMATION.md` |

**Jika dokumen bertentangan:** berhenti, jelaskan konfliknya, minta keputusan. Jangan menebak.
Prioritas: **PRD → ERD → TECH_STACK → DESIGN/LAYOUT → ANIMATION.**

---

## 2. Peta proyek

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
  app/                          # AppShell, Sidebar, Topbar, BottomNav, PageHeader
  pkl/                          # StatusBadge, LetterTimeline, VerificationStamp,
                                # MutabaahRing, JournalForm, PermissionGate
  motion/                       # PageEnter, CountUp, Ring
lib/
  supabase/client.ts            # browser client (anon key)
  supabase/server.ts            # server client (cookies)
  supabase/admin.ts             # service role — server only
  navigation.ts                 # menu per role
  status.ts                     # label & warna status
  validators/                   # skema Zod
  letters/                      # template PDF
types/
  database.ts                   # generate dari Supabase
supabase/
  migrations/
```

Aturan:

- Jangan membuat `pages/` (Pages Router).
- Jangan menaruh query database di komponen presentasional.
- Jangan menyalin AppShell di setiap halaman.
- Jangan menaruh service role key di `client.ts`.

---

## 3. Perintah

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build

supabase start
supabase db push
supabase gen types typescript --local > types/database.ts
```

Aturan:

- Jangan mencampur package manager (npm/pnpm/yarn).
- Jangan mengubah versi dependensi tanpa alasan.
- Jangan commit `.env` atau secret.
- Jalankan lint, typecheck, dan build sebelum menyatakan selesai.

---

## 4. Aturan non-negosiasi

1. **TypeScript strict.** Tidak ada `any` tanpa alasan yang ditulis di komentar.
2. **Server Components default.** Client Component hanya untuk interaksi.
3. **Semua mutasi lewat Server Actions / Route Handler.** Jangan menulis langsung dari client tanpa RLS.
4. **RLS wajib** di semua tabel yang diakses client.
5. **Role di `pengguna.peran`**, bukan `user_metadata`.
6. **Service role key hanya di server.**
7. **Jangan mengarang tabel/kolom.** Cek `ERD.dbml`.
8. **Jangan menambah library.** Cek `TECH_STACK.md` dulu.
9. **Jangan menambah warna/ukuran baru.** Pakai token `DESIGN_SYSTEM.md`.
10. **Jangan menambah animasi di luar `ANIMATION.md`.**
11. **Jangan meninggalkan placeholder** ("Lorem", "TODO", "Search for…", "Kelas 0").
12. **Jangan memakai emoji di UI.**
13. **Jangan memakai `confirm()` / `alert()`.** Pakai dialog komponen.
14. **Jangan memakai gambar stok sebagai foto siswa/perusahaan.**
15. **Jangan menampilkan data anak ke orang tua lain.**

---

## 5. Next.js

- App Router saja.
- `app/(app)/layout.tsx` = AppShell + role guard.
- Route group per role: `/admin`, `/guru`, `/siswa`, `/instruktur`, `/ortu`.
- `template.tsx` untuk page transition (lihat `ANIMATION.md`).
- `loading.tsx` per segmen: skeleton mengikuti layout.
- `error.tsx`: pesan jelas + tombol coba lagi.
- `not-found.tsx`: satu kalimat + kembali.
- Server Actions untuk create/update/delete.
- Route Handler untuk PDF/unduhan; `export const runtime = "nodejs"`.
- Filter tabel disimpan di URL (`?q=&status=&page=`).
- Jangan memuat semua baris ke client; pagination server-side.
- Jangan memakai `useEffect` untuk data fetching yang bisa dilakukan server.

---

## 6. Supabase

### Auth

- Login email/username + password.
- Username dipetakan ke email di server (jangan bocorkan daftar akun).
- Session dikelola `@supabase/ssr`.
- Role guard di server + RLS.
- Akun nonaktif ditolak.
- Admin membuat user via `auth.admin.createUser` (service role); set `app_metadata.peran` dan `user_metadata.username/nama_lengkap`. Trigger `handle_new_user` membuat baris `pengguna`.
- Jangan mengambil role dari `user_metadata` (bisa diubah user).

### RLS

- Semua tabel: `enable row level security`.
- Policy per role:
  - `admin`: semua.
  - `guru`: siswa bimbingan.
  - `siswa`: data sendiri.
  - `instruktur`: siswa di perusahaannya.
  - `ortu`: anaknya.
- Gunakan `security definer` function untuk cek role (hindari rekursi).
- Uji policy dengan akun berbeda; jangan hanya percaya UI.

### Storage

- Bucket **private**.
- Path: `surat/{tahun}/{jenis}/{pengajuan_id}.pdf`, `dokumen/{pengajuan_id}/{jenis}-{uuid}.pdf`, `jurnal/{siswa_id}/{tanggal}-{uuid}.jpg`, `tugas/{tugas_id}/{siswa_id}/{uuid}.pdf`.
- Akses lewat signed URL berumur pendek.
- Maks 5 MB per file; kompres foto di client.
- Validasi MIME di server.
- Jangan memakai nama file asli sebagai path.

### Migrasi

- Semua perubahan skema lewat `supabase/migrations`.
- Generate tipe setelah migrasi.
- Jangan mengubah tabel langsung di dashboard untuk produksi.

---

## 7. Data & status

- Tabel & enum: `ERD.dbml`.
- Status canonical: `PRD.md` §7.
- Label UI & warna: `DESIGN_SYSTEM.md` §1.8.
- Jangan membuat status baru di komponen; tambahkan di enum + PRD + mapping UI.
- Verifikasi jurnal 2 langkah memakai `verifikasi_jurnal` (guru lalu instruktur).
- Mutaba'ah memakai `mutabaah_form`, `mutabaah_pertanyaan`, `mutabaah_opsi`, `mutabaah_harian`, `mutabaah_jawaban`, `mutabaah_jawaban_opsi`.
- Status form: `draft`, `aktif`, `arsip`; hanya satu form aktif per periode.
- Form mutaba'ah yang sudah punya jawaban **tidak boleh diubah**; buat versi baru (`versi + 1`), biarkan versi lama tetap aktif untuk arsip.
- Tipe pertanyaan hanya: `ya_tidak`, `pilih_satu`, `pilih_banyak`, `isian_singkat`, `isian_angka`, `essay`.
- Jangan menambah tipe pertanyaan tanpa update `ERD.dbml` + `PRD.md` + komponen builder.
- Tugas memakai `tugas` + `tugas_siswa`.
- Surat memakai `surat` + `penomoran_surat` + `pengaturan_sekolah`.
- Nomor surat dibuat dalam transaksi; jangan `max(nomor)+1` dari client.
- Satu siswa hanya boleh punya satu pengajuan aktif; tegakkan di aplikasi + partial unique index.
- Jangan `select('*')` pada `pengguna`; kolom `email` dan `telepon` dibatasi. Pilih kolom yang diizinkan.
- Setiap aksi penting dicatat di `log_aktivitas`.

---

## 8. Role & akses

Ringkasan (detail di PRD §8):

| Role | Boleh |
|---|---|
| Admin | semua data, approve, terbit surat, pengaturan |
| Guru | siswa bimbingan, verifikasi langkah 1, tugas |
| Siswa | pengajuan sendiri, jurnal, mutaba'ah, surat sendiri |
| Instruktur | siswa perusahaannya, verifikasi langkah 2, penilaian |
| Ortu | data anaknya (read-only) |

Aturan:

- Cek role di server action, bukan hanya menyembunyikan tombol.
- RLS adalah pertahanan terakhir.
- Jangan mengizinkan guru/instruktur melihat siswa di luar penugasan.
- Jangan mengizinkan siswa mengubah status selain kirim/unggah.

---

## 9. UI

- Token: `DESIGN_SYSTEM.md`.
- Komponen: `components/ui` (shadcn/ui) — jangan membuat tombol/input baru.
- Shell: `LAYOUT.md` — sidebar 264, topbar 64, konten maks 1280.
- Mobile-first: uji 390 px lebih dulu.
- Tabel → kartu di <768 px.
- Form maks 680 px; label di atas; error di bawah field.
- Status selalu teks + ikon.
- Empty state: satu kalimat + satu aksi.
- Tidak ada gradient, glassmorphism, shadow tebal, atau emoji.
- Teks Indonesia; "Anda"; tombol = kata kerja + objek.
- Jangan memakai "Daily Activity", "Data PKL", "Submit", "Approve" di UI.
  Gunakan "Jurnal Harian", "Penempatan PKL", "Simpan", "Setujui".

---

## 10. Form

- React Hook Form + Zod + `@hookform/resolvers`.
- Validasi client **dan** server (schema yang sama).
- Label terlihat; placeholder bukan label.
- Field wajib ditandai.
- Error spesifik di bawah field; fokus ke field pertama yang salah.
- Tombol simpan/kirim menampilkan loading, bukan double-click.
- Setelah sukses: toast + redirect/refresh.
- Jangan memakai modal untuk form > 6 field.
- Jangan memakai `alert()` untuk error.

---

## 11. Tabel

- TanStack Table.
- Pagination server-side.
- Filter di URL.
- Kolom status selalu terlihat.
- Kolom pertama boleh sticky saat scroll horizontal.
- Aksi baris di dropdown `⋯`.
- Hapus memakai dialog konfirmasi.
- Empty, loading, error state wajib.
- Di HP: kartu, bukan 10 kolom.
- Jangan memuat 1.853 baris sekaligus.

---

## 12. Surat & PDF

- `@react-pdf/renderer`, Node runtime.
- Kop, footer, akreditasi dari `pengaturan_sekolah`.
- Nomor dari `penomoran_surat` (transaksi).
- Font Times New Roman 12 pt; margin 20/25 mm.
- QR opsional (`qrcode`).
- Pratinjau A4 = hasil cetak.
- Toolbar pratinjau `no-print`.
- Jangan memakai Puppeteer.
- Jangan menaruh warna teal di badan surat.

---

## 13. Upload

- Supabase Storage private.
- Maks 5 MB; JPG/PNG/PDF.
- Kompres foto (`browser-image-compression`).
- Preview sebelum simpan.
- Progress nyata; jangan memalsukan progress.
- Simpan metadata di `dokumen` / `jurnal` / `tugas_siswa`.
- Hapus file lama saat replace (jika aman).
- Jangan menaruh file di `public/`.

---

## 14. Animasi

- CSS transition dulu.
- `motion` hanya untuk:
  1. page transition,
  2. indicator sidebar,
  3. modal/drawer,
  4. count-up,
  5. cap verifikasi.
- Durasi & easing dari `ANIMATION.md` §2.
- Tanpa scroll reveal, parallax, confetti, bounce, loop.
- Hormati `prefers-reduced-motion`.
- Jangan animasi sebelum server sukses.
- Jangan animasi `width/height/margin`.

---

## 15. Aksesibilitas

- Kontras 4,5:1 untuk teks.
- Fokus terlihat (2 px).
- Target sentuh 44 px.
- Label form, `aria-invalid`, `aria-describedby`.
- Heading berurutan; satu `h1`.
- Tabel punya caption.
- Ikon-only punya `aria-label`.
- Skip link.
- `lang="id"`.
- Uji keyboard: Tab, Shift+Tab, Enter, Esc.

---

## 16. Keamanan

- Jangan pernah mengirim service role key ke client.
- Jangan log password/token.
- Jangan percaya input client.
- Jangan memakai `user_metadata` untuk role.
- Jangan membuka bucket.
- Jangan menampilkan error database mentah ke user.
- Jangan mengizinkan IDOR: cek kepemilikan data di server + RLS.
- Rate limit endpoint publik (QR verifikasi) jika ada.
- Backup sebelum migrasi besar.

---

## 17. Testing & definition of done

Sebelum menyatakan selesai:

- [ ] `npm run lint` lulus.
- [ ] `npx tsc --noEmit` lulus.
- [ ] `npm run build` lulus.
- [ ] Alur utama bisa diselesaikan.
- [ ] Role lain tidak bisa mengakses data yang bukan haknya.
- [ ] Empty/loading/error state ada.
- [ ] Diuji 390/768/1024/1440; tidak overflow di 320.
- [ ] Keyboard bisa menyelesaikan form.
- [ ] `prefers-reduced-motion` aman.
- [ ] Print surat rapi.
- [ ] Tidak ada error console.
- [ ] Lighthouse aksesibilitas ≥ 95.
- [ ] Tidak ada placeholder/emoji.
- [ ] Tidak ada hex/ukuran di luar token.
- [ ] Tidak ada dependency baru tanpa update `TECH_STACK.md`.

Halaman pertama yang dibangun juga harus menjalankan gate dari skill `design-taste-frontend`:

```bash
node ~/.agents/skills/design-taste-frontend/scripts/gate.mjs \
  --start http://localhost:3000 \
  --kind software \
  --category "Sistem PKL sekolah" \
  --primary "Isi jurnal"
```

---

## 18. Checklist sebelum menambah sesuatu

### Halaman baru

1. Ada di `PRD.md`? Role-nya siapa?
2. Ada blueprint di `LAYOUT.md`? Kalau tidak, tambahkan dulu.
3. Komponen yang dipakai sudah ada di `components/ui`?
4. State kosong/loading/error sudah?
5. Responsif 390/768/1024/1440?
6. Print perlu atau tidak?

### Tabel/kolom baru

1. Sudah ada di `ERD.dbml`? Kalau belum, tambahkan + migrasi.
2. Enum/status sudah ada di PRD?
3. RLS policy sudah?
4. Index untuk query utama?
5. Relasi & delete behavior jelas?
6. Generate tipe setelah migrasi.

### Dependency baru

1. Bisa diselesaikan stack yang ada?
2. Ada di `TECH_STACK.md`?
3. Ukuran bundle & maintenance?
4. Lisensi aman?
5. Bisa diganti satu komponen kecil?
6. Update `TECH_STACK.md` sebelum memasang.

### Animasi baru

1. Menjelaskan status/orientasi/umpan balik?
2. Ada di `ANIMATION.md`?
3. Durasi & easing dari token?
4. Hanya transform/opacity/warna?
5. Reduced motion aman?
6. Tidak menunda baca?

### Tipe pertanyaan mutaba'ah baru

1. Sudah ada di enum `tipe_pertanyaan`?
2. Ada di `PRD.md` §9.6?
3. Komponen builder & renderer sudah mendukung?
4. Validasi jawaban sudah?
5. Rekap/agregasi sudah?
6. Jangan menambah tipe hanya karena "kelihatan keren".

---

## 19. Yang tidak boleh dilakukan

- ❌ Menambah Prisma, NextAuth, Firebase, Redux, Express, MongoDB.
- ❌ Memakai UI kit kedua (MUI/Chakra/AntD).
- ❌ Memakai `styled-components`/Emotion.
- ❌ Memakai Puppeteer untuk PDF.
- ❌ Memakai GSAP/Lottie/scroll library.
- ❌ Memakai `framer-motion` (gunakan `motion`).
- ❌ Membuat backend terpisah.
- ❌ Menyimpan file di `public/`.
- ❌ Menyimpan role di `user_metadata`.
- ❌ Menampilkan data lintas role.
- ❌ Menulis query di komponen presentasional.
- ❌ Menyalin AppShell ke setiap halaman.
- ❌ Menambah warna/ukuran hardcode.
- ❌ Menambah animasi scroll/loop.
- ❌ Menambah placeholder atau teks contoh.
- ❌ Mengubah skema di dashboard produksi.

---

## 20. Konflik & pelaporan

Kalau menemukan:

- **Dokumen bertentangan** → tunjukkan dua bagian yang bertentangan, minta keputusan.
- **Data lama tidak cocok dengan ERD** → jangan paksa; catat di laporan migrasi.
- **Fitur tidak ada di PRD** → jangan implementasi; tanyakan dulu.
- **Library tidak ada di TECH_STACK** → jangan pasang; jelaskan alternatif.
- **Animasi tidak ada di ANIMATION** → jangan tambah; gunakan yang ada.
- **Bug keamanan** → hentikan pekerjaan, jelaskan risikonya.

Format laporan akhir:

1. Apa yang berubah.
2. File yang disentuh.
3. Cara menguji.
4. Yang belum selesai / risiko.
5. Dependency baru (jika ada).
6. Tabel/migrasi baru (jika ada).

---

## 21. Ringkasan keputusan

- 5 role: admin, guru, siswa, instruktur, ortu.
- Satu sekolah, satu pengajuan aktif per siswa.
- Surat per pengajuan; nomor otomatis.
- Verifikasi jurnal 2 langkah berurutan.
- Mutaba'ah di database, memakai form dinamis + versioning.
- Halaman admin mutaba'ah terpisah: riwayat + filter + form builder.
- Tugas guru dengan peringatan porsi.
- Notifikasi in-app v1; email/WA nanti.
- Light & dark mode aktif. Gunakan token; jangan hardcode warna.
- Scan tanda tangan; digital signature nanti.
- Sertifikat & penilaian v1.1.
- UI: "Buku Kerja", teal sekolah, Sora + Plus Jakarta Sans.
- Gerak: tenang, 120–260 ms, tanpa scroll reveal.

---

## 22. File map

| File | Isi |
|---|---|
| `README.md` | Titik masuk & peta dokumen |
| `PRD.md` | Produk, fitur, status, acceptance |
| `ERD.dbml` | Database |
| `TECH_STACK.md` | Pustaka & larangan |
| `DESIGN.md` | Arah desain |
| `DESIGN_SYSTEM.md` | Token & komponen |
| `LAYOUT.md` | Shell & halaman |
| `ANIMATION.md` | Gerak |
| `ROUTES.md` | Halaman, endpoint, Server Actions |
| `STRUCTURE.md` | Struktur folder & status |
| `AGENTS.md` | Dokumen ini |

Kalau ragu: baca dokumen, jangan menebak.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
