# LAYOUT.md — Shell, Halaman & Responsif Web PKL

> Blueprint susunan halaman. Arah desain ada di [`DESIGN.md`](./DESIGN.md). Token & komponen ada di [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

Versi 1.0 · 16 November 2026
Target: Next.js App Router · Tailwind CSS v4 · shadcn/ui · `motion/react`

---

## 0. Prinsip layout

1. **Satu shell untuk semua role.** Tidak ada halaman yang kehilangan navigasi.
2. **Tugas dulu.** Aksi yang harus dilakukan hari ini muncul sebelum statistik.
3. **Satu kolom untuk siswa.** HP adalah perangkat utama; jangan membuat layout desktop yang diperkecil.
4. **Dua kepadatan.** Staf = tabel padat; siswa/orang tua = kartu lapang.
5. **Tepi kiri-kanan sama.** Semua konten duduk di grid yang sama.
6. **Tidak ada scroll horizontal di 390 px.**
7. **Cetak adalah layout tersendiri.** Surat tidak memakai shell.

---

## 1. App shell

### 1.1 Desktop (≥1024 px)

```
┌──────────────────────┬──────────────────────────────────────────────────────────┐
│  LOGO                │  Topbar 64 px                                            │
│  SMK-IT As-Syifa     │  Beranda / Data Siswa        [Cari]  [🔔]  [Avatar ▾]    │
│                      ├──────────────────────────────────────────────────────────┤
│  UTAMA               │                                                          │
│  ▸ Ringkasan         │  Data Siswa                             [+ Tambah siswa]  │
│                      │  Kelola data siswa PKL.                                  │
│  DATA MASTER         │                                                          │
│    Siswa             │  ┌────────────────────────────────────────────────────┐  │
│    Guru              │  │ [Cari nama/NIS] [Kelas ▾] [Status ▾]  [Reset]     │  │
│    Perusahaan        │  ├────────────────────────────────────────────────────┤  │
│                      │  │ Nama        NIS       Kelas  Status     Aksi      │  │
│                      │  │ Abdullah    2024…     XI RPL  Diterima   ⋯         │  │
│    Instruktur        │  │ Ahmad …     2024…     XI RPL  Diajukan   ⋯         │  │
│    Orang Tua         │  │ …                                                  │  │
│                      │  └────────────────────────────────────────────────────┘  │
│  PKL                 │  1–10 dari 24                          [‹] 1 2 3 [›]     │
│    Pengajuan         │                                                          │
│    Penempatan        │                                                          │
│    Jurnal            │                                                          │
│    Verifikasi        │                                                          │
│    Tugas             │                                                          │
│    Mutaba'ah         │                                                          │
│                      │                                                          │
│  SURAT               │                                                          │
│    Izin Orang Tua    │                                                          │
│    Pernyataan        │                                                          │
│    Pengajuan         │                                                          │
│    Keberangkatan     │                                                          │
│    Tugas Monitoring  │                                                          │
│    Perjanjian        │                                                          │
│    Penarikan         │                                                          │
│                      │                                                          │
│  LAPORAN             │                                                          │
│  PENGATURAN          │                                                          │
│  AUDIT               │                                                          │
│                      │                                                          │
│  ┌────────────────┐  │                                                          │
│  │ Admin Sekolah  │  │                                                          │
│  └────────────────┘  │                                                          │
└──────────────────────┴──────────────────────────────────────────────────────────┘
   264 px                                   konten maks 1280 px
```

**Ukuran:**

| Elemen | Nilai |
|---|---|
| Sidebar | 264 px (collapsed 80 px) |
| Topbar | 64 px |
| Padding konten | 32 px |
| Konten maks | 1280 px |
| Grid | 12 kolom, gap 24 px |
| Baris tabel | 56 px |
| Header tabel | 44 px |

**Sidebar:**

- Latar `#0B2F2D`; teks `#EAF4F2`; label grup `#8FB3AE` 11/16 600 (tracking 0,04em).
- Item 44 px, radius 8, ikon 20, gap 12.
- Aktif: latar `#14524E`, indikator gold 3 px di kiri, teks putih.
- Hover: latar `#123D3A`.
- Submenu dibuka dengan chevron; maksimal satu submenu terbuka.
- Collapse: tombol di bawah; label hilang, ikon tetap; tooltip saat hover.
- Footer sidebar: kartu kecil berisi nama role + tombol keluar.

**Topbar:**

- Kiri: tombol hamburger (tablet), breadcrumb 13 px.
- Kanan: tombol cari (ikon + `⌘K`), notifikasi (counter 18 px), avatar + nama.
- Latar putih, border bawah 1 px. Tidak sticky berubah warna saat scroll.
- Tinggi 64 px; di HP 56 px.

**Breadcrumb:**

- Maks 3 level: `Beranda / PKL / Verifikasi`.
- Halaman aktif `ink`; sebelumnya `muted`.
- Di HP hanya level terakhir + tombol back.

### 1.2 Tablet (768–1023 px)

- Sidebar menjadi off-canvas: lebar 280, slide dari kiri 240 ms, backdrop.
- Topbar menampilkan hamburger.
- Konten padding 24.
- Grid 12 → 8 kolom efektif; card 2-up.
- Tabel tetap tabel, tetapi sembunyikan kolom sekunder (NISN, telepon).

### 1.3 HP (<768 px)

```
┌────────────────────────────────────┐
│ ‹  Jurnal Harian          [🔔]     │  56 px
├────────────────────────────────────┤
│                                    │
│  Selasa, 16 November 2026          │
│  ┌──────────────────────────────┐  │
│  │ Status jurnal hari ini       │  │
│  │ ● Belum diisi                │  │
│  │ [ Isi jurnal ]               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Foto kegiatan                │  │
│  │ [ + Tambah foto ]            │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ Simpan jurnal ]  ← sticky       │
├────────────────────────────────────┤
│  Beranda  Jurnal  Mutaba'ah  Surat │  64 px
│    ●        ○        ○        ○    │
└────────────────────────────────────┘
```

- Topbar 56 px: back + judul + notifikasi.
- Bottom nav 64 px + `env(safe-area-inset-bottom)`.
- Konten padding 16; card padding 16.
- Satu kolom; tombol utama full width.
- Form panjang memakai **sticky action bar** di atas bottom nav.
- Tabel menjadi kartu (lihat §4).
- Modal menjadi bottom sheet.

**Bottom nav per role:**

| Role | Item (maks 5) |
|---|---|
| Siswa | Beranda · Jurnal · Mutaba'ah · Surat · Profil |
| Orang tua | Beranda · Jurnal · Mutaba'ah · Profil |
| Instruktur | Ringkasan · Verifikasi · Siswa · Profil |
| Guru | Ringkasan · Verifikasi · Siswa · Profil |
| Admin | Tidak ada bottom nav; pakai drawer |

### 1.4 Auth layout

```
┌──────────────────────────────┬──────────────────────────┐
│                              │                          │
│  [LOGO]                      │  Masuk ke sistem         │
│  SMK-IT As-Syifa             │  Gunakan akun yang       │
│  Sistem PKL                  │  diberikan admin.        │
│                              │                          │
│  Satu kalimat tentang        │  ID Siswa/Guru           │
│  buku kerja PKL.             │  [                    ]  │
│                              │                          │
│  (foto kampus opsional,      │  Kata sandi              │
│   bukan stok)                │  [                  👁]  │
│                              │                          │
│                              │  [ Masuk ]               │
│                              │  Lupa kata sandi?        │
│                              │                          │
│                              │  Butuh bantuan?          │
│                              │  Hubungi admin sekolah.  │
└──────────────────────────────┴──────────────────────────┘
        52%                              48% / form 400 px
```

- Panel kiri `#0B2F2D`, logo + nama sistem, satu kalimat, satu foto asli opsional (dengan izin).
- Panel kanan putih; form maks 400 px; padding 48 desktop / 24 HP.
- Di < 900 px: panel kiri menjadi header kecil (logo + nama), form full width.
- Tidak ada marketing 3 fitur, tidak ada quote, tidak ada emoji.
- Field masuk 12 px, stagger 40 ms, sekali.
- Tombol "Lupa kata sandi?" membuka halaman/instruksi nyata, bukan alert.

### 1.5 Print layout

- Route terpisah tanpa shell: `/print/surat/[id]`.
- Latar layar `#E9EFED`; kertas putih A4 di tengah.
- Toolbar di atas (tidak tercetak): `Kembali`, `Unduh PDF`, `Cetak`.
- `@page { size: A4; margin: 0; }`.
- Kop 100% lebar; footer fixed; Times New Roman 12 pt; margin 20/25 mm.
- Tidak ada teal di badan surat.
- Nomor surat dan tanggal memakai `tabular-nums`.

---

## 2. Navigasi per role

| Role | Menu utama | Menu sekunder |
|---|---|---|
| **Admin** | Ringkasan | Data Master (Siswa, Guru, Perusahaan, Instruktur, Orang Tua), PKL (Pengajuan, Penempatan, Jurnal, Verifikasi, Tugas, Mutaba'ah), Surat (7 jenis), Laporan, Pengaturan, Audit |
| **Guru** | Ringkasan | Siswa Bimbingan, Verifikasi Jurnal, Tugas, Mutaba'ah, Surat Tugas, Penarikan, Profil |
| **Siswa** | Beranda | Pengajuan PKL, Jurnal Harian, Mutaba'ah, Tugas, Surat, Profil |
| **Instruktur** | Ringkasan | Siswa PKL, Verifikasi Jurnal, Penilaian, Profil |
| **Orang tua** | Beranda | Jurnal Anak, Mutaba'ah, Surat, Profil |

Aturan:

- Menu difilter di server berdasarkan role; jangan menyembunyikan dengan CSS.
- URL memakai prefix role: `/admin/*`, `/guru/*`, `/siswa/*`, `/instruktur/*`, `/ortu/*`.
- Satu item aktif per halaman (`aria-current="page"`).
- Jangan menampilkan menu yang tidak bisa diakses role.
- **Tugas** untuk siswa/guru ada di sidebar/drawer dan kartu Beranda; tidak dimasukkan ke bottom nav karena sudah 5 item.
- **Penilaian** instruktur ada di sidebar; bukan bottom nav.
- **Audit** hanya admin.

---

## 3. Blueprint halaman

### 3.1 Login — `/login`

**Tujuan:** masuk cepat, tenang, tanpa distraksi.

```
[Panel brand 52%]                [Form 48%]
Logo                              H1 "Masuk ke sistem"
Nama sistem                       Deskripsi 1 baris
1 kalimat                          Label + input ID
Foto kampus opsional               Label + input kata sandi
                                   [ Masuk ]
                                   Lupa kata sandi?
                                   Bantuan
```

- Satu aksi utama.
- Error login: banner di atas form, bukan toast.
- Setelah login, redirect sesuai role.
- Tidak ada tab "Siswa/Guru" — satu field ID.

### 3.2 Ringkasan Admin — `/admin`

**Tujuan:** tahu apa yang harus dikerjakan hari ini.

```
Halo, Admin. Hari ini 3 hal menunggu.
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ Perlu disetujui (3)             │ Jurnal belum diverifikasi (12)│ Siswa belum dapat tempat (5)  │
│ [Lihat antrean →]             │ [Buka verifikasi →]           │ [Lihat siswa →]               │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Siswa 24 │ Guru 7   │ PT 20    │ Jurnal 1.853 │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────┬─────────────────────────────┐
│ Pengajuan per bulan (bar chart)     │ Aktivitas terbaru           │
│                                     │ • Ahmad upload surat balasan │
│                                     │ • Guru Sandi verifikasi 4    │
└─────────────────────────────────────┴─────────────────────────────┘
```

- Baris pertama = antrean tugas, bukan statistik.
- Statistik 4 card; angka count-up sekali.
- Chart maks 1; aktivitas 5 item.
- Semua card action bisa diklik.

### 3.3 Ringkasan Guru — `/guru`

- Antrean verifikasi (jumlah + tombol).
- Siswa bimbingan (list 5, progress jurnal).
- Jurnal terbaru yang perlu perhatian.
- Surat tugas aktif.
- Tidak ada chart besar; fokus antrean.

### 3.4 Beranda Siswa — `/siswa`

```
Assalamu'alaikum, Farel.
Selasa, 16 November 2026

┌──────────────────────────────────────┐
│ Status PKL                           │
│ ● Diterima — PT MitraComm            │
│ Surat keberangkatan sudah terbit     │
│ [Lihat surat]                        │
└──────────────────────────────────────┘

┌──────────────────────┬───────────────┐
│ Jurnal hari ini      │ Mutaba'ah     │
│ ● Belum diisi        │   ◕ 4/7       │
│ [Isi jurnal]         │ [Isi sekarang]│
└──────────────────────┴───────────────┘

Jurnal terakhir
• Senin, 15 Nov — Scan dokumen — Terverifikasi
• Jumat, 12 Nov — Dokumentasi — Menunggu
```

- Hanya 3 blok; tidak ada statistik yang tidak berguna.
- Ring mutaba'ah 72 px; isi 600 ms sekali.
- Satu aksi utama: isi jurnal.

### 3.5 Daftar / tabel — contoh `/admin/siswa`

```
Data Siswa                                      [+ Tambah siswa]
Kelola data siswa, kelas, dan status PKL.

┌──────────────────────────────────────────────────────────────┐
│ [Cari nama/NIS…]  [Kelas ▾]  [Status ▾]  [Reset]             │
├──────────────────────────────────────────────────────────────┤
│ Nama            NIS        Kelas   Status      Aksi          │
│ Abdullah        2024…      XI RPL  Diterima    ⋯             │
│ Ahmad Fairuz    2024…      XI RPL  Diajukan    ⋯             │
│ …                                                            │
└──────────────────────────────────────────────────────────────┘
1–10 dari 24                                  [‹] 1 2 3 [›]
```

- Header halaman: judul 32 + deskripsi 14 + aksi kanan.
- Aksi **Naik kelas** di header memakai dialog konfirmasi dan berlaku global: X menjadi XI, XI menjadi XII; kelas XII tidak diubah.
- Filter bar di card terpisah; di HP jadi tombol "Filter" + drawer.
- Periode PKL tampil sebagai baris chip di atas filter bar; klik chip memfilter siswa pada periode itu. Di halaman orang tua, chip memfilter akun berdasarkan periode anaknya.
- Monitoring jurnal di `/admin/jurnal` memakai split: daftar jurnal di kiri, detail foto dan verifikasi di kanan; filter siswa, status, guru, kelas, dan rentang tanggal.
- Riwayat jurnal siswa di `/siswa/jurnal` memakai split yang sama; filter kegiatan, status, dan bulan.
- Tabel: kolom utama selalu terlihat; kolom sekunder bisa disembunyikan.
- Aksi baris di dropdown `⋯` (Edit, Lihat, Hapus).
- Hapus memakai dialog konfirmasi, bukan `confirm()`.
- Pagination server-side; jangan memuat 1.853 baris sekaligus.

### 3.6 Detail — contoh `/admin/siswa/[id]`

```
‹ Kembali
┌──────────────────────────────────────────────┬───────────────────────┐
│ Nama siswa + NIS + kelas                     │ Status PKL            │
│ Foto/avatar (opsional)                       │ ● Diterima            │
│                                              │ Perusahaan            │
│ Tabs: Ringkasan · Jurnal · Surat · Mutaba'ah │ PT MitraComm          │
│                                              │ Pembimbing            │
│ Ringkasan                                    │ Pak Sandi             │
│ • Data siswa                                 │                       │
│ • Tempat PKL                                 │ Timeline              │
│ • Jurnal terakhir                            │ ● Diajukan  12 Sep    │
│                                              │ ● Diterima  20 Sep    │
│                                              │ ○ Selesai             │
└──────────────────────────────────────────────┴───────────────────────┘
```

- Split 8/4; panel kanan sticky 24 px di bawah topbar.
- Di < 1024: panel status pindah ke atas (ringkas), timeline di bawah.
- Panel kanan memuat status akun, kata sandi (ketik manual atau buat otomatis), penempatan, dan jurnal terakhir.
- Tabs hanya untuk konten, bukan navigasi halaman.

### 3.7 Form — contoh `/siswa/jurnal/baru`

```
‹ Kembali
Isi jurnal harian
Catat kegiatan hari ini. Jurnal diverifikasi pembimbing.

┌──────────────────────────────────────────────────────────────┐
│ Tanggal *                 Waktu mulai *   Waktu selesai *    │
│ [16 Nov 2026]             [07:30]          [16:00]           │
│                                                              │
│ Kegiatan *                                                   │
│ [                                                          ] │
│                                                              │
│ Deskripsi                                                    │
│ [                                                          ] │
│                                                              │
│ Foto kegiatan *                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  Tarik foto ke sini atau [pilih file]                    │ │
│ │  JPG/PNG, maks 5 MB                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Batal]                                      [Simpan jurnal] │
└──────────────────────────────────────────────────────────────┘
```

- Lebar maks 680; satu kolom.
- Field wajib ditandai; error di bawah field.
- Di HP: tombol simpan sticky di atas bottom nav.
- Setelah simpan: toast + redirect ke daftar jurnal.
- Jangan memakai modal untuk form ini.

### 3.8 Verifikasi — `/guru/verifikasi` dan `/instruktur/verifikasi`

```
Verifikasi Jurnal                                  12 menunggu
┌──────────────────────────┬──────────────────────────────────────────────┐
│ Antrean                  │ Detail jurnal                                │
│ ● Ahmad — 15 Nov         │ Ahmad Fairuz · XI RPL · PT MitraComm         │
│ ● Hisyam — 15 Nov        │ 15 Nov 2026 · 07:30–16:00                    │
│ ○ Isa — 14 Nov           │ Scan dokumen                                 │
│ …                        │ [Foto]                                       │
│                          │ [Setujui]  [Minta revisi]                    │
└──────────────────────────┴──────────────────────────────────────────────┘
```

- Desktop: split 360 + detail.
- HP: daftar → detail (route terpisah), tombol back.
- Instruktur hanya melihat jurnal siswa di perusahaannya; aksi verifikasi aktif setelah guru pembimbing menyetujui.
- Setujui: dialog konfirmasi singkat → cap verifikasi 260 ms → badge berubah → toast.
- Minta revisi: textarea catatan wajib.
- Aksi massal hanya jika ada checkbox dan konfirmasi.

### 3.9 Surat — `/admin/surat`

```
Surat
┌──────────────────────────────────────────────────────────────┐
│ Tabs: Izin Orang Tua · Pernyataan · Pengajuan · Keberangkatan│
│       Tugas Monitoring · Perjanjian · Penarikan              │
├──────────────────────────────────────────────────────────────┤
│ Nama            Kelas    Nomor      Tanggal     Status  Aksi │
│ Ahmad Fairuz    XI RPL   001/PKL…   12 Sep      Diterima ⋯   │
└──────────────────────────────────────────────────────────────┘
```

Pratinjau surat — `/print/surat/[id]`:

```
┌──────────────────────────────────────────────────────────────┐
│ ‹ Kembali            [Unduh PDF]  [Cetak]        ← no-print  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ KOP SEKOLAH                                            │  │
│  │                                                        │  │
│  │ SURAT PENGAJUAN TEMPAT PKL                             │  │
│  │ Nomor: 001/PKL/SMK-IT/IX/2026                          │  │
│  │                                                        │  │
│  │ … isi surat …                                          │  │
│  │                                                        │  │
│  │                    Tanda tangan & cap                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- A4 proporsional; zoom 100% default.
- Toolbar tidak tercetak.
- Nomor surat otomatis, tidak `............`.
- Status surat terlihat di halaman detail, bukan di kertas.

### 3.10 Mutaba'ah — `/siswa/mutabaah`

```
Mutaba'ah Yaumiyyah
Minggu ini: ◕ 4/7

┌──────────────────────────────────────────────┐
│ Shalat subuh berjamaah        [✓]            │
│ Tilawah minimal 1 halaman     [ ]            │
│ Hafalan baru                  [ ]            │
│ Olahraga / kebugaran          [✓]            │
│ Membantu orang tua            [ ]            │
│ …                                            │
└──────────────────────────────────────────────┘
[ Simpan hari ini ]
```

- Checklist 44 px per baris; check draw 160 ms.
- Ring mingguan di atas.
- Form dirender dari pertanyaan admin: ya/tidak, pilih satu, pilih banyak, isian singkat, isian angka, essay.
- Wajib/opsional; tampilkan progres "6/8"; validasi sebelum simpan.
- Bisa diedit pada hari yang sama; terkunci setelah pergantian hari.
- Data masuk database, bukan Google Form.
- Riwayat 7 hari di bawah.

### 3.11 Pengaturan / profil

- Dua kolom: profil (foto, nama, kontak) + keamanan (ganti kata sandi).
- Jangan memakai tab jika hanya 2 bagian; cukup dua card.
- Perubahan disimpan dengan tombol eksplisit + toast.

### 3.12 Tugas — `/guru/tugas`, `/siswa/tugas`

```
Tugas PKL
┌──────────────────────────────────────────────────────────────┐
│ [Semua] [Aktif] [Selesai] [Terlambat]                        │
├──────────────────────────────────────────────────────────────┤
│ Membuat laporan kegiatan harian            Deadline 20 Nov   │
│ ● Aktif · 2 dari 5 siswa selesai             [Lihat detail]  │
│ Observasi alur produksi                    Deadline 25 Nov   │
│ ● Aktif · 0 dari 5 siswa selesai             [Lihat detail]  │
└──────────────────────────────────────────────────────────────┘
```

- Guru: buat tugas (judul, deskripsi, deadline), lihat progres per siswa.
- Siswa: lihat tugas, tandai selesai, upload bukti (opsional).
- Peringatan jika guru membuat > 3 tugas aktif dalam satu minggu.
- Status: `belum`, `selesai`, `terlambat`.
- Di HP: kartu; tombol "Tandai selesai" 44 px.
- Check draw 160 ms saat selesai; toast konfirmasi.

### 3.13 Mutaba'ah Admin — `/admin/mutabaah`

**Tujuan:** mutaba'ah punya halaman sendiri, tidak lagi tersembunyi di detail siswa.

```
Mutaba'ah
┌──────────────────────────────────────────────────────────────┐
│ [Riwayat]  [Pertanyaan]                                      │
├──────────────────────────────────────────────────────────────┤
│ Hari ini 18/24 siswa mengisi · Minggu ini 82% · Belum 6      │
├──────────────────────────────────────────────────────────────┤
│ [Tanggal ▾] [Kelas ▾] [Siswa ▾] [Kelengkapan ▾]  [Reset]     │
├──────────────────────────────────────────────────────────────┤
│ Tanggal     Siswa            Kelas   Terisi   Form       Aksi │
│ 17 Nov      Ahmad Fairuz     XI RPL  8/8      v1        ⋯    │
│ 17 Nov      Hisyam           XI RPL  5/8      v1        ⋯    │
│ 16 Nov      Abdullah         XI RPL  8/8      v1        ⋯    │
└──────────────────────────────────────────────────────────────┘
```

Tab **Pertanyaan**:

```
Form Mutaba'ah                             [+ Form baru]
┌──────────────────────────────────────────────────────────────┐
│ Mutabaah Harian · v1 · Aktif · 8 pertanyaan · 2026/2027      │
│ [Lihat] [Buat versi baru] [Arsipkan]                         │
├──────────────────────────────────────────────────────────────┤
│ 1. Shalat subuh berjamaah?        [Ya/Tidak]  [Wajib]  [↑↓]  │
│ 2. Tilawah hari ini?              [Ya/Tidak]  [Wajib]  [↑↓]  │
│ 3. Jumlah halaman tilawah         [Angka]     [Wajib]  [↑↓]  │
│ 4. Amalan yang dilakukan          [Pilih banyak]       [↑↓]  │
│ 5. Surah yang dihafal             [Isian singkat]        [↑↓] │
│ 6. Refleksi hari ini              [Essay]                [↑↓] │
└──────────────────────────────────────────────────────────────┘
```

- **Riwayat**: filter tanggal (rentang), kelas, siswa, form/versi, kelengkapan.
- **Detail**: klik baris → drawer berisi semua jawaban, dikelompokkan per pertanyaan.
- **Pertanyaan**: form builder; tambah pertanyaan, pilih tipe, wajib/opsional, opsi, min/max/satuan, urutan naik/turun.
- **Status form**: `draft` → `aktif` → `arsip`; hanya satu form aktif per periode.
- **Simpan draft / Publikasikan**: publikasi mengaktifkan versi tersebut; versi lama menjadi arsip.
- **Versioning**: form yang sudah punya jawaban tidak bisa diedit; tombol "Buat versi baru".
- **Rekap**: tingkat pengisian, distribusi pilihan, rata-rata angka; ekspor v1.1.
- **Guru**: halaman read-only `/guru/mutabaah` dengan filter siswa bimbingan.
- **Di detail siswa**: cukup ringkasan + tautan "Lihat semua mutaba'ah".

---

## 4. Responsif

### 4.1 Aturan umum

| Dari | Ke | Perubahan |
|---|---|---|
| ≥1280 | 1024–1279 | Grid card 4 → 3; chart 2/3 → 1/1 |
| 1024 | 768–1023 | Sidebar off-canvas; padding 24; tabel sembunyikan kolom sekunder |
| 768 | <768 | Bottom nav; tabel → kartu; form 1 kolom; modal → sheet; aksi full width |

### 4.2 Tabel → kartu (<768 px)

```
┌────────────────────────────────┐
│ Abdullah                       │
│ XI RPL · 2024400413            │
│ ● Diterima                     │
│ PT MitraComm                   │
│ [Lihat]              [⋯]       │
└────────────────────────────────┘
```

- Tiap kartu memuat 4–6 informasi terpenting.
- Jangan menampilkan 10 kolom di HP.
- Kolom yang jarang dipakai masuk halaman detail.

### 4.3 Form di HP

- Satu kolom, lebar penuh.
- Input 48 px (lebih tinggi dari desktop).
- Tombol simpan sticky; padding bawah 80 px agar tidak tertutup bottom nav.
- Keyboard tidak menutupi field aktif (`scroll-margin-bottom`).
- Date picker native di HP.

### 4.4 Uji lebar

Wajib dicek di:

- **390 × 844** — iPhone.
- **768 × 1024** — iPad portrait.
- **1024 × 768** — laptop kecil.
- **1440 × 900** — desktop.
- **320 px** — tidak boleh overflow.

---

## 5. Koreografi gerak per halaman

| Halaman | Masuk | Aksi | Momen |
|---|---|---|---|
| Login | Form naik 12 px, stagger 40 ms, 180 ms | Tombol press | Tidak ada |
| Ringkasan staf | Fade + 8 px, 180 ms | Card hover 2 px | Angka count-up 900 ms sekali |
| Daftar | Fade + 8 px | Baris hover, drawer filter 240 ms | Tidak ada |
| Detail | Fade + 8 px | Tab indicator 240 ms | Timeline surat 320 ms |
| Form | Fade + 8 px | Upload progress, toast | Centang sukses 300 ms |
| Verifikasi | Fade + 8 px | Panel detail 200 ms | **Cap 260 ms** |
| Tugas | Fade + 8 px | Check draw 160 ms | Tidak ada |
| Mutaba'ah admin | Fade + 8 px | Tab indicator 240 ms | Tidak ada |
| Jurnal siswa | Fade + 8 px | Check draw 160 ms | Tidak ada |
| Mutaba'ah | Fade + 8 px | Check draw 160 ms | Ring 600 ms |
| Surat | Fade + 8 px | Preview fade 200 ms | Tidak ada |
| Navigasi | — | Indikator sidebar 240 ms | — |

Aturan:

- Animasi masuk hanya sekali per navigasi, bukan per scroll.
- Jangan menunda konten yang sudah bisa dibaca.
- `prefers-reduced-motion`: semua transform off, opacity/warna saja.
- Jangan animasi dua hal besar bersamaan.

---

## 6. Implementasi Next.js

### 6.1 Struktur route

```
app/
  (auth)/
    login/page.tsx
  (app)/
    layout.tsx                 # AppShell + role guard
    admin/
      page.tsx                 # Ringkasan
      siswa/page.tsx
      siswa/[id]/page.tsx
      guru/page.tsx
      perusahaan/page.tsx
      instruktur/page.tsx
      orang-tua/page.tsx
      pengajuan/page.tsx
      penempatan/page.tsx
      jurnal/page.tsx
      verifikasi/page.tsx
      tugas/page.tsx
      mutabaah/page.tsx
      mutabaah/pertanyaan/page.tsx
      surat/page.tsx
      laporan/page.tsx
      pengaturan/page.tsx
      audit/page.tsx
    guru/
      page.tsx
      siswa/page.tsx
      verifikasi/page.tsx
      tugas/page.tsx
      mutabaah/page.tsx
      surat-tugas/page.tsx
      penarikan/page.tsx
      profil/page.tsx
    siswa/
      page.tsx
      pengajuan/page.tsx
      jurnal/page.tsx
      jurnal/baru/page.tsx
      mutabaah/page.tsx
      tugas/page.tsx
      surat/page.tsx
      profil/page.tsx
    instruktur/
      page.tsx
      siswa/page.tsx
      verifikasi/page.tsx
      penilaian/page.tsx      # v1.1
      profil/page.tsx
    ortu/
      page.tsx
      jurnal/page.tsx
      mutabaah/page.tsx
      surat/page.tsx
      profil/page.tsx
  print/
    surat/[id]/page.tsx        # tanpa AppShell
    sertifikat/[id]/page.tsx   # v1.1, tanpa AppShell
  api/
    surat/[id]/pdf/route.ts    # Node runtime
```

### 6.2 AppShell

- `app/(app)/layout.tsx` adalah **server component**.
- Ambil sesi + role dari Supabase; render `AppShell` dengan `navigation[role]`.
- `navigation.ts` menyimpan konfigurasi menu per role.
- Sidebar/topbar/bottom nav adalah client component hanya untuk interaksi (collapse, drawer).
- Jangan mengulang markup shell di halaman.

### 6.3 Page transition

- `app/(app)/template.tsx`:

```tsx
"use client";
import { motion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- `prefers-reduced-motion`: `initial={false}` atau opacity saja.
- Jangan membungkus seluruh app dengan animasi yang berjalan terus.

### 6.4 Loading, error, empty

- `loading.tsx` per segmen: skeleton mengikuti layout (bukan spinner).
- `error.tsx`: pesan jelas + tombol "Coba lagi".
- `not-found.tsx`: satu kalimat + kembali ke beranda.
- Empty state adalah komponen, bukan kondisi ad-hoc.

### 6.5 Tabel

- `@tanstack/react-table` untuk sorting/filter/pagination.
- Pagination server-side; jangan kirim 1.853 baris ke client.
- Filter disimpan di URL (`?q=&kelas=&status=`) agar bisa di-refresh/di-bookmark.
- Kolom status selalu terlihat.
- Di <768, render `StudentCard` dari data yang sama.

### 6.6 Animasi

- CSS transition untuk hover/focus/press.
- `motion/react` hanya di:
  - `SidebarNav` (`layoutId` indikator),
  - `Dialog`/`Drawer` (`AnimatePresence`),
  - `CountUp`,
  - `VerificationStamp`,
  - `MutabaahRing`.
- Jangan memakai `framer-motion` di server component.
- Jangan animasi `width/height`.

### 6.7 Aksesibilitas

- `SkipLink` pertama di AppShell.
- Fokus kembali ke pemicu setelah dialog ditutup.
- `aria-current` di nav.
- `aria-live="polite"` untuk toast.
- Tabel punya caption.
- Form error memakai `aria-describedby`.

### 6.8 Print

- Route `/print/surat/[id]` tidak memakai `(app)/layout.tsx`.
- CSS:

```css
@media print {
  .no-print { display: none !important; }
  body { background: #fff; }
  .paper { box-shadow: none; margin: 0; }
}
@page { size: A4; margin: 0; }
```

- PDF dibuat di server dengan `@react-pdf/renderer` (Node runtime), bukan Puppeteer.
- Nomor surat dari sequence Postgres, bukan input manual.

### 6.9 Performa

- `next/font` untuk Sora + Plus Jakarta Sans.
- `next/image` untuk foto; `sizes` sesuai layout.
- Kompresi foto di client sebelum upload (`browser-image-compression`).
- Skeleton, bukan layout shift.
- Tidak memuat chart library di halaman yang tidak punya chart.
- Target: LCP < 2,5 s; CLS < 0,1; Lighthouse aksesibilitas ≥ 95.

---

## 7. Peta migrasi dari Laravel

| View lama | Route baru | Komponen baru |
|---|---|---|
| `login.blade.php` | `/login` | `LoginForm` |
| `admin/dashboard.blade.php` | `/admin` | `AdminOverview` |
| `admin/siswa/index.blade.php` | `/admin/siswa` | `StudentTable` |
| `admin/siswa/create|edit` | `/admin/siswa/baru`, `/admin/siswa/[id]` | `StudentForm` |
| `admin/guru/*` | `/admin/guru` | `TeacherTable`, `TeacherForm` |
| `admin/tempat/index` | `/admin/perusahaan` | `CompanyTable` |
| `daily.blade.php` | `/admin/jurnal` | `JournalTable` |
| `admin/surat/*` | `/admin/surat` | `LetterTable`, `LetterPreview` |
| `guru/dashboard` | `/guru` | `TeacherOverview` |
| `guru/siswa/*` | `/guru/siswa`, `/guru/verifikasi` | `MenteeList`, `VerificationSplit` |
| `siswa/dashboard` | `/siswa` | `StudentHome` |
| `siswa/activity/*` | `/siswa/jurnal` | `JournalForm`, `JournalList` |
| `siswa/mutabaah` | `/siswa/mutabaah` | `MutabaahChecklist`, `MutabaahRing` |
| `surat/*.blade.php` | `/print/surat/[id]` | `LetterPaper` |
| `sertifikat/template` | `/print/sertifikat/[id]` | `CertificatePaper` |

Catatan migrasi:

- Role `instruktur` dan `ortu` adalah baru; jangan paksakan ke enum lama.
- Mutaba'ah harus masuk database, bukan link Google Form.
- Surat balasan perusahaan butuh tabel + upload + approval.
- Nomor surat butuh sequence, bukan `............`.

---

## 8. Checklist layout

- [ ] Semua halaman memakai `AppShell`; tidak ada sidebar yang ditulis ulang.
- [ ] Sidebar 264 px; topbar 64 px; konten maks 1280 px.
- [ ] Grid 12 kolom, gap 24/16.
- [ ] Tidak ada scroll horizontal di 390 px.
- [ ] Tabel menjadi kartu di <768 px.
- [ ] Form 1 kolom di HP; tombol simpan sticky.
- [ ] Modal menjadi bottom sheet di HP.
- [ ] Bottom nav hanya untuk role lapangan.
- [ ] Header halaman punya judul + deskripsi + satu aksi utama.
- [ ] Empty/loading/error state ada di setiap halaman data.
- [ ] Surat punya route print tanpa shell.
- [ ] `prefers-reduced-motion` tidak menyembunyikan konten.
- [ ] Diuji 320/390/768/1024/1440.
- [ ] Saat halaman pertama dibangun: `node <skill>/scripts/gate.mjs --start http://localhost:3000 --kind software --category "Sistem PKL sekolah" --primary "Isi jurnal"`.

---

## 9. Hubungan dengan dokumen lain

- [`PRD.md`](./PRD.md) — fitur, role, status, acceptance.
- [`ERD.dbml`](./ERD.dbml) — tabel, enum, relasi.
- [`DESIGN.md`](./DESIGN.md) — alasan, arah, suara.
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — token, komponen, warna, tipografi, print.
- [`ANIMATION.md`](./ANIMATION.md) — gerak, durasi, momen, implementasi.
- [`TECH_STACK.md`](./TECH_STACK.md) — pustaka yang dipakai.
- [`AGENTS.md`](./AGENTS.md) — aturan kerja agent.
- `LAYOUT.md` (dokumen ini) — susunan halaman, responsif, implementasi.

Kalau layout berubah, cek dulu apakah token/komponen masih cukup. Jangan menambah hex atau ukuran baru di level halaman.
