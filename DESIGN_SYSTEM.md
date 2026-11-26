# DESIGN_SYSTEM.md — Token & Komponen Web PKL

> Spesifikasi teknis dari arah desain di [`DESIGN.md`](./DESIGN.md).
> Semua nilai di sini adalah **satu-satunya sumber kebenaran**. Komponen tidak boleh memakai hex, ukuran, atau durasi di luar token ini.

Versi 1.0 · 16 November 2026
Stack acuan: Next.js (App Router) · Tailwind CSS v4 · shadcn/ui · Lucide · `motion/react`

---

## 0. Cara memakai sistem ini

1. Token didefinisikan sekali di `globals.css` lewat `@theme` (Tailwind v4) dan CSS variables.
2. Komponen dibuat di `components/ui/*` dan hanya memakai token.
3. Halaman tidak menulis warna/ukuran langsung; halaman menyusun komponen.
4. Kalau butuh nilai baru, tambahkan token di sini dulu — jangan hardcode.
5. Satu komponen = satu tanggung jawab. Tidak ada varian "khusus halaman".

---

## 1. Warna

### 1.1 Teal brand (identitas sekolah)

| Token | Hex | Kontras di putih | Pakai untuk |
|---|---|---|---|
| `brand-50` | `#ECF8F7` | — | Latar sangat muda, hover baris |
| `brand-100` | `#D3EFED` | — | Latar badge lembut |
| `brand-200` | `#A7DFDC` | — | Border lembut |
| `brand-300` | `#73C9C5` | — | Grafik, garis |
| `brand-400` | `#3FB0AC` | — | Grafik |
| `brand-500` | `#1D9A96` | 3,43:1 | **Aksen, ikon aktif, focus ring** — bukan teks normal |
| `brand-600` | `#17807C` | 4,76:1 | Teks teal besar, link |
| `brand-700` | `#126662` | 6,77:1 | Teks teal, tombol sekunder |
| `brand-800` | `#0F4F4C` | 9,39:1 | Judul, sidebar alternatif |
| `brand-900` | `#0B3B39` | — | Sidebar hover |
| `brand-950` | `#072422` | — | Teks paling gelap |

### 1.2 Warna aksi

| Token | Hex | Kontras | Pakai |
|---|---|---|---|
| `primary` | `#147A76` | 5,15:1 di putih | Tombol utama, link penting |
| `primary-hover` | `#0F6E6A` | 6,07:1 | Hover tombol |
| `primary-active` | `#0B5A57` | — | Tekan |
| `on-primary` | `#FFFFFF` | 5,15:1 | Teks di tombol |
| `primary-subtle` | `#E7F5F3` | — | Latar tombol sekunder |
| `focus` | `#1D9A96` | 3,43:1 (UI ≥3:1) | Ring fokus 2 px |

> **Aturan:** teks putih hanya di atas `primary` atau lebih gelap. Jangan menaruh teks putih di `brand-500`.

### 1.3 Sidebar

| Token | Hex | Pakai |
|---|---|---|
| `sidebar` | `#0B2F2D` | Latar sidebar |
| `sidebar-hover` | `#123D3A` | Hover item |
| `sidebar-active` | `#14524E` | Item aktif |
| `sidebar-text` | `#EAF4F2` | Teks item |
| `sidebar-muted` | `#8FB3AE` | Label grup, ikon nonaktif |
| `sidebar-line` | `#1C4A46` | Garis pemisah |

Item aktif memakai pill `sidebar-text` dengan teks `sidebar`. Brand dan footer
memakai kartu kaca: border putih transparan, gradient tipis, dan aksen gold.

### 1.4 Gold (dari logo)

| Token | Hex | Kontras | Pakai |
|---|---|---|---|
| `gold-50` | `#FBF7EE` | — | Latar hangat |
| `gold-100` | `#F5EBD7` | — | Badge resmi |
| `gold-200` | `#EAD6B0` | — | Border |
| `gold-300` | `#DFC28A` | — | Aksen |
| `gold-400` | `#D1AE6C` | 2,10:1 di putih; 6,84:1 di sidebar | **Garis aksen, indikator, cap** — bukan teks di putih |
| `gold-500` | `#C09A52` | — | Grafik |
| `gold-600` | `#A8823C` | — | Grafik |
| `gold-700` | `#8A6A1F` | 5,05:1 di putih | Teks gold yang harus terbaca |

### 1.5 Maroon (logo & cap resmi)

| Token | Hex | Kontras | Pakai |
|---|---|---|---|
| `maroon-100` | `#F7E6E6` | — | Latar langka |
| `maroon-500` | `#820101` | 10,75:1 | Cap "SAH", elemen resmi, logo |
| `maroon-600` | `#6B0101` | — | Hover cap |
| `maroon-700` | `#550101` | — | Teks resmi |

> Maroon **tidak** dipakai untuk error. Error memakai `danger` agar konsisten dengan sistem.

### 1.6 Netral

| Token | Hex | Pakai |
|---|---|---|
| `canvas` | `#F5F8F7` | Latar halaman |
| `surface` | `#FFFFFF` | Card, tabel, modal |
| `surface-muted` | `#EEF4F2` | Header tabel, area bantu |
| `border` | `#DCE7E4` | Garis 1 px |
| `border-strong` | `#C6D6D2` | Hover border, input aktif |
| `ink` | `#14201F` | Teks utama (15,65:1) |
| `ink-soft` | `#3D4F4D` | Teks sekunder (8,11:1) |
| `muted` | `#5C6F6D` | Meta, label (4,98:1) |
| `disabled` | `#9AA9A6` | Teks nonaktif (jangan untuk info penting) |

### 1.7 Warna semantik

| Nama | Teks | Latar | Border | Pakai |
|---|---|---|---|---|
| `success` | `#146C4C` | `#E7F5EE` | `#B7E3CE` | Diterima, terverifikasi, selesai |
| `warning` | `#8A5A00` | `#FFF6E0` | `#F0D9A6` | Menunggu, perlu tindakan |
| `danger` | `#B42318` | `#FEEBE9` | `#F5C6C2` | Ditolak, gagal, terlambat |
| `info` | `#175CD3` | `#EAF1FE` | `#C7D7FE` | Revisi, informasi, pengajuan |
| `neutral` | `#475467` | `#F2F4F7` | `#D0D5DD` | Draft, belum ada, dibatalkan |

Semua pasangan teks/latar di atas ≥ 4,5:1.

### 1.8 Pemetaan status PKL

Status canonical ada di `PRD.md` §7. Badge UI memakai warna berikut:

| Status canonical | Label UI | Warna | Ikon |
|---|---|---|---|
| `draft` | Belum diajukan | neutral | `circle-dashed` |
| `diajukan` | Diajukan | info | `send` |
| `izin_ortu_terbit` | Izin orang tua terbit | info | `file-text` |
| `izin_ortu_diunggah` | Izin diunggah | warning | `clock-3` |
| `pengajuan_terbit` | Surat pengajuan terbit | info | `file-text` |
| `balasan_diunggah` | Balasan diunggah | warning | `clock-3` |
| `diterima` | Diterima | success | `check` |
| `keberangkatan_terbit` | Surat keberangkatan terbit | success | `file-check` |
| `berlangsung` | Berlangsung | success | `play` |
| `penarikan_terbit` | Surat penarikan terbit | info | `file-text` |
| `selesai` | Selesai | success | `badge-check` |
| `ditolak` | Ditolak | danger | `x` |
| `dibatalkan` | Dibatalkan | neutral | `ban` |

Status dokumen:

| Status | Warna | Label |
|---|---|---|
| `menunggu` | warning | Menunggu verifikasi |
| `diterima` | success | Diterima |
| `revisi` | info | Perlu revisi |
| `ditolak` | danger | Ditolak |

Status jurnal:

| Status | Warna | Label |
|---|---|---|
| `menunggu` | warning | Menunggu verifikasi |
| `terverifikasi_guru` | info | Terverifikasi pembimbing |
| `terverifikasi_instruktur` | success | Terverifikasi instruktur |
| `revisi` | danger | Perlu revisi |

Status tugas:

| Status | Warna | Label |
|---|---|---|
| `belum` | neutral | Belum selesai |
| `selesai` | success | Selesai |
| `terlambat` | danger | Terlambat |

> Warna tidak pernah sendirian. Selalu ada teks + ikon.

### 1.9 Palet grafik

Maksimal 4 seri. Urutan: `brand-500`, `brand-300`, `gold-400`, `brand-800`. Untuk negatif: `danger`. Jangan memakai pelangi.

---

## 2. Tipografi

### 2.1 Keluarga font

| Token | Font | Berat | Pakai |
|---|---|---|---|
| `font-display` | **Sora** | 600, 700 | Judul halaman, angka statistik, judul login |
| `font-sans` | **Plus Jakarta Sans** | 400, 500, 600 | Semua UI, isi, tabel, form |

Muat lewat `next/font/google`, subset `latin`, `display: swap`. Jangan memuat Poppins, Nunito, atau font ketiga.

### 2.2 Skala

| Token | Ukuran / line-height | Berat | Font | Pakai |
|---|---|---|---|---|
| `display-xl` | 48 / 52 px | 700 | Sora | Hanya judul login |
| `display` | 40 / 44 px | 600 | Sora | Angka statistik |
| `h1` | 32 / 40 px | 600 | Sora | Judul halaman |
| `h2` | 24 / 32 px | 600 | Sora | Judul seksi |
| `h3` | 20 / 28 px | 600 | PJS | Judul card |
| `body-lg` | 18 / 28 px | 400 | PJS | Pengantar, deskripsi |
| `body` | 16 / 26 px | 400 | PJS | Isi utama |
| `body-sm` | 14 / 22 px | 400 | PJS | Tabel, isi sekunder |
| `label` | 13 / 18 px | 500 | PJS | Label form, meta |
| `caption` | 12 / 16 px | 500 | PJS | Timestamp, catatan |
| `button` | 15 / 20 px | 600 | PJS | Tombol |
| `table` | 14 / 20 px | 400 | PJS | Sel tabel |

Aturan:

- Isi yang dibaca ≥ 16 px; tabel boleh 14 px.
- Jangan < 12 px.
- Judul memakai sentence case.
- `font-variant-numeric: tabular-nums` untuk NIS, tanggal, jam, nomor surat, statistik.
- Panjang baris ≤ 68 karakter (`max-w-[68ch]`).
- Letter-spacing judul: `-0.02em`; body: `0`.

### 2.3 Hirarki halaman

Satu halaman hanya punya **satu `h1`**. Card memakai `h3`. Jangan melompati level heading.

---

## 3. Spacing

Skala 4 px:

| Token | px | Pakai |
|---|---|---|
| `space-1` | 4 | Gap ikon-teks |
| `space-2` | 8 | Gap kecil |
| `space-3` | 12 | Padding sel |
| `space-4` | 16 | Padding card mobile, gap form |
| `space-5` | 20 | Gap form |
| `space-6` | 24 | Padding card desktop, gap grid |
| `space-8` | 32 | Jarak antar-seksi, padding halaman desktop |
| `space-10` | 40 | Jarak blok besar |
| `space-12` | 48 | Jarak seksi |
| `space-16` | 64 | Jarak hero/panel |
| `space-20` | 80 | Hanya halaman auth |
| `space-24` | 96 | Hanya halaman auth |

Layout:

- Padding halaman: **32** desktop, **24** tablet, **16** HP.
- Padding card: **24** desktop, **20** tablet, **16** HP.
- Gap grid: **24** desktop, **16** HP.
- Jarak antar-seksi: **32** desktop, **24** HP.
- Jarak label → input: **6**.
- Jarak input → error: **6**.

---

## 4. Radius

| Token | px | Pakai |
|---|---|---|
| `radius-xs` | 6 | Badge kecil, tag |
| `radius-sm` | 8 | Input, tombol, select |
| `radius-md` | 12 | Card, panel, tabel |
| `radius-lg` | 16 | Modal, drawer, pratinjau |
| `radius-full` | 999 | Pill, avatar, status |

Satu halaman tidak mencampur radius 4 px dan 20 px. Sistem ini memakai **8/12/16**.

---

## 5. Border & elevation

| Token | Nilai | Pakai |
|---|---|---|
| `border` | `1px solid #DCE7E4` | Semua garis |
| `border-strong` | `1px solid #C6D6D2` | Hover, input aktif |
| `shadow-xs` | `0 1px 2px rgba(16,32,30,.05)` | Card |
| `shadow-sm` | `0 1px 3px rgba(16,32,30,.06), 0 1px 2px rgba(16,32,30,.04)` | Dropdown |
| `shadow-md` | `0 8px 24px rgba(16,32,30,.08)` | Modal, popover |
| `shadow-lg` | `0 16px 48px rgba(16,32,30,.12)` | Drawer |

Aturan:

- Card memakai **border + shadow-xs**, bukan shadow besar.
- Tabel tidak memakai shadow; cukup border.
- Jangan memakai shadow berwarna atau glow.

---

## 6. Ikon

- Library: **Lucide** (`lucide-react`).
- Ukuran: 16 (inline), 20 (tombol), 24 (nav), 32 (empty state).
- Stroke: **1,75**.
- Warna: mengikuti teks; ikon status mengikuti warna status.
- Ikon-only button wajib `aria-label` dan area 44×44.
- Jangan memakai emoji sebagai ikon.
- Jangan mencampur ikon filled dan outline dalam satu layar.

---

## 7. Grid & breakpoint

| Breakpoint | Lebar | Perilaku |
|---|---|---|
| `xs` | 390 | HP kecil; 1 kolom; bottom nav |
| `sm` | 640 | HP besar; 1 kolom; form penuh |
| `md` | 768 | Tablet; sidebar off-canvas; 2 kolom card |
| `lg` | 1024 | Desktop kecil; sidebar 264; tabel penuh |
| `xl` | 1280 | Desktop; konten maks 1280 |
| `2xl` | 1440 | Desktop lebar; tetap maks 1280 |

- Grid: 12 kolom, gap 24 (desktop) / 16 (HP).
- Konten maksimum: **1280 px**.
- Sidebar: **264 px** (collapsed 80).
- Topbar: **64 px**.
- Bottom nav: **64 px + safe-area**.
- Tabel: baris **56 px**, header **44 px**.
- Form: lebar maks **680 px**.
- Teks: maks **68ch**.

---

## 8. Komponen

### 8.1 Button

| Varian | Latar | Teks | Border | Pakai |
|---|---|---|---|---|
| `primary` | `primary` | putih | — | Satu aksi utama per layar |
| `secondary` | putih | `ink` | `border-strong` | Aksi pendukung |
| `ghost` | transparan | `ink-soft` | — | Aksi dalam tabel/card |
| `danger` | `danger` | putih | — | Hapus, tolak (konfirmasi) |
| `link` | transparan | `primary` | — | Navigasi teks |

Ukuran:

| Ukuran | Tinggi | Padding-x | Font |
|---|---|---|---|
| `sm` | 36 | 12 | 14/20 |
| `md` | 44 | 16 | 15/20 |
| `lg` | 48 | 24 | 16/20 |
| `icon` | 44×44 | — | — |

State: default, hover (warna 14% lebih gelap + naik 1 px), active (turun 1 px, scale 0,985), focus (ring 2 px), disabled (opacity 50%, tidak bisa diklik), loading (spinner 16 px + teks tetap).

Aturan: maksimal **satu** tombol primary per layar. Jangan memakai gradient, shadow tebal, atau ikon di setiap tombol.

### 8.2 Form field

Anatomi:

```
Label (13/18, 500)
[ input 44 px, radius 8, border 1 px ]
Helper / error (12/16)
```

- Label selalu terlihat; placeholder bukan label.
- Input 44 px; textarea minimal 120 px.
- Fokus: border `brand-500` + ring 3 px `brand-100`.
- Error: border `danger`, ikon `circle-alert`, teks error di bawah.
- Wajib: tanda `*` setelah label, bukan di placeholder.
- Read-only: latar `surface-muted`, teks `ink-soft`.

### 8.3 Select, date, time

- Tinggi 44 px, chevron 16 px di kanan.
- Date picker memakai bahasa Indonesia, format `dd MMM yyyy`.
- Time picker 24 jam (`07:30`).
- Jangan memakai placeholder sebagai nilai.

### 8.4 Checkbox, radio, switch

- Checkbox 20×20, label 16 px, area klik 44 px.
- Switch hanya untuk pengaturan on/off, bukan untuk memilih.
- Centang muncul 160 ms (scale 70→100) saat dipilih.

### 8.5 File upload

- Dropzone: border dashed 1,5 px `border-strong`, radius 12, padding 24, latar `surface`.
- Hover/drag: border `brand-500`, latar `brand-50`.
- Preview gambar 72×72, radius 8.
- Progress bar 4 px, `brand-500`, durasi mengikuti unggahan nyata.
- Sukses: centang digambar 300 ms; file tetap terlihat.
- Batas: JPG/PNG/PDF, maks 5 MB (foto jurnal 2 MB setelah kompresi).
- Error: "Ukuran melebihi 5 MB. Kompres atau pilih file lain."

### 8.6 Status badge

- Pill, tinggi 24, padding 2×10, font 12/16 600.
- Titik 6 px + teks; atau ikon 14 px + teks.
- Warna mengikuti §1.8.
- Jangan memakai badge untuk angka notifikasi (pakai counter 18 px).

### 8.7 Card

| Varian | Isi | Pakai |
|---|---|---|
| `stat` | Label 13, angka 40, delta 13, ikon | Dashboard |
| `content` | Judul 20, isi 16, aksi | Halaman detail |
| `action` | Ikon 24, judul 20, deskripsi 16, panah | Antrean tugas |
| `empty` | Ikon 32, judul 20, deskripsi 16, tombol | Data kosong |

- Padding 24/20/16; radius 12; border 1 px; shadow-xs.
- Hover hanya untuk card yang bisa diklik: naik 2 px, border `border-strong`.
- Card tidak bersarang lebih dari 2 level.

### 8.8 Table

Anatomi:

```
Header halaman (judul + deskripsi + aksi)
Filter bar (search, select, tanggal, reset)
Tabel (header sticky, baris 56, hover, aksi)
Footer (jumlah data + pagination)
```

- Header tabel: 44 px, latar `surface-muted`, font 13/18 600, teks `ink-soft`.
- Baris: 56 px, border bawah 1 px, hover `brand-50`.
- Kolom pertama boleh sticky saat scroll horizontal.
- Aksi baris: ikon 20 px + tooltip, atau dropdown `…`.
- Kolom Status wajib terlihat tanpa scroll horizontal.
- Di < 768 px, tabel menjadi **kartu** (label kiri, nilai kanan) atau scroll dengan kolom pertama sticky + bayangan tepi.
- Pagination: 10/25/50 per halaman; tampilkan "1–10 dari 24".
- Empty: baris kosong dengan pesan + aksi, bukan tabel kosong.
- Loading: skeleton 5 baris, bukan spinner penuh.

### 8.9 Modal / dialog

- Lebar maks 480 (form) / 640 (detail).
- Backdrop `rgba(11,47,45,.48)`.
- Panel: radius 16, shadow-md, padding 24.
- Masuk: fade backdrop 180 ms (`--m-base`) + panel scale 0,98→1 + naik 6 px, 200 ms (`--m-panel`).
- Tutup: 120 ms.
- Fokus masuk ke elemen pertama; Esc menutup; fokus kembali ke pemicu.
- Jangan memakai modal untuk form panjang (> 6 field) — pakai halaman.

### 8.10 Drawer / sheet

- Dari kanan (filter desktop) atau bawah (HP).
- Lebar 360 desktop; tinggi maks 85vh di HP.
- Slide 240 ms; backdrop sama seperti modal.
- Selalu ada tombol "Tutup" dan "Terapkan".

### 8.11 Toast

- Posisi kanan bawah (desktop), atas (HP).
- Lebar maks 360; radius 12; shadow-md; padding 16.
- Ikon status + judul 14/20 600 + pesan 13/18.
- Masuk 180 ms (naik 8 px), keluar 120 ms.
- Auto-dismiss 4 detik; pause saat hover; bisa ditutup.
- Maksimal 3 toast; yang lama digeser.

### 8.12 Empty state

- Ikon 32 px `muted`.
- Judul 20 px + satu kalimat 16 px.
- Satu aksi (kalau ada).
- Tidak ada ilustrasi stok, tidak ada animasi loop.

Contoh: "Belum ada jurnal hari ini. Isi jurnal sebelum pukul 23.59." + tombol "Isi jurnal".

### 8.13 Stepper / timeline

- Untuk alur PKL 4 tahap dan status surat.
- Vertikal di detail; horizontal di halaman pengajuan (desktop).
- Titik 24 px; garis 2 px; selesai `brand-600`, aktif `brand-500` + ring, belum `border`.
- Label 13/18 600; deskripsi 12/16.
- Saat status maju: garis terisi 320 ms, titik tumbuh sekali.
- Tidak berkedip.

### 8.14 Progress ring / bar

- Ring 72 px, stroke 8, `brand-500` di atas `brand-100`.
- Bar 6 px, radius full.
- Nilai tengah 18/24 600, tabular.
- Isi 600 ms saat pertama tampil; reduced motion langsung.
- Jangan animasi loop.

### 8.15 Tabs / segmented control

- Hanya untuk memfilter tampilan dalam satu halaman, bukan navigasi utama.
- Tinggi 36; radius 8; indikator bergeser 240 ms.
- Jangan memakai tab untuk konten yang harus bisa di-bookmark.

### 8.16 Pagination

- Tombol 36×36; halaman aktif `primary` + teks putih.
- Prev/next dengan ikon + label di desktop.
- Tampilkan total data.

### 8.17 Breadcrumb

- 13/18 `muted`; pemisah `/`; halaman aktif `ink`.
- Maksimal 3 level.
- Di HP, hanya tampilkan level terakhir + tombol back.

### 8.18 Tooltip

- Hanya untuk ikon/aksi singkat; bukan untuk informasi penting.
- Muncul 300 ms setelah hover; hilang 120 ms.
- Latar `ink`, teks putih 12/16.

### 8.19 Skeleton

- Latar `surface-muted`, radius 6.
- Shimmer halus dari kiri ke kanan, 1,4 detik, hanya saat memuat.
- Bentuk mengikuti konten (bukan kotak acak).
- Jangan shimmer terang atau berkedip.

### 8.20 Cap verifikasi (khusus)

- Komponen `VerificationStamp`.
- Lingkaran 96 px, border 3 px `brand-700`, teks "TERVERIFIKASI" 12/16 700, tanggal 10/14, nama verifikator 10/14.
- Muncul dengan scale 1,12→1, rotasi -6°, opacity 0→1, 260 ms, sekali.
- Warna cap: teal untuk guru, maroon untuk cap resmi sekolah (opsional).
- Reduced motion: langsung tampil.

### 8.21 AppShell nav item

- Tinggi 44; padding 8; radius 16; gap 12.
- Default: teks `sidebar-muted`; hover: latar putih transparan, teks putih.
- Aktif: pill `sidebar-text`, teks `sidebar`, indikator gold 3 px di kiri.
- Ikon 18 px di dalam tile 32 px.
- Brand: kapsul kaca dengan logo sekolah. Footer: kartu kaca dengan avatar gold.
- Indikator aktif meluncur 240 ms (`layoutId`).

### 8.22 Question builder (mutaba'ah)

- Dipakai admin untuk membuat pertanyaan mutaba'ah.
- Tipe: `ya_tidak`, `pilih_satu`, `pilih_banyak`, `isian_singkat`, `isian_angka`, `essay`.
- Satu baris pertanyaan: nomor, teks, badge tipe, wajib/opsional, tombol naik/turun, hapus.
- Urutan memakai tombol naik/turun 44 px — **tidak** memakai library drag-and-drop.
- Untuk `pilih_satu`/`pilih_banyak`: daftar opsi dengan tambah/hapus; minimal 2 opsi.
- Untuk `isian_angka`: min, max, satuan.
- Tombol "Pratinjau" menampilkan form seperti yang dilihat siswa.
- Form yang sudah punya jawaban: banner "Form terkunci" + tombol "Buat versi baru"; field read-only.
- Simpan draft vs publikasikan; publikasi membuat versi aktif.
- Di HP: builder satu kolom; preview menjadi sheet penuh.

---

## 9. Motion tokens

| Token | Nilai | Pakai |
|---|---|---|
| `--m-press` | 90 ms | Tekan |
| `--m-fast` | 120 ms | Hover keluar, tutup |
| `--m-check` | 160 ms | Centang checkbox/verifikasi |
| `--m-base` | 180 ms | Hover masuk, page enter, toast |
| `--m-panel` | 200 ms | Modal, dropdown |
| `--m-slide` | 240 ms | Sidebar, drawer |
| `--m-stamp` | 260 ms | Cap |
| `--m-upload` | 300 ms | Centang unggah |
| `--m-timeline` | 320 ms | Garis waktu surat |
| `--m-count` | 900 ms | Count-up |
| `--m-progress` | 600 ms | Ring/bar |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | UI |
| `--ease-enter` | `cubic-bezier(.22,1,.36,1)` | Masuk |

Aturan:

- Hanya `transform`, `opacity`, `color`, `background-color`, `border-color`.
- Jangan animasi `width/height/top/left/margin`.
- Tidak ada animasi > 400 ms untuk interaksi.
- Tidak ada animasi berulang.
- `prefers-reduced-motion` menonaktifkan transform.

---

## 10. Aksesibilitas

- Kontras: isi ≥ 7:1; sekunder ≥ 4,5:1; UI ≥ 3:1.
- Fokus: 2 px `#1D9A96`, offset 2 px, selalu terlihat.
- Target sentuh ≥ 44×44; jarak ≥ 8 px.
- Label terlihat; `aria-describedby` untuk helper/error.
- `aria-invalid` + error di bawah field.
- Status: teks + ikon; jangan warna saja.
- Heading berurutan; satu `h1`.
- Tabel: `<caption>`, `scope`, header sticky.
- Gambar: `alt` deskriptif; dekoratif `alt=""`.
- Ikon-only: `aria-label`.
- Skip link pertama di halaman.
- `lang="id"`.
- `prefers-reduced-motion`.
- Uji keyboard: Tab, Shift+Tab, Enter, Esc, panah pada menu.

---

## 11. Print (surat & sertifikat)

| Properti | Nilai |
|---|---|
| Ukuran | A4 210×297 mm |
| Margin | 20 mm atas/bawah, 25 mm kiri/kanan |
| Font | Times New Roman 12 pt |
| Line-height | 1,25 |
| Warna | Hitam `#000000` |
| Kop | Gambar 100% lebar, tinggi otomatis |
| Footer | Fixed bottom, 100% lebar |
| Nomor halaman | Kanan bawah, 9 pt |
| Tanda tangan | Area 60 mm |
| Cap | Maroon, opacity 0,9, rotasi -6° |

Aturan:

- Pratinjau di layar memakai latar `#E9EFED` dan kertas putih A4.
- Toolbar pratinjau tidak ikut tercetak (`@media print { .no-print { display:none } }`).
- Tidak ada warna teal di badan surat; teal hanya di kop.
- Nomor surat memakai `tabular-nums`.
- Jangan memotong tabel lampiran; gunakan halaman baru.

---

## 12. Tailwind v4 — token awal

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-sora), var(--font-plus-jakarta), sans-serif;

  --color-brand-50: #ECF8F7;
  --color-brand-100: #D3EFED;
  --color-brand-200: #A7DFDC;
  --color-brand-300: #73C9C5;
  --color-brand-400: #3FB0AC;
  --color-brand-500: #1D9A96;
  --color-brand-600: #17807C;
  --color-brand-700: #126662;
  --color-brand-800: #0F4F4C;
  --color-brand-900: #0B3B39;
  --color-brand-950: #072422;

  --color-primary: #147A76;
  --color-primary-hover: #0F6E6A;
  --color-primary-active: #0B5A57;
  --color-primary-subtle: #E7F5F3;

  --color-canvas: #F5F8F7;
  --color-surface: #FFFFFF;
  --color-surface-muted: #EEF4F2;
  --color-border: #DCE7E4;
  --color-border-strong: #C6D6D2;
  --color-ink: #14201F;
  --color-ink-soft: #3D4F4D;
  --color-muted: #5C6F6D;
  --color-disabled: #9AA9A6;

  --color-gold-400: #D1AE6C;
  --color-gold-700: #8A6A1F;
  --color-maroon-500: #820101;

  --color-success: #146C4C;
  --color-success-bg: #E7F5EE;
  --color-warning: #8A5A00;
  --color-warning-bg: #FFF6E0;
  --color-danger: #B42318;
  --color-danger-bg: #FEEBE9;
  --color-info: #175CD3;
  --color-info-bg: #EAF1FE;

  --color-sidebar: #0B2F2D;
  --color-sidebar-hover: #123D3A;
  --color-sidebar-active: #14524E;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-xs: 0 1px 2px rgba(16, 32, 30, 0.05);
  --shadow-sm: 0 1px 3px rgba(16, 32, 30, 0.06), 0 1px 2px rgba(16, 32, 30, 0.04);
  --shadow-md: 0 8px 24px rgba(16, 32, 30, 0.08);

  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Catatan: `--font-plus-jakarta` dan `--font-sora` berasal dari `next/font/google` yang diekspos sebagai CSS variable di `layout.tsx`.

---

## 13. Struktur file komponen

```
components/
  ui/                 # primitif: button, input, badge, card, table, dialog...
  app/                # AppShell, Sidebar, Topbar, BottomNav, PageHeader
  pkl/                # komponen domain: StatusBadge, LetterTimeline, JournalCard,
                      # VerificationStamp, MutabaahRing, StudentPicker
  motion/             # PageEnter, CountUp, AnimatedNumber, Presence
lib/
  tokens.ts           # konstanta yang butuh JS (status map, nav per role)
```

Aturan penamaan:

- Komponen: `PascalCase` (`StatusBadge.tsx`).
- Hook: `useCamelCase`.
- Token CSS: `kebab-case` (`--color-brand-500`).
- Status: `snake_case` di database, label Indonesia di UI.
- Jangan membuat folder `views/` atau `pages/` duplikat.

---

## 14. Checklist komponen

- [ ] Memakai token, tidak ada hex langsung.
- [ ] Semua state: default, hover, focus, active, disabled, loading, error.
- [ ] Bisa dioperasikan keyboard.
- [ ] Ada `aria-*` yang relevan.
- [ ] Target sentuh ≥ 44 px.
- [ ] Teks tidak terpotong di 390 px.
- [ ] `prefers-reduced-motion` aman.
- [ ] Tidak ada animasi loop.
- [ ] Tidak ada teks placeholder yang tertinggal.

---

## 15. Hubungan dengan dokumen lain

| Dokumen | Isi |
|---|---|
| [`PRD.md`](./PRD.md) | Fitur, role, status, acceptance |
| [`ERD.dbml`](./ERD.dbml) | Tabel, enum, relasi |
| [`DESIGN.md`](./DESIGN.md) | Arah desain, audit, voice |
| [`LAYOUT.md`](./LAYOUT.md) | Shell, halaman, responsif |
| [`ANIMATION.md`](./ANIMATION.md) | Gerak, durasi, momen, implementasi |
| [`TECH_STACK.md`](./TECH_STACK.md) | Pustaka yang dipakai |
| [`AGENTS.md`](./AGENTS.md) | Aturan kerja agent |

Perubahan token harus disinkronkan ke `DESIGN.md` §7 dan `ANIMATION.md` §2.
