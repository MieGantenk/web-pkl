# PRD.md — Sistem Informasi PKL SMK-IT As-Syifa

> Dokumen produk: **apa yang dibangun, untuk siapa, dan kapan dianggap selesai.**
> Data & relasi: [`ERD.dbml`](./ERD.dbml) · UI: [`DESIGN.md`](./DESIGN.md), [`LAYOUT.md`](./LAYOUT.md) · Gerak: [`ANIMATION.md`](./ANIMATION.md) · Stack: [`TECH_STACK.md`](./TECH_STACK.md) · Aturan agent: [`AGENTS.md`](./AGENTS.md)

Versi 1.0 · 16 November 2026
Status: draft untuk direview

---

## 1. Ringkasan

Sistem Informasi PKL menggantikan aplikasi Laravel lama dan proses manual (Google Form, WhatsApp, kertas) dengan satu aplikasi web untuk:

- siswa mengajukan tempat PKL,
- sekolah menerbitkan surat,
- perusahaan menerima & memverifikasi,
- guru memantau jurnal,
- orang tua melihat perkembangan anak.

Satu aplikasi, lima role, satu alur dari pengajuan sampai penarikan.

---

## 2. Latar belakang & masalah

| Masalah lama | Akibat |
|---|---|
| Surat dibuat manual, nomor sering kosong | Surat tidak konsisten, sulit diarsipkan |
| Izin orang tua via kertas/WhatsApp | File hilang, status tidak jelas |
| Jurnal via Google Form / kertas | Tidak bisa diverifikasi 2 langkah, rekap sulit |
| Mutaba'ah via Google Form | Tidak masuk database, tidak bisa dipantau |
| Role hanya admin/guru/siswa | Instruktur & orang tua tidak punya akses |
| Dashboard hanya angka | Tidak menunjukkan pekerjaan yang harus dilakukan |
| Tampilan 4 sistem bercampur | Pengguna tersesat, maintenance mahal |

---

## 3. Tujuan & metrik

### Tujuan

1. Satu alur digital dari pengajuan sampai selesai.
2. Surat terbit dengan nomor, kop, dan akreditasi yang benar.
3. Jurnal terverifikasi dua langkah: guru lalu instruktur.
4. Mutaba'ah masuk database dan bisa dipantau orang tua.
5. Orang tua & instruktur punya akses terbatas sesuai peran.
6. Tampilan konsisten, mobile-first, dan enak dilihat.

### Metrik keberhasilan

| Metrik | Target |
|---|---|
| Waktu siswa mengisi jurnal | < 2 menit di HP |
| Waktu admin menyetujui surat balasan | < 1 menit per siswa |
| Jurnal tanpa foto | 0% |
| Surat tanpa nomor | 0% |
| Siswa yang bisa menyelesaikan alur tanpa bantuan admin | ≥ 90% |
| Lighthouse aksesibilitas | ≥ 95 |
| LCP di 4G | < 2,5 detik |
| Error akses data antar-role | 0 |

---

## 4. Pengguna & role

| Role | Deskripsi | Login | Akses utama |
|---|---|---|---|
| **Admin** | Tata usaha / admin PKL | Ya | Semua data, persetujuan, surat, pengaturan |
| **Guru** | Guru pembimbing | Ya | Siswa bimbingan, verifikasi jurnal langkah 1, tugas |
| **Siswa** | Peserta PKL | Ya | Pengajuan, jurnal, mutaba'ah, surat, profil |
| **Instruktur** | Pembimbing perusahaan | Ya | Siswa di perusahaannya, verifikasi jurnal langkah 2, penilaian |
| **Orang tua** | Orang tua/wali | Ya | Data anak, jurnal, mutaba'ah, surat |

Aturan:

- Satu akun = satu role.
- Role disimpan di `pengguna.peran`, bukan `user_metadata`.
- Akun instruktur & orang tua dibuat/diundang admin.
- Akun nonaktif tidak bisa login.

---

## 5. Ruang lingkup

### Termasuk MVP

- Auth + 5 role + RLS.
- Master data: siswa (periode PKL mengikuti kelas), guru, jurusan, perusahaan, instruktur, orang tua.
- Pengajuan PKL + kelompok.
- Surat izin orang tua (terbit, unduh, upload TTD).
- Surat pengajuan ke perusahaan.
- Unggah surat balasan perusahaan + persetujuan admin.
- Surat keberangkatan + surat tugas monitoring.
- Jurnal harian + foto + verifikasi 2 langkah.
- Mutaba'ah yaumiyah (form builder, checklist harian, riwayat, rekap).
- Tugas sekolah dari guru (sederhana).
- Surat penarikan + status selesai.
- Dashboard per role.
- Pengaturan sekolah: kop, footer, akreditasi, kepala sekolah, format nomor surat.
- Penomoran surat otomatis.
- Notifikasi in-app.
- Audit log.
- PDF surat + cetak.

### Ditunda (bukan MVP)

- Email otomatis (Resend) & WhatsApp (Fonnte/Wablas).
- Tanda tangan digital di layar (`signature_pad`).
- Sertifikat PDF + QR (v1.1).
- Penilaian akhir (v1.1; skema sudah disiapkan).
- PWA/offline.
- Multi-sekolah (tenant).
- Import data lama sebagai fitur UI (migrasi dilakukan lewat script).
- Export Excel/Word (v1.1).

---

## 6. Alur utama

### Tahap 1 — Persiapan & pengajuan tempat

| # | Aktor | Aksi | Status setelahnya |
|---|---|---|---|
| 1 | Siswa | Buat pengajuan: perusahaan, periode, anggota kelompok | `draft` |
| 2 | Siswa | Kirim pengajuan | `diajukan` |
| 3 | Sistem | Terbitkan surat izin orang tua (PDF) | `izin_ortu_terbit` |
| 4 | Siswa | Unduh, cetak, minta TTD orang tua, upload scan | `izin_ortu_diunggah` |
| 5 | Admin | Verifikasi scan izin orang tua | — |
| 6 | Sistem | Terbitkan surat pengajuan ke perusahaan | `pengajuan_terbit` |
| 7 | Siswa | Serahkan surat ke perusahaan | — |
| 8 | Siswa | Upload surat balasan perusahaan | `balasan_diunggah` |
| 9 | Admin | Tinjau & setujui surat balasan | `diterima` / `ditolak` |

Aturan:

- Surat izin orang tua terbit otomatis setelah dikirim (template + nomor).
- Jika scan izin ditolak admin, dokumen berstatus `revisi`; status pengajuan kembali `izin_ortu_terbit`; siswa upload ulang.
- Jika perusahaan menolak, status pengajuan `ditolak` + alasan; siswa bisa ajukan ulang (pengajuan baru).
- Jika file surat balasan tidak valid, dokumen berstatus `revisi`; status pengajuan kembali `pengajuan_terbit`; siswa upload ulang.
- Satu siswa hanya boleh punya satu pengajuan aktif.

### Tahap 2 — Persetujuan & keberangkatan

| # | Aktor | Aksi | Status |
|---|---|---|---|
| 1 | Admin | Terbitkan surat keberangkatan | `keberangkatan_terbit` |
| 2 | Admin | Terbitkan surat tugas monitoring untuk guru | `keberangkatan_terbit` |
| 3 | Admin | Tetapkan guru pembimbing, instruktur, pembimbing lapangan | — |
| 4 | Sistem | Beri akses ke instruktur & orang tua | — |
| 5 | Admin/Sistem | Tandai PKL mulai (atau otomatis pada tanggal mulai) | `berlangsung` |

### Tahap 3 — Pelaksanaan, jurnal, mutaba'ah

| # | Aktor | Aksi | Status |
|---|---|---|---|
| 1 | Siswa | Isi jurnal harian + foto | `menunggu` |
| 2 | Guru | Verifikasi langkah 1 | `terverifikasi_guru` |
| 3 | Instruktur | Verifikasi langkah 2 | `terverifikasi_instruktur` |
| 4 | Guru/Instruktur | Minta revisi + catatan | `revisi` |
| 5 | Siswa | Perbaiki & kirim ulang | `menunggu` |
| 6 | Siswa | Isi mutaba'ah harian (form dinamis) | — |
| 7 | Guru | Beri tugas (maks. 3 aktif/minggu, dengan peringatan) | — |
| 8 | Siswa | Tandai tugas selesai / upload bukti | — |

Aturan:

- Jurnal hanya boleh diedit sebelum diverifikasi.
- Verifikasi harus berurutan: guru dulu, instruktur kemudian.
- Instruktur hanya melihat siswa di perusahaannya.
- Orang tua hanya melihat anaknya.

### Tahap 4 — Penarikan & penyelesaian

| # | Aktor | Aksi | Status |
|---|---|---|---|
| 1 | Admin | Terbitkan surat penarikan | `penarikan_terbit` |
| 2 | Guru/Siswa | Serahkan surat ke perusahaan | — |
| 3 | Admin | Tandai selesai | `selesai` |
| 4 | Sistem | Arsipkan; data menjadi read-only | `selesai` |

---

## 7. Status & state machine

### 7.1 Status pengajuan/PKL

| Kode | Label UI | Tahap | Aksi berikutnya | Badge |
|---|---|---|---|---|
| `draft` | Belum diajukan | 1 | Siswa kirim | Netral |
| `diajukan` | Diajukan | 1 | Sistem terbitkan izin ortu | Info |
| `izin_ortu_terbit` | Izin orang tua terbit | 1 | Siswa upload TTD | Info |
| `izin_ortu_diunggah` | Izin diunggah | 1 | Admin verifikasi | Warning |
| `pengajuan_terbit` | Surat pengajuan terbit | 1 | Siswa serahkan ke perusahaan | Info |
| `balasan_diunggah` | Balasan diunggah | 1 | Admin tinjau | Warning |
| `diterima` | Diterima | 2 | Admin terbitkan keberangkatan | Success |
| `keberangkatan_terbit` | Surat keberangkatan terbit | 2 | PKL mulai | Success |
| `berlangsung` | Berlangsung | 3 | Jurnal & mutaba'ah | Success |
| `penarikan_terbit` | Surat penarikan terbit | 4 | Serahkan & tandai selesai | Info |
| `selesai` | Selesai | 4 | Arsip | Success |
| `ditolak` | Ditolak | — | Ajukan ulang | Danger |
| `dibatalkan` | Dibatalkan | — | — | Netral |

### 7.2 Status dokumen

`menunggu` → `diterima` / `revisi` / `ditolak`.

### 7.3 Status jurnal

`menunggu` → `terverifikasi_guru` → `terverifikasi_instruktur`; atau `revisi` → `menunggu`.

### 7.4 Status tugas

`belum` → `selesai`; `terlambat` jika melewati deadline.

### 7.5 Transisi yang diizinkan

- Hanya admin yang boleh menyetujui surat balasan dan menerbitkan surat.
- Hanya guru yang boleh verifikasi langkah 1.
- Hanya instruktur yang boleh verifikasi langkah 2.
- Siswa tidak boleh mengubah status selain kirim/unggah.
- Setiap perubahan status dicatat di `log_aktivitas`.

---

## 8. Permission matrix

| Modul | Admin | Guru | Siswa | Instruktur | Ortu |
|---|---|---|---|---|---|
| Pengguna & role | F | R | R self | R self | R self |
| Master siswa/guru/jurusan/perusahaan | F | R assigned | — | R assigned | R child |
| Instruktur | F | R assigned | — | R self | — |
| Orang tua | F | — | R self | — | R self |
| Pengajuan PKL | F + setujui | R assigned | C + R own | R assigned | R child |
| Surat | F + issue | R assigned | R own | R assigned | R child |
| Dokumen | F + verify | R assigned | C + R own | R assigned | R child |
| Jurnal | R all | V step 1 | C + R own | V step 2 | R child |
| Tugas | F | C + R | R + kirim | R | R child |
| Mutaba'ah | Kelola form + R all | R assigned | C + R own | R assigned | R child |
| Penilaian | R all | C (guru) | R own | C (instruktur) | R child |
| Sertifikat | F | R | R own | R | R child |
| Pengaturan sekolah | F | — | — | — | — |
| Audit | R | — | — | — | — |
| Notifikasi | R | R | R | R | R |

Keterangan: F = full, C = create/update, R = read, V = verify, self = data sendiri, assigned = siswa bimbingan/perusahaan, child = anak sendiri.

---

## 9. Functional requirements

### 9.1 Auth & akun

| ID | Requirement | Acceptance |
|---|---|---|
| AUTH-01 | Login dengan email atau username + password | Berhasil masuk; redirect sesuai role |
| AUTH-02 | Admin mengundang instruktur & orang tua | Email undangan terkirim; akun aktif setelah set password |
| AUTH-03 | Reset password | Tautan reset berfungsi; password lama tidak berlaku |
| AUTH-04 | Akun nonaktif tidak bisa login | Pesan umum, tidak membocorkan status akun |
| AUTH-05 | Logout | Sesi berakhir; halaman terproteksi tidak bisa dibuka |
| AUTH-06 | Role guard di server | Akses lintas role ditolak 403 |

### 9.2 Master data

| ID | Requirement | Acceptance |
|---|---|---|
| MST-01 | CRUD siswa, guru, jurusan, perusahaan | Validasi unik NIS/NISN/NIP/email; periode PKL ditetapkan dari kelas: XI → 2026/2027, X → 2027/2028 |
| MST-02 | Hubungkan instruktur ke perusahaan | Satu instruktur bisa di beberapa perusahaan |
| MST-03 | Hubungkan orang tua ke siswa | Satu ortu bisa punya beberapa anak |
| MST-04 | Pencarian, filter, pagination server-side | 1.853 jurnal tidak dimuat sekaligus |
| MST-05 | Nonaktifkan user tanpa menghapus data | Riwayat tetap utuh |
| MST-06 | Naik kelas massal | X menjadi XI, XI menjadi XII; konfirmasi global; kelas XII tidak diubah |

### 9.3 Pengajuan & surat

| ID | Requirement | Acceptance |
|---|---|---|
| PJL-01 | Siswa membuat pengajuan + anggota kelompok | Minimal 1 siswa; ketua otomatis |
| PJL-02 | Sistem menerbitkan surat izin orang tua | PDF bernomor, berkop, ada akreditasi |
| PJL-03 | Siswa upload scan izin bertanda tangan | JPG/PDF, maks 5 MB, preview muncul |
| PJL-04 | Admin verifikasi izin | Status berubah; catatan revisi tersimpan |
| PJL-05 | Sistem menerbitkan surat pengajuan | Nomor unik; PDF bisa diunduh |
| PJL-06 | Siswa upload surat balasan perusahaan | File tersimpan privat; status berubah |
| PJL-07 | Admin menyetujui/menolak balasan | Status `diterima`/`ditolak`; alasan wajib saat reject |
| PJL-08 | Timeline status terlihat | Siswa tahu langkah berikutnya |
| PJL-09 | Ajukan ulang setelah ditolak | Pengajuan baru; riwayat lama tetap ada |

### 9.4 Keberangkatan & akses

| ID | Requirement | Acceptance |
|---|---|---|
| BRK-01 | Terbitkan surat keberangkatan | PDF bernomor; hanya setelah `diterima` |
| BRK-02 | Terbitkan surat tugas monitoring | Ditujukan ke guru pembimbing |
| BRK-03 | Tetapkan guru, instruktur, pembimbing | Tersimpan di pengajuan |
| BRK-04 | Beri akses instruktur & ortu | Setelah ditetapkan, mereka bisa melihat data terkait |
| BRK-05 | Tandai PKL berlangsung | Status `berlangsung`; jurnal aktif |

### 9.5 Jurnal harian

| ID | Requirement | Acceptance |
|---|---|---|
| JRN-01 | Satu jurnal per siswa per tanggal | Unique constraint; edit pada hari yang sama |
| JRN-02 | Isi tanggal, waktu, kegiatan, deskripsi, foto | Foto wajib; maks 5 MB |
| JRN-03 | Foto dikompres sebelum upload | Ukuran turun; kualitas masih layak |
| JRN-04 | Edit hanya sebelum verifikasi | Setelah verified, tombol edit hilang |
| JRN-05 | Guru verifikasi langkah 1 | Status `terverifikasi_guru`; catatan tersimpan |
| JRN-06 | Instruktur verifikasi langkah 2 | Hanya bisa setelah guru; status final |
| JRN-07 | Revisi dengan catatan | Siswa bisa perbaiki & kirim ulang |
| JRN-08 | Filter & pencarian jurnal | Per siswa, tanggal, status, guru |
| JRN-09 | Riwayat & rekap | Guru/ortu bisa melihat progres |

### 9.6 Mutaba'ah yaumiyah

| ID | Requirement | Acceptance |
|---|---|---|
| MUT-01 | Admin membuat form mutaba'ah (nama, deskripsi, periode) | Form tersimpan sebagai draft versi 1; hanya satu form aktif per periode |
| MUT-02 | Admin membuat pertanyaan dengan 6 tipe: ya/tidak, pilih satu, pilih banyak, isian singkat, isian angka, essay | Semua tipe tampil dan tervalidasi |
| MUT-03 | Admin mengatur wajib/opsional, urutan, opsi, min/max, satuan | Urutan bisa naik/turun; opsi minimal 2 untuk tipe pilihan |
| MUT-04 | Form yang sudah punya jawaban tidak bisa diubah | Tombol "Buat versi baru"; data lama tetap utuh |
| MUT-05 | Publikasi/arsip form | Draft → aktif → arsip; versi lama tidak mengubah jawaban |
| MUT-06 | Siswa mengisi form harian | Satu entri per hari; bisa diedit hari itu; terkunci setelahnya |
| MUT-07 | Riwayat 7/30 hari + ring mingguan | Progres dan streak terlihat |
| MUT-08 | Admin melihat semua riwayat siswa | Filter tanggal, kelas, siswa, form, kelengkapan |
| MUT-09 | Admin melihat rekap | Tingkat pengisian, distribusi jawaban, rata-rata angka; ekspor v1.1 |
| MUT-10 | Guru & ortu melihat siswa terkait | Hanya siswa bimbingan/anak |
| MUT-11 | Data masuk database | Tidak ada tautan Google Form |
| MUT-12 | Template default | Admin bisa mulai dari template umum (shalat, tilawah, hafalan, olahraga, membantu orang tua) |

### 9.7 Tugas sekolah

| ID | Requirement | Acceptance |
|---|---|---|
| TGS-01 | Guru membuat tugas untuk kelompok | Judul, deskripsi, deadline |
| TGS-02 | Siswa melihat & menandai selesai | Bisa upload bukti |
| TGS-03 | Guru melihat progres | Per siswa / per kelompok |
| TGS-04 | Deadline & status terlambat | Dihitung otomatis |
| TGS-05 | Peringatan porsi tugas | Peringatan jika > 3 tugas aktif/minggu |

### 9.8 Surat & penarikan

| ID | Requirement | Acceptance |
|---|---|---|
| SUR-01 | Nomor surat otomatis per jenis/tahun | Tidak ada nomor ganda |
| SUR-02 | PDF berkop + akreditasi + footer | Akreditasi wajib terisi; A4; sesuai pratinjau |
| SUR-03 | Pratinjau, unduh, cetak | Tombol berfungsi; print rapi |
| SUR-04 | QR verifikasi (opsional) | URL verifikasi valid |
| SUR-05 | Daftar surat + filter | Per siswa, jenis, status |
| PNR-01 | Terbitkan surat penarikan | Hanya setelah `berlangsung` |
| PNR-02 | Tandai selesai | Status `selesai`; data read-only |

### 9.9 Dashboard & notifikasi

| ID | Requirement | Acceptance |
|---|---|---|
| DSH-01 | Admin melihat antrean persetujuan | Jumlah + tautan |
| DSH-02 | Guru melihat antrean verifikasi | Jumlah + tautan |
| DSH-03 | Siswa melihat status + jurnal hari ini | Satu aksi utama |
| DSH-04 | Instruktur melihat antrean verifikasi | Hanya siswa perusahaannya |
| DSH-05 | Ortu melihat ringkasan anak | Jurnal & mutaba'ah terbaru |
| NTF-01 | Notifikasi in-app saat status berubah | Muncul di bell; belum dibaca |
| NTF-02 | Tandai dibaca | Counter berkurang |

### 9.10 Pengaturan & audit

| ID | Requirement | Acceptance |
|---|---|---|
| SET-01 | Profil sekolah + akreditasi | Tersimpan; dipakai di kop |
| SET-02 | Upload logo, kop, footer | Tampil di pratinjau surat |
| SET-03 | Format nomor surat | Perubahan berlaku untuk surat berikutnya |
| SET-04 | Kelola item mutaba'ah | Perubahan tidak merusak data lama |
| AUD-01 | Log aksi penting | Siapa, apa, kapan, entitas |
| AUD-02 | Admin melihat log | Filter pengguna/aksi/tanggal |

---

## 10. Non-functional requirements

### Keamanan

- RLS aktif di semua tabel.
- Role dicek di server, bukan hanya UI.
- Service role key hanya di server.
- Bucket private + signed URL.
- File siswa tidak bisa diakses publik.
- Validasi server untuk semua input.
- Audit log untuk persetujuan, verifikasi, terbit surat, hapus.
- Jangan menampilkan data anak ke orang tua lain.

### Performa

- Server-side pagination; tidak memuat 1.853 baris sekaligus.
- `next/image` + kompresi upload.
- LCP < 2,5 s di 4G.
- CLS < 0,1.
- Tidak ada layout shift saat font dimuat.

### Aksesibilitas

- WCAG AA; kontras 4,5:1 untuk teks.
- Keyboard navigation.
- Label form terlihat.
- Fokus terlihat.
- `prefers-reduced-motion`.
- Lighthouse aksesibilitas ≥ 95.

### Responsif

- 320, 390, 768, 1024, 1440.
- Tidak ada scroll horizontal di 390.
- Tabel menjadi kartu di HP.
- Form satu kolom; tombol simpan sticky.

### Cetak

- A4; Times New Roman 12 pt; kop/footer; margin 20/25 mm.
- Pratinjau = hasil cetak.
- Nomor surat dan tanggal benar.

### Browser

- Chrome/Edge/Safari versi terbaru.
- Android Chrome.
- Tidak mendukung IE.

### Data & operasional

- Backup harian.
- Migrasi data lama dengan script.
- Retensi data minimal 5 tahun (keputusan sekolah).
- Supabase free tier untuk pengembangan; produksi paket berbayar.

---

## 11. UX principles (ringkas)

Mengacu ke `DESIGN.md`:

- Konsep **Buku Kerja**: tenang, presisi, resmi.
- Teal sekolah sebagai identitas; teal gelap untuk aksi.
- Satu AppShell; mobile-first untuk siswa.
- Dashboard = antrean tugas, bukan angka kosong.
- Status selalu jelas + langkah berikutnya.
- Animasi hanya untuk menjelaskan; tanpa scroll reveal.
- Surat terasa seperti kertas resmi.

---

## 12. Definisi selesai (MVP)

- [ ] Alur lengkap dari `draft` sampai `selesai` bisa dilakukan tanpa edit database manual.
- [ ] 5 role bisa login dan hanya melihat data yang diizinkan.
- [ ] RLS diuji: siswa A tidak bisa melihat jurnal siswa B; ortu hanya anaknya.
- [ ] Surat izin, pengajuan, keberangkatan, tugas monitoring, penarikan terbit dengan nomor & kop.
- [ ] Jurnal + foto + verifikasi 2 langkah berfungsi.
- [ ] Mutaba'ah tersimpan di database dan terlihat oleh ortu/guru.
- [ ] Admin bisa membuat form mutaba'ah dengan 6 tipe pertanyaan, mengatur opsi, dan mempublikasikan versi baru.
- [ ] Riwayat mutaba'ah siswa bisa difilter per tanggal, kelas, siswa, dan kelengkapan.
- [ ] Form yang sudah punya jawaban tidak berubah saat admin membuat versi baru.
- [ ] Tugas guru bisa dibuat dan diselesaikan siswa.
- [ ] Dashboard setiap role punya antrean tugas.
- [ ] Tabel 1.853 baris tidak dimuat sekaligus.
- [ ] Tampilan diuji di 390/768/1024/1440.
- [ ] Tidak ada error console; build & typecheck lulus.
- [ ] Lighthouse aksesibilitas ≥ 95.
- [ ] Print surat A4 sesuai pratinjau.

---

## 13. Rencana rilis

| Fase | Isi | Estimasi |
|---|---|---|
| **0. Fondasi** | Next.js, Supabase, auth, role, RLS, AppShell, token | 1–2 minggu |
| **1. MVP** | Master data, pengajuan, surat, jurnal, mutaba'ah, verifikasi, dashboard, penarikan | 6–8 minggu |
| **1.1** | Penilaian, sertifikat, QR, email/WA | 3–4 minggu |
| **2. Lanjutan** | PWA/offline, multi-sekolah, analytics | sesuai kebutuhan |

---

## 14. Keputusan yang sudah final

- 5 role: admin, guru, siswa, instruktur, ortu.
- Satu sekolah (bukan multi-tenant) untuk v1.
- Satu pengajuan aktif per siswa.
- Kelompok diperbolehkan; satu pengajuan punya banyak anggota.
- Surat diterbitkan per pengajuan.
- Verifikasi jurnal 2 langkah, berurutan.
- Mutaba'ah masuk database, memakai form dinamis dengan 6 tipe pertanyaan dan versioning.
- Mutaba'ah punya halaman admin sendiri: riwayat, filter tanggal, dan form builder.
- Tugas guru dibatasi dengan peringatan (bukan hard block).
- Notifikasi in-app di v1; email/WA ditunda.
- Light & dark mode; preferensi pengguna disimpan per perangkat.
- Tanda tangan: scan/tanda tangan basah; digital signature ditunda.
- Sertifikat & penilaian: skema disiapkan, fitur v1.1.

---

## 15. Pertanyaan terbuka

1. Format nomor surat final? (`{nomor}/{kode}/{tahun}`?)
2. Siapa yang menandatangani surat: kepala sekolah, wakil, atau admin?
3. Apakah surat penarikan diserahkan guru atau siswa?
4. Apakah orang tua boleh melihat foto jurnal anak?
5. Apakah instruktur boleh melihat semua siswa di perusahaannya atau hanya yang ditugaskan?
6. Berapa lama data disimpan setelah lulus?
7. Apakah penilaian & sertifikat harus masuk MVP?
8. Apakah perlu import data lama lewat UI atau cukup script migrasi?
9. Apakah notifikasi WhatsApp wajib untuk orang tua?
10. Apakah sekolah butuh tanda tangan digital resmi (e-signature)?
11. Apakah semua kelas memakai form mutaba'ah yang sama, atau berbeda per jurusan/kelas?
12. Apakah pertanyaan essay wajib setiap hari, atau hanya mingguan?
13. Apakah perlu skala 1–5 untuk kualitas ibadah/kebiasaan?
14. Apakah siswa boleh mengedit mutaba'ah setelah pergantian hari (misalnya sampai pukul 24.00)?

---

## 16. Hubungan dengan dokumen lain

| Dokumen | Isi |
|---|---|
| [`ERD.dbml`](./ERD.dbml) | Tabel, enum, relasi |
| [`DESIGN.md`](./DESIGN.md) | Arah desain & audit |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Token & komponen |
| [`LAYOUT.md`](./LAYOUT.md) | Shell & halaman |
| [`ANIMATION.md`](./ANIMATION.md) | Gerak |
| [`TECH_STACK.md`](./TECH_STACK.md) | Pustaka |
| [`AGENTS.md`](./AGENTS.md) | Aturan kerja agent |

Prioritas saat konflik: **PRD (apa) → ERD (data) → TECH_STACK (cara) → DESIGN/LAYOUT (tampilan) → ANIMATION (gerak)**. Jika masih bertentangan, berhenti dan minta keputusan.
