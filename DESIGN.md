# DESIGN.md — Arah Desain Web PKL SMK-IT As-Syifa

> Dokumen ini menjawab satu pertanyaan: **seperti apa rasanya memakai sistem PKL ini?**
> Token dan komponen ada di [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Susunan halaman ada di [`LAYOUT.md`](./LAYOUT.md). Gerak ada di [`ANIMATION.md`](./ANIMATION.md). Pustaka ada di [`TECH_STACK.md`](./TECH_STACK.md).

Versi 1.0 · 16 November 2026
Basis: audit aplikasi `syifapkl` (Laravel 10) + alur PKL 4 tahap
Skill: `design-taste-frontend` (tasteskill 2.5) — prinsip anti-slop diadaptasi untuk aplikasi internal, bukan landing page.

---

## 0. Ringkasan keputusan

| Keputusan | Nilai |
|---|---|
| Konsep | **Buku Kerja** — buku catatan PKL yang rapi, tenang, dan resmi |
| Warna utama | Teal sekolah `#1D9A96` dipertahankan sebagai identitas |
| Warna aksi | Teal gelap `#147A76` (lolos kontras teks putih 5,15:1) |
| Warna pendukung | Gold `#D1AE6C` (dari logo) dan maroon `#820101` (hanya cap/surat) |
| Tipografi | **Sora** untuk judul & angka, **Plus Jakarta Sans** untuk UI & isi |
| Gerak | 120–240 ms, menjelaskan status, tanpa animasi scroll |
| Shell | Satu `AppShell` untuk semua role; sidebar di desktop, bottom nav di HP |
| Prioritas | Mobile-first untuk siswa/orang tua, dense untuk admin/guru |
| Surat | Tetap terasa resmi: Times New Roman, kop, cap, nomor surat |

---

## 1. Siapa yang memakai, dalam kondisi apa

| Role | Perangkat utama | Konteks | Pekerjaan utama | Yang dibutuhkan |
|---|---|---|---|---|
| **Siswa** | HP (90%) | Di tempat PKL, kadang sinyal lemah, di luar ruangan | Isi jurnal, mutaba'ah, cek status surat | Cepat, besar, jelas, tidak banyak klik |
| **Guru pembimbing** | Laptop / tablet | Di sekolah, sambil mengajar | Verifikasi jurnal, monitoring siswa, surat tugas | Antrean kerja, konteks lengkap, aksi massal |
| **Admin** | Laptop | Di lab/tata usaha | Data master, menyetujui surat, terbitkan surat | Tabel padat, filter, audit trail |
| **Instruktur perusahaan** | Laptop / HP | Di perusahaan, sela pekerjaan | Verifikasi jurnal, penilaian | Rendah friksi, tidak perlu belajar sistem |
| **Orang tua** | HP | Rumah / kerja | Melihat jurnal & perkembangan anak | Tenang, ringkas, tanpa istilah teknis |

**Implikasi:** satu sistem desain, dua tingkat kepadatan. Halaman staf boleh padat (tabel 14 px, baris 52–56 px). Halaman siswa/orang tua lebih lapang (16 px, kartu, satu aksi utama per layar).

---

## 2. Audit desain lama

### 2.1 Yang harus dipertahankan

- **Teal sekolah** sebagai warna identitas. Ini sudah benar secara arah.
- **Halaman Data Jurnal** — halaman paling matang: filter lengkap, pagination, thumbnail, status verifikasi. Jadikan acuan pola tabel.
- **Template surat** — Times New Roman, kop dan footer resmi, bahasa baku. Substansinya sudah layak; tinggal nomor surat dan akses.
- **Kosakata status** (`Diproses`, `Diterima`) — sudah dipahami pengguna. Pertahankan, lengkapi.
- **Sidebar** — ide navigasi kiri sudah tepat; eksekusinya yang perlu dirapikan.

### 2.2 Temuan yang harus diperbaiki

| # | Temuan | Bukti | Dampak | Keputusan |
|---|---|---|---|---|
| 1 | **Empat sistem desain bercampur** | SB Admin 2/Bootstrap 4 di dashboard, Bootstrap 5 CDN di 14 halaman, Tailwind CDN di form jurnal, CSS custom di login | Terasa pindah aplikasi saat klik menu; maintenance 4× | Satu sistem: Tailwind + shadcn/ui |
| 2 | **Tidak ada layout induk** | 0 `@extends`/`@include`; 6.418 baris Blade; 46 view | Ganti satu menu = edit ±20 file | Satu `AppShell` di `layout.tsx` |
| 3 | **Navigasi buntu** | Halaman CRUD hanya punya tombol "Kembali", tanpa sidebar/breadcrumb | Pengguna tersesat; back browser jadi jalan keluar | Shell hadir di semua halaman |
| 4 | **Tabel kepotong** | Di 1000 px, tabel 1000 px di dalam kontainer 822 px; kolom Status/Aksi tidak terlihat | Aksi utama tidak ditemukan | Tabel responsif + kartu di HP |
| 5 | **Kontras gagal** | `#1D9A96` di putih = 3,43:1; Lighthouse aksesibilitas 82 | Sulit dibaca, terutama di luar ruangan | Teal 700 untuk teks/tombol; brand hanya aksen |
| 6 | **Tiga font** | Poppins (login), Nunito (dashboard), system font (CRUD) | Tidak terasa satu produk | Sora + Plus Jakarta Sans |
| 7 | **Sisa template** | "Search for…", `index.html`, "Kelas 0", avatar unDraw | Terlihat belum selesai | Hapus semua placeholder |
| 8 | **Copy tidak profesional** | "Admin Ganteng Favorit Kalian😝", "Pencet Nih👇", "Lupa Password?" dummy | Menurunkan kepercayaan orang tua & perusahaan | Voice baru, semua tombol berfungsi |
| 9 | **Aset berat** | `a.jpg` 30 MB dipakai sebagai background login, tersimpan 3×; 5.429 gambar; 88 MB aset template | Login lambat, hosting membengkak | `next/image`, kompresi upload, hapus duplikat |
| 10 | **Model data belum sesuai alur** | Role hanya `admin/guru/siswa`; mutaba'ah hanya link Google Form | Instruktur & orang tua tidak bisa masuk; mutaba'ah tidak termonitor | Tambah role + tabel mutaba'ah |

### 2.3 Skor desain lama

| Aspek | Skor | Catatan |
|---|---|---|
| Kelengkapan fitur | 7/10 | Alur inti sudah digital |
| Desain visual | 5/10 | Login lumayan; CRUD tertinggal |
| Konsistensi | 3/10 | Empat sistem bercampur |
| Navigasi/UX | 4/10 | Shell hilang di banyak halaman |
| Mobile | 4/10 | Tabel lebar, form besar |
| Aksesibilitas | 5/10 | Kontras & label form |
| Performa | 4/10 | Aset 30 MB, CDN |
| Maintainability | 2/10 | HTML disalin 46× |
| **Total** | **4,5/10** | Berfungsi, tetapi terasa seperti empat aplikasi |

---

## 3. Konsep: **Buku Kerja**

Web PKL ini bukan dashboard SaaS generik. Ini **buku kerja industri** seorang siswa: ada jurnal, surat, cap verifikasi, tanda tangan, dan arsip.

Metafora itu menentukan semua keputusan:

- **Kanvas seperti kertas** — latar `#F5F8F7`, bukan putih menyilaukan.
- **Sisi kiri seperti punggung buku** — sidebar teal gelap, tenang, bukan teal terang.
- **Garis tipis seperti garis buku** — hairline 1 px, bukan shadow tebal.
- **Cap dan tanda tangan** — momen verifikasi terasa resmi, bukan sekadar klik "Approve".
- **Angka tabular** — NIS, nomor surat, tanggal, jam sejajar rapi.

Tiga kata yang harus terasa: **tenang, presisi, manusiawi.**

Yang **bukan** arah desain ini:

- bukan startup dengan gradient ungu/biru;
- bukan template SB Admin dengan ilustrasi stok;
- bukan aplikasi anak-anak dengan emoji dan confetti;
- bukan koran sekolah dengan dekorasi berlebihan.

---

## 4. Delapan prinsip desain

### 1. Tenang dulu, warna belakangan
90–95% layar netral. Teal hanya untuk aksi, status aktif, dan identitas. Warna tidak dipakai untuk menghias.

- **Lakukan:** teal pada tombol utama, ikon aktif, satu garis aksen.
- **Jangan:** teal pada seluruh sidebar terang, semua card, semua badge.

### 2. Satu sistem, satu bahasa
Satu shell, satu set tombol, satu radius, satu skala tipografi. Tidak ada halaman yang "dikerjakan sendiri".

- **Lakukan:** komponen dari `DESIGN_SYSTEM.md`.
- **Jangan:** membuat tombol baru karena "biar beda".

### 3. Tugas utama di atas lipatan
Setiap halaman menjawab: "Apa yang harus saya lakukan sekarang?" Bukan "Apa saja data yang ada?"

- Dashboard admin: antrean persetujuan, jurnal belum diverifikasi, siswa belum dapat tempat.
- Dashboard siswa: jurnal hari ini, status surat, mutaba'ah.
- **Jangan:** empat angka statistik lalu ruang kosong.

### 4. Status harus jujur
Pengguna tidak boleh menebak. Setiap status punya label, warna, dan langkah berikutnya.

- Contoh: `Surat pengajuan terbit — menunggu balasan perusahaan`.
- **Jangan:** warna saja tanpa teks; badge "Aktif" tanpa konteks.

### 5. Terbaca di HP, di bawah matahari
Siswa memakai HP di tempat PKL. Kontras minimal 4,5:1 untuk teks, 16 px untuk isi, target sentuh 44 px.

- **Jangan:** teks abu 12 px, tombol 32 px, tabel 10 kolom di HP.

### 6. Gerak menjelaskan, bukan menghibur
Animasi hanya untuk: halaman masuk, status berubah, panel terbuka, angka selesai dihitung. Tidak ada animasi yang berjalan terus atau mengikuti scroll.

### 7. Ramah kertas
Surat dan sertifikat adalah output resmi. Pratinjau di layar harus terasa seperti kertas A4, dan hasil cetak harus sama.

### 8. Aksesibel sejak awal
Label terlihat, fokus terlihat, error di bawah field, `prefers-reduced-motion` dihormati. Bukan tambalan di akhir.

---

## 5. Art direction

### 5.1 Proporsi warna

| Porsi | Warna | Pemakaian |
|---|---|---|
| **60%** | Netral terang `#F5F8F7`, putih `#FFFFFF` | Latar halaman, card, tabel |
| **30%** | Teal gelap `#0B2F2D`–`#126662` | Sidebar, header tabel, teks judul, tombol |
| **8%** | Teal brand `#1D9A96` | Aksen, ikon aktif, focus ring, grafik |
| **2%** | Gold `#D1AE6C` / maroon `#820101` | Garis aksen, cap, elemen resmi |

Aturan: **satu aksen per layar.** Kalau tombol utama teal, jangan tambah gold di sebelahnya sebagai tombol kedua.

### 5.2 Permukaan

- Latar halaman: `#F5F8F7` (kertas sejuk, bukan putih).
- Card: putih, border 1 px `#DCE7E4`, shadow sangat tipis.
- Tidak ada gradient, glassmorphism, noise, atau tekstur kertas.
- Sudut: 8 px (kontrol), 12 px (card), 16 px (modal). Konsisten.

### 5.3 Logo dan gambar

- Logo resmi dari sekolah; jangan digambar ulang, jangan diwarnai ulang.
- Clear space minimal setinggi huruf "S" pada logo.
- Foto asli kampus/bengkel/lab boleh dipakai **hanya dengan izin** dan sudah dikompres. Jangan pakai stok foto.
- Empty state memakai ikon garis, bukan ilustrasi unDraw.
- Foto jurnal siswa adalah data privat — jangan tampil di halaman publik.

### 5.4 Ikon

- Lucide, stroke 1,75, ukuran 16/20/24.
- Ikon selalu berpasangan dengan teks untuk aksi penting.
- Ikon status memakai bentuk berbeda, bukan hanya warna (centang, jam, silang).

### 5.5 Suara

**Voice card:**

```
Register: tenang-institusional, sedikit hangat
Sapaan: "Anda" untuk semua role
Kalimat: 8–16 kata; satu kalimat panjang hanya untuk penjelasan
Humor: tidak ada di dalam sistem
Emoji: tidak ada
Istilah: pakai istilah sekolah yang sudah dipakai guru
  - "Jurnal Harian", bukan "Daily Activity"
  - "Penempatan PKL", bukan "Data PKL"
  - "Tempat PKL", untuk sisi siswa
  - "Verifikasi", bukan "Approve"
Tombol: kata kerja + objek
  - "Simpan jurnal", "Ajukan tempat PKL", "Setujui surat", "Unduh surat"
Error: sebutkan apa yang salah dan cara memperbaikinya
Empty: sebutkan langkah berikutnya, bukan "Tidak ada data"
```

Contoh microcopy:

| Konteks | Jangan | Pakai |
|---|---|---|
| Tombol simpan | Submit | Simpan jurnal |
| Status | Approve | Setujui surat |
| Empty jurnal | Tidak ada data | Belum ada jurnal hari ini. Isi jurnal sebelum pukul 23.59. |
| Upload gagal | Error! | Foto melebihi 5 MB. Kompres atau pilih foto lain. |
| Sukses | Berhasil! | Jurnal tersimpan. Menunggu verifikasi pembimbing. |
| Lupa password | "Calling admin ganteng" | "Hubungi admin sekolah untuk mengatur ulang kata sandi." |

Kata yang dilarang di UI: *seamless, elevate, unleash, empower, revolution, supercharge, solusi terbaik, platform terdepan.*

---

## 6. Tipografi

### 6.1 Dua keluarga

| Peran | Font | Alasan |
|---|---|---|
| **Display** | **Sora** 600/700 | Presisi, sedikit teknis, cocok untuk SMK-IT; dipakai untuk judul halaman, angka besar, dan judul login |
| **UI/isi** | **Plus Jakarta Sans** 400/500/600 | Buatan Indonesia, ramah, sangat terbaca di layar kecil; dipakai untuk semua isi, tabel, form, tombol |

Tidak memakai Poppins/Nunito lagi. Dua font cukup; jangan tambah font ketiga.

### 6.2 Aturan

- Isi minimal **16 px**, line-height 1,55.
- Meta/label minimal **13 px**; caption 12 px hanya untuk timestamp.
- Judul halaman 32 px; judul card 20 px; angka statistik 40 px.
- Sentence case. Tidak ada ALL CAPS kecuali label 11 px dengan tracking (hindari).
- Angka NIS, nomor surat, tanggal memakai `font-variant-numeric: tabular-nums`.
- Panjang baris maksimal **68 karakter**.
- Jangan mengecilkan teks untuk memuat konten; potong atau pindahkan.

Detail skala ada di `DESIGN_SYSTEM.md` §3.

---

## 7. Gerak

### 7.1 Tiga lapis gerak

1. **Masuk halaman** — sekali per navigasi: fade 0→1 + naik 8 px, 180 ms.
2. **Perubahan status** — badge berganti, cap muncul, progress ring terisi.
3. **Umpan balik** — hover, tekan, fokus, unggah, toast.

Tidak ada lapis keempat. Tidak ada animasi saat scroll.

### 7.2 Token gerak

| Token | Durasi | Dipakai untuk |
|---|---|---|
| `--m-press` | 90 ms | Tombol ditekan (scale 0,985) |
| `--m-fast` | 120 ms | Hover keluar, tutup panel |
| `--m-check` | 160 ms | Centang checkbox/verifikasi |
| `--m-base` | 180 ms | Hover masuk, masuk halaman, toast |
| `--m-panel` | 200 ms | Modal, dropdown |
| `--m-slide` | 240 ms | Indicator sidebar, drawer |
| `--m-stamp` | 260 ms | Cap verifikasi |
| `--m-upload` | 300 ms | Centang unggah |
| `--m-timeline` | 320 ms | Garis waktu surat |
| `--m-progress` | 600 ms | Progress ring mutaba'ah |
| `--m-count` | 900 ms | Angka dashboard menghitung sekali |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Semua gerak UI |
| `--ease-enter` | `cubic-bezier(.22,1,.36,1)` | Masuk halaman/modal |

Hanya `transform`, `opacity`, dan warna yang dianimasikan. Jangan animasi `width`, `height`, `top`, `left`, `margin`.

### 7.3 Momen yang dipertahankan

| Momen | Halaman | Kenapa | Detail |
|---|---|---|---|
| **Cap verifikasi** | Verifikasi jurnal | Momen paling bermakna: pekerjaan siswa sah | Cap teal/gold muncul dengan scale 1,12→1, rotasi -6°, opacity, 260 ms, sekali |
| **Garis waktu surat** | Detail surat | Menjelaskan posisi surat tanpa membaca tabel | Garis terisi 320 ms; titik aktif tumbuh sekali, bukan berkedip |
| **Cincin mutaba'ah** | Beranda siswa | Menunjukkan progres mingguan | Ring terisi 600 ms saat pertama dibuka |
| **Angka ringkasan** | Dashboard staf | Angka terasa "hidup" sekali | Count-up 900 ms, hanya sekali per sesi |
| **Indikator sidebar** | Semua halaman | Menjelaskan pindah halaman | Pill aktif meluncur 240 ms |
| **Masuk halaman** | Semua halaman | Orientasi | Fade + 8 px, 180 ms |
| **Unggah berkas** | Form | Menjelaskan proses | Progress nyata (atau spinner) + centang digambar 300 ms |
| **Drawer filter** | HP | Menjelaskan panel | Slide 240 ms |

### 7.4 Yang dilarang

- Card/row yang fade-in saat scroll.
- Parallax, scroll-jacking, smooth-scroll library.
- Animasi berjalan terus (kecuali progress yang memang proses nyata).
- Confetti, bounce, tilt, glow, gradient bergerak.
- Dua animasi besar dalam satu layar.
- Animasi lebih dari 400 ms untuk interaksi UI.
- Animasi yang menutupi teks yang sudah bisa dibaca.

### 7.5 Reduced motion

`@media (prefers-reduced-motion: reduce)`:

- semua transform → none;
- transisi hanya opacity/warna;
- count-up langsung ke angka akhir;
- cap langsung muncul;
- progress ring langsung penuh;
- tidak ada drawer slide (langsung tampil).

### 7.6 Budget performa

- CSS transition untuk hover/focus/tekan.
- `motion/react` hanya untuk: indicator sidebar (`layoutId`), modal/drawer (`AnimatePresence`), count-up, cap verifikasi.
- Tidak memakai library animasi di halaman yang tidak butuh.
- Animasi hanya di client component; data tetap server component.

---

## 8. Arah per halaman

Penjelasan lengkap ada di `LAYOUT.md`. Ringkasnya:

| Halaman | Inti desain | Momen |
|---|---|---|
| **Login** | Dua kolom: panel foto kampus dengan overlay teal + form 400 px. Tanpa marketing berlebihan | Form masuk 12 px, 40 ms bertahap |
| **Dashboard staf** | Antrean tugas di atas, statistik di bawah | Angka count-up sekali |
| **Dashboard siswa** | Kartu status surat + jurnal hari ini + cincin mutaba'ah | Ring terisi |
| **Daftar/table** | Header + filter + tabel + pagination; di HP menjadi kartu | Baris hover, drawer filter |
| **Detail siswa** | 8/4: konten + panel status/timeline | Timeline surat |
| **Form jurnal** | Satu kolom 680 px, foto dropzone, sticky save di HP | Upload progress |
| **Verifikasi** | Split view: antrean kiri, detail kanan | Cap verifikasi |
| **Tugas** | Daftar tugas + deadline + status; siswa bisa tandai selesai | Check draw saat selesai |
| **Mutaba'ah admin** | Halaman sendiri: riwayat + filter tanggal + form builder + rekap | Tab indicator |
| **Surat** | Daftar + pratinjau A4 + unduh/cetak | Timeline status |
| **Mutaba'ah** | Checklist harian + ring mingguan | Check draw, ring |

---

## 9. Aksesibilitas & kenyamanan

- **Kontras:** teks isi ≥ 7:1; teks sekunder ≥ 4,5:1; elemen UI ≥ 3:1. Teal brand 3,43:1 hanya untuk aksen/focus, bukan teks normal.
- **Target sentuh:** minimal 44×44 px; jarak antar target minimal 8 px.
- **Fokus:** ring 2 px `#1D9A96` + offset 2 px, selalu terlihat, tidak dianimasikan.
- **Label:** setiap field punya `<label>` terlihat; placeholder bukan label.
- **Error:** di bawah field, `aria-invalid`, `aria-describedby`, fokus pindah ke field pertama yang salah.
- **Status:** selalu teks + ikon, bukan warna saja.
- **Tabel:** header sticky, caption, `scope="col"`, bisa dioperasikan keyboard.
- **Motion:** hormati `prefers-reduced-motion`.
- **Cetak:** hitam-putih tetap terbaca; kop tidak menutupi teks.
- **Bahasa:** `lang="id"`; istilah konsisten.
- **Performa:** LCP < 2,5 s di 4G; tidak ada layout shift; gambar `next/image`.

---

## 10. Checklist penerimaan desain

- [ ] Semua halaman memakai satu `AppShell`; tidak ada sidebar/topbar yang disalin.
- [ ] Hanya token dari `DESIGN_SYSTEM.md`; tidak ada hex baru di komponen.
- [ ] Tidak ada teks < 13 px; isi 16 px.
- [ ] Teal brand tidak dipakai untuk teks normal di atas putih.
- [ ] Setiap status punya label + ikon.
- [ ] Tabel bisa dipakai di 390 px (menjadi kartu atau scroll dengan kolom pertama sticky).
- [ ] Form bisa diselesaikan dengan keyboard.
- [ ] `prefers-reduced-motion` tidak menyembunyikan konten.
- [ ] Surat A4 tercetak sesuai pratinjau.
- [ ] Tidak ada "Search for…", "Kelas 0", `index.html`, avatar template.
- [ ] Tidak ada kata slop atau emoji di UI.
- [ ] Lighthouse aksesibilitas ≥ 95.
- [ ] Diuji di 390, 768, 1024, 1440 px.
- [ ] Saat halaman pertama dibangun: jalankan `gate.mjs` dari skill `design-taste-frontend`.

---

## 11. Yang sengaja tidak dikerjakan di v1

- **PWA/offline** — berguna nanti untuk siswa dengan sinyal lemah; bukan prioritas pertama.
- **Ilustrasi custom** — ikon garis + konten nyata lebih jujur.
- **Grafik dashboard kompleks** — satu bar chart dan satu progress cukup.
- **Animasi di semua tempat** — gerak yang banyak justru melelahkan.
- **Multi-sekolah (tenant)** — struktur disiapkan, fitur ditunda.

---

## 12. Hubungan dengan dokumen lain

- [`PRD.md`](./PRD.md) — fitur, role, status, acceptance criteria.
- [`ERD.dbml`](./ERD.dbml) — tabel, kolom, enum, relasi.
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — token warna, tipografi, spacing, komponen, motion, aksesibilitas, print.
- [`LAYOUT.md`](./LAYOUT.md) — shell, navigasi per role, wireframe halaman, responsif, implementasi Next.js.
- [`ANIMATION.md`](./ANIMATION.md) — spesifikasi gerak, durasi, momen, dan implementasi `motion`.
- [`TECH_STACK.md`](./TECH_STACK.md) — pustaka yang dipakai dan yang tidak dipakai.
- [`AGENTS.md`](./AGENTS.md) — aturan kerja agent.

Kalau ada keputusan desain baru, ubah `DESIGN.md` dulu (alasan), lalu token di `DESIGN_SYSTEM.md`, lalu layout di `LAYOUT.md`, lalu gerak di `ANIMATION.md`. Jangan sebaliknya.
