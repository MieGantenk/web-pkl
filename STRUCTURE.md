# STRUCTURE.md — Struktur Folder Proyek

> Struktur ini mengikuti [`LAYOUT.md`](./LAYOUT.md) dan [`ROUTES.md`](./ROUTES.md).
> Folder route sudah dibuat; isi halaman diisi bertahap.

Versi 1.0 · 17 November 2026
Stack: Next.js 16 App Router · TypeScript · Tailwind CSS 4 · Supabase

---

## 1. Pohon folder

```
pkl-web/
├── app/
│   ├── (auth)/
│   │   └── login/                    # /login
│   ├── (app)/
│   │   ├── admin/
│   │   │   ├── page.tsx              # /admin (belum diisi)
│   │   │   ├── siswa/
│   │   │   │   ├── page.tsx          # /admin/siswa
│   │   │   │   └── [id]/page.tsx     # /admin/siswa/[id]
│   │   │   ├── guru/
│   │   │   ├── perusahaan/
│   │   │   ├── instruktur/
│   │   │   ├── orang-tua/
│   │   │   ├── pengajuan/
│   │   │   ├── penempatan/
│   │   │   ├── jurnal/
│   │   │   ├── verifikasi/
│   │   │   ├── tugas/
│   │   │   ├── mutabaah/
│   │   │   │   └── pertanyaan/       # /admin/mutabaah/pertanyaan
│   │   │   ├── surat/
│   │   │   ├── laporan/
│   │   │   ├── pengaturan/
│   │   │   └── audit/
│   │   ├── guru/
│   │   │   ├── page.tsx
│   │   │   ├── siswa/
│   │   │   ├── verifikasi/
│   │   │   ├── tugas/
│   │   │   ├── mutabaah/
│   │   │   ├── surat-tugas/
│   │   │   ├── penarikan/
│   │   │   └── profil/
│   │   ├── siswa/
│   │   │   ├── page.tsx
│   │   │   ├── pengajuan/
│   │   │   ├── jurnal/
│   │   │   │   └── baru/
│   │   │   ├── mutabaah/
│   │   │   ├── tugas/
│   │   │   ├── surat/
│   │   │   └── profil/
│   │   ├── instruktur/
│   │   │   ├── page.tsx
│   │   │   ├── siswa/
│   │   │   ├── verifikasi/
│   │   │   ├── penilaian/            # v1.1
│   │   │   └── profil/
│   │   └── ortu/
│   │       ├── page.tsx
│   │       ├── jurnal/
│   │       ├── mutabaah/
│   │       ├── surat/
│   │       └── profil/
│   ├── print/
│   │   ├── surat/[id]/               # tanpa AppShell
│   │   └── sertifikat/[id]/          # v1.1
│   ├── api/
│   │   ├── health/
│   │   ├── surat/[id]/pdf/
│   │   └── verifikasi/surat/[kode]/  # v1.1
│   ├── auth/
│   │   └── callback/                 # Supabase code exchange
│   ├── layout.tsx                    # root layout + font
│   ├── page.tsx                      # landing/fondasi
│   ├── globals.css                   # design tokens
│   └── favicon.ico
├── components/
│   ├── ui/                           # shadcn/ui
│   ├── app/                          # AppShell, Sidebar, Topbar, BottomNav
│   ├── pkl/                          # StatusBadge, LetterTimeline, VerificationStamp,
│   │                                 # MutabaahRing, JournalForm, PermissionGate
│   └── motion/                       # PageEnter, CountUp, Ring
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # browser client (anon)
│   │   ├── server.ts                 # server client (cookies)
│   │   └── admin.ts                  # service role — server only
│   ├── actions/                      # Server Actions per modul
│   ├── validators/                   # skema Zod
│   ├── letters/                      # template PDF
│   ├── navigation.ts                 # menu per role
│   ├── status.ts                     # label & warna status
│   └── utils.ts                      # cn()
├── types/
│   └── database.ts                   # hasil supabase gen types
├── supabase/
│   ├── migrations/
│   │   ├── 20261117090000_init_schema.sql
│   │   ├── 20261117090100_rls.sql
│   │   ├── 20261117090200_storage.sql
│   │   ├── 20261118090000_rls_perf.sql
│   │   ├── 20261118090100_lint_fix.sql
│   │   └── 20261118090200_function_grants.sql
│   └── seed.sql
├── public/
│   └── brand/                        # logo, kop, footer
├── .env.example
├── .gitignore
├── AGENTS.md
├── ANIMATION.md
├── DESIGN.md
├── DESIGN_SYSTEM.md
├── ERD.dbml
├── LAYOUT.md
├── PRD.md
├── README.md
├── ROUTES.md
├── STRUCTURE.md
├── TECH_STACK.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── proxy.ts                          # refresh sesi Supabase
├── tsconfig.json
└── next-env.d.ts
```

Folder route yang belum berisi `page.tsx` diberi `.gitkeep`. Isi halaman dibuat bertahap sesuai `ROUTES.md`.
Catatan: `page.tsx` yang tampil di pohon adalah **target**; saat ini baru folder, layout root, dan beberapa file fondasi yang dibuat.

---

## 2. Peran setiap folder

| Folder | Isi | Aturan |
|---|---|---|
| `app/(auth)` | Login, callback auth | Tidak memakai AppShell |
| `app/(app)` | Semua halaman setelah login | Wajib AppShell + role guard |
| `app/print` | Surat & sertifikat | Tanpa AppShell; CSS print |
| `app/api` | Route Handler | Node runtime untuk PDF |
| `components/ui` | shadcn/ui | Tidak boleh berisi query DB |
| `components/app` | Shell & navigasi | Client hanya untuk interaksi |
| `components/pkl` | Komponen domain | Status, surat, jurnal, mutaba'ah |
| `components/motion` | Animasi | Hanya 5 kasus di `ANIMATION.md` |
| `lib/supabase` | Client Supabase | `admin.ts` server-only |
| `lib/actions` | Server Actions | Wajib cek role + kepemilikan |
| `lib/validators` | Zod | Dipakai client & server |
| `lib/letters` | Template PDF | Times New Roman, A4 |
| `supabase/migrations` | Schema, RLS, storage | Urut, jangan diedit setelah deploy |
| `types` | Tipe database | Generate, jangan tulis manual |

---

## 3. Migration

Urutan:

1. `20261117090000_init_schema.sql` — enum, tabel, index, FK, trigger.
2. `20261117090100_rls.sql` — helper, RLS, policy.
3. `20261117090200_storage.sql` — bucket & policy storage.
4. `20261118090000_rls_perf.sql` — optimasi `auth.uid()` di policy.
5. `20261118090100_lint_fix.sql` — `search_path` + policy terakhir.
6. `20261118090200_function_grants.sql` — grant helper/trigger function.
7. `seed.sql` — profil sekolah.

Jalankan:

```bash
supabase db push --remote
supabase gen types typescript --remote --schema public > types/database.ts
```

Status: **sudah diterapkan** ke project `web-pkl`; `types/database.ts` sudah digenerate.

Catatan:

- `auth.users` dibuat otomatis Supabase; jangan dibuat manual.
- Schema belum diterapkan ke cloud karena MCP saat ini **read-only**.
- Setelah migration, isi `pengaturan_sekolah.akreditasi` sebelum menerbitkan surat.

---

## 4. Environment

Salin `.env.example` menjadi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Aturan:

- `NEXT_PUBLIC_*` boleh di browser.
- `SUPABASE_SERVICE_ROLE_KEY` hanya server.
- Jangan commit `.env.local`.

---

## 5. Perintah

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

---

## 6. Status saat ini

| Bagian | Status |
|---|---|
| Dokumen produk & desain | Selesai |
| ERD | Selesai, tervalidasi |
| Migration schema | **Sudah diterapkan ke Supabase** |
| RLS & storage policy | **Sudah diterapkan** |
| Tipe database | **Sudah digenerate** (`types/database.ts`) |
| Route & endpoint | Selesai (`ROUTES.md`) |
| Struktur folder | Selesai |
| Next.js scaffold | Selesai (Next 16.4.6, React 19.3) |
| Design token di `globals.css` | Selesai |
| Navigasi per role | Selesai (`lib/navigation.ts`) |
| Supabase client | Selesai (`lib/supabase/*`) |
| AppShell + role guard | Selesai |
| Halaman login | Selesai (username/email + password, redirect per role) |
| Beranda siswa | Selesai (status PKL, jurnal hari ini, mutaba'ah, jurnal terakhir) |
| Ringkasan admin | Selesai (antrean, statistik, grafik pengajuan, aktivitas) |
| Data siswa + akun | Selesai (list, filter, pagination, tambah, detail, edit, aktif/nonaktif) |
| Beranda orang tua | Selesai (pilih anak, status PKL, jurnal, mutaba'ah, surat) |
| Pengaturan admin | Selesai (profil sekolah, aset surat, penomoran, ringkasan mutaba'ah) |
| Halaman guru | Selesai (ringkasan, siswa bimbingan, detail, verifikasi, profil, ekspor CSV) |
| Profil siswa | Selesai (data diri, kontak, kata sandi) |
| Halaman instruktur | Selesai (ringkasan, siswa PKL, verifikasi langkah 2, profil) |
| Profil orang tua | Selesai (data diri, anak terkait, kata sandi) |
| Penempatan admin | Selesai (daftar, filter, guru/instruktur, tanggal, mulai PKL) |
| Surat admin | Selesai (7 jenis, nomor otomatis, unggah PDF/DOCX/gambar, matriks kelengkapan per siswa, pratinjau/unduh PDF, cetak A4, daftar surat dari siswa) |
| Surat siswa | Selesai (izin, pengajuan, keberangkatan, penarikan; unduh PDF) |
| Mutaba'ah siswa | Selesai (form dinamis, checklist, ring mingguan, riwayat 7 hari) |
| Mutaba'ah orang tua | Selesai (pilih anak, ring mingguan, riwayat 7 hari) |
| Mutaba'ah admin | Selesai (riwayat, filter, form builder, versi, publikasi, arsip) |
| Notifikasi | Selesai (lonceng global, badge unread, tandai dibaca, tautan per role) |
| Keamanan API | Selesai (CSRF API mutasi, same-origin, security headers) |
| Surat orang tua | Selesai (pilih anak, surat terbit, unduh PDF) |
| Jurnal orang tua | Selesai (pilih anak, filter, foto, status verifikasi, read-only) |
| Surat tugas guru | Selesai (daftar penempatan bimbingan, surat monitoring, unduh PDF) |
| Penarikan guru | Selesai (daftar penempatan berjalan, surat penarikan, unduh PDF) |
| Filter otomatis | Selesai (pilihan filter langsung memuat hasil) |
| Dark/light mode | Selesai (toggle global, preferensi tersimpan per perangkat) |
| Halaman modul lain | Belum diisi (bertahap) |

Data demo pengembangan: `npm run seed:demo` membuat akun admin `admin`,
instruktur `instruktur.mitra` dan `instruktur.karya`, serta orang tua `ortu`
beserta contoh data. Akun demo siswa/guru lama sudah dihapus; seed akan
membuatnya kembali jika dijalankan. Jangan jalankan pada database produksi.

### Known advisors

`supabase db lint` tidak menemukan error. `supabase db advisors` masih memberi warning non-blocking:

- **46 multiple permissive policies** — akibat policy `admin_all` + policy spesifik. Ini warning performa, bukan kebocoran data.
- **15 security definer helper** — fungsi `can_*`/`is_*`/`current_*` bisa dipanggil lewat RPC oleh `authenticated`. Memang diperlukan untuk RLS; fungsi hanya mengembalikan boolean/ID, bukan data sensitif. Kalau ingin nol warning, pindahkan helper ke schema `private` pada iterasi berikutnya.

---

## 7. Langkah berikutnya

1. Selesai: fondasi, AppShell, login, role guard, beranda siswa, profil siswa, surat siswa, mutaba'ah siswa, ringkasan admin, pengelolaan data siswa + akun, penempatan admin, surat admin + cetak A4, filter otomatis, beranda orang tua, profil orang tua, surat orang tua, mutaba'ah orang tua, mutaba'ah admin, notifikasi, pengaturan admin, halaman guru inti + surat tugas + penarikan, halaman instruktur inti, dan dark/light mode.
2. Vertical slice berikutnya: pengajuan PKL, verifikasi dokumen, dan jurnal.
3. Lanjut ke modul surat, mutaba'ah, tugas, dan laporan.
4. Jalankan gate `design-taste-frontend` untuk halaman publik; halaman di balik auth diuji dengan Lighthouse dan review visual.
