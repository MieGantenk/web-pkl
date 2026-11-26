# ROUTES.md — Halaman, Endpoint & Server Actions

> Daftar route aplikasi Web PKL. Sumber: [`PRD.md`](./PRD.md), [`LAYOUT.md`](./LAYOUT.md), [`ERD.dbml`](./ERD.dbml).
> Semua halaman di bawah `(app)` memakai AppShell + role guard.

Versi 1.0 · 17 November 2026

---

## 1. Ringkasan

| Kelompok | MVP | v1.1 |
|---|---:|---:|
| Auth & status | 1 login + 3 halaman status | — |
| Admin | 21 | — |
| Guru | 8 | — |
| Siswa | 8 | — |
| Instruktur | 4 | 1 |
| Orang tua | 5 | — |
| Print | 1 | 1 |
| **Total halaman** | **48** | **2** |

Halaman status: `403`, `404`, `error` (global, tidak dihitung).

---

## 2. Halaman publik & auth

| Route | Halaman | Akses | Status |
|---|---|---|---|
| `/` | Landing/fondasi (sekarang) → redirect `/login` setelah auth siap | Publik | MVP |
| `/login` | Login email/username + password | Publik | MVP |
| `/403` | Tidak punya akses | Auth | MVP |
| `/404` | Tidak ditemukan | Publik | MVP |
| `/error` | Error tak terduga | Publik | MVP |
| `/auth/callback` | Tukar kode Supabase (reset password/OAuth) | Publik | MVP |

---

## 3. Admin — 21 halaman

| Route | Halaman | Isi utama |
|---|---|---|
| `/admin` | Ringkasan | Antrean persetujuan, jurnal belum verifikasi, siswa belum dapat tempat, KPI, grafik |
| `/admin/siswa` | Data siswa | Tabel, filter kelas/periode (periode mengikuti kelas), pagination, tambah, naik kelas, nonaktifkan |
| `/admin/siswa/baru` | Tambah siswa | Form data siswa + akun login + kata sandi |
| `/admin/siswa/[id]` | Detail siswa | Profil, akun, kata sandi, penempatan, jurnal terakhir |
| `/admin/guru` | Data guru | CRUD, jurusan, akun |
| `/admin/perusahaan` | Perusahaan | CRUD DUDI, instruktur |
| `/admin/instruktur` | Instruktur | Akun, perusahaan, peran |
| `/admin/orang-tua` | Orang tua | Akun, relasi ke siswa |
| `/admin/pengajuan` | Pengajuan PKL | Semua pengajuan, tinjau dokumen, setujui/tolak, timeline |
| `/admin/penempatan` | Penempatan | PKL aktif, guru/instruktur, tanggal, mulai |
| `/admin/jurnal` | Jurnal | Monitoring semua jurnal, filter, foto |
| `/admin/verifikasi` | Verifikasi dokumen | Scan izin ortu, surat balasan, revisi |
| `/admin/tugas` | Tugas | Monitoring tugas, progres |
| `/admin/mutabaah` | Mutaba'ah | Riwayat semua siswa, filter tanggal/kelas/kelengkapan, rekap |
| `/admin/mutabaah/pertanyaan` | Form builder | Form, versi, pertanyaan, opsi, publish/arsip |
| `/admin/surat` | Surat sekolah | 7 jenis, terbitkan, nomor, pratinjau, unduh, unggah berkas surat |
| `/admin/surat/kelengkapan` | Kelengkapan surat | Matriks surat per siswa, status terbit/siap/terkunci |
| `/admin/surat/siswa` | Surat dari siswa | Dokumen unggahan siswa, filter, lihat/unduh, tinjau pengajuan |
| `/admin/surat/print/[id]` | Cetak surat | Pratinjau A4, cetak, unduh PDF |
| `/admin/laporan` | Laporan | Rekap periode/perusahaan/kelas, ringkasan, rincian siswa, ekspor CSV |
| `/admin/pengaturan` | Pengaturan | Profil sekolah, akreditasi, kop/footer, nomor surat, item mutaba'ah |
| `/admin/audit` | Audit | Log aksi, filter pengguna/aksi/entitas/tanggal, detail |

> Periode PKL tidak punya halaman sendiri. Periode ditetapkan dari tingkat kelas: XI → 2026/2027, X → 2027/2028. Filter periode tersedia di halaman data siswa dan data orang tua.

---

## 4. Guru — 8 halaman

| Route | Halaman | Isi utama |
|---|---|---|
| `/guru` | Ringkasan | Antrean verifikasi, siswa bimbingan, jurnal terbaru, tugas |
| `/guru/siswa` | Siswa bimbingan | Daftar, progres jurnal, mutaba'ah, penempatan |
| `/guru/verifikasi` | Verifikasi jurnal | Split view, langkah 1, setujui/revisi, cap |
| `/guru/tugas` | Tugas | Buat tugas, deadline, progres, peringatan porsi |
| `/guru/mutabaah` | Mutaba'ah | Read-only siswa bimbingan, filter tanggal |
| `/guru/surat-tugas` | Surat tugas | Lihat/unduh surat tugas monitoring |
| `/guru/penarikan` | Penarikan | Lihat/unduh surat penarikan |
| `/guru/profil` | Profil | Data diri, kontak, kata sandi |

---

## 5. Siswa — 8 halaman

| Route | Halaman | Isi utama |
|---|---|---|
| `/siswa` | Beranda | Status PKL, jurnal hari ini, ring mutaba'ah, tugas, jurnal terakhir |
| `/siswa/pengajuan` | Pengajuan PKL | Buat, anggota, unduh izin, unggah TTD, unggah balasan, timeline |
| `/siswa/jurnal` | Jurnal harian | Daftar, filter, status, detail/foto |
| `/siswa/jurnal/baru` | Jurnal baru | Tanggal, waktu, kegiatan, deskripsi, foto wajib |
| `/siswa/mutabaah` | Mutaba'ah | Form dinamis, checklist, ring, riwayat |
| `/siswa/tugas` | Tugas | Daftar, deadline, tandai selesai, bukti |
| `/siswa/surat` | Surat | Izin, pengajuan, keberangkatan, penarikan; unduh |
| `/siswa/profil` | Profil | Data, kontak, kata sandi |

---

## 6. Instruktur — 4 MVP + 1 v1.1

| Route | Halaman | Status | Isi utama |
|---|---|---|---|
| `/instruktur` | Ringkasan | MVP | Antrean verifikasi langkah 2, siswa perusahaan |
| `/instruktur/siswa` | Siswa PKL | MVP | Daftar siswa, progres jurnal, mutaba'ah |
| `/instruktur/verifikasi` | Verifikasi jurnal | MVP | Langkah 2, catatan revisi, cap |
| `/instruktur/penilaian` | Penilaian | v1.1 | Nilai 0–100, catatan |
| `/instruktur/profil` | Profil | MVP | Data, perusahaan, kata sandi |

---

## 7. Orang tua — 5 halaman

| Route | Halaman | Isi utama |
|---|---|---|
| `/ortu` | Beranda | Ringkasan anak, status, jurnal, mutaba'ah, surat |
| `/ortu/jurnal` | Jurnal anak | Daftar, foto, status verifikasi (read-only) |
| `/ortu/mutabaah` | Mutaba'ah | Riwayat, ring progres |
| `/ortu/surat` | Surat | Surat anak, unduh |
| `/ortu/profil` | Profil | Data, anak terkait, kata sandi |

---

## 8. Print

| Route | Halaman | Status |
|---|---|---|
| `/print/surat/[id]` | Pratinjau & cetak surat A4 | MVP |
| `/print/sertifikat/[id]` | Pratinjau & cetak sertifikat | v1.1 |

---

## 9. Route Handlers (API)

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| `GET` | `/auth/callback` | Publik | Tukar `code` Supabase menjadi sesi |
| `GET` | `/api/health` | Internal | Health check deployment |
| `GET` | `/api/notifikasi` | Auth | Daftar notifikasi dan jumlah belum dibaca |
| `GET` | `/api/admin/laporan/export` | Admin | Unduh CSV rekap PKL sesuai filter |
| `GET` | `/api/surat/[id]/pdf` | Role berhak | Generate/unduh PDF surat (Node runtime) |
| `GET` | `/api/verifikasi/surat/[kode]` | Publik | Halaman verifikasi QR (v1.1) |
| `GET` | `/api/sertifikat/[id]/pdf` | Role berhak | Generate/unduh sertifikat (v1.1) |
| `POST` | `/api/storage/signed-upload` | Auth | Signed upload URL (opsional; kalau upload langsung dari client) |

Catatan:

- Supabase REST (`/rest/v1/...`) **tidak** dipakai langsung oleh client. Semua baca/tulis lewat Server Component, Server Action, atau Route Handler + RLS.
- Semua route `(app)` wajib cek sesi + role di server.
- API mutasi (`POST`/`PUT`/`PATCH`/`DELETE`) wajib memakai `verifyCsrfAndOrigin`; client memakai `fetchWithCsrf`. Detail di `SECURITY.md`. Route `GET` tidak perlu token.
- PDF memakai `@react-pdf/renderer` dan `export const runtime = "nodejs"`.
- Login dengan username: cari email lewat service role di server, lalu `signInWithPassword`. Jangan ekspos email ke client.

---

## 10. Server Actions

Server Actions adalah fungsi `"use server"` di `lib/actions/*`. Tidak punya URL publik; dipanggil dari form/komponen.

| Modul | Action | Role |
|---|---|---|
| Auth | `loginAction`, `logoutAction`, `requestPasswordResetAction`, `setPasswordAction` | Publik/auth |
| Profil | `updateProfileAction`, `changePasswordAction` | Semua |
| Master siswa | `createSiswaAction`, `updateSiswaAction`, `resetSiswaPasswordAction`, `setSiswaAktifAction`, `promoteSiswaKelasAction` | Admin |
| Akun | `resetAccountPasswordAction` (siswa, guru, instruktur, orang tua) | Admin |
| Master guru | `createGuruAction`, `updateGuruAction`, `deactivateGuruAction` | Admin |
| Master perusahaan | `createPerusahaanAction`, `updatePerusahaanAction`, `setPerusahaanAktifAction` | Admin |
| Instruktur | `createInstrukturAction`, `updateInstrukturAction`, `setInstrukturAktifAction`, `savePenugasanAction`, `setPenugasanAktifAction` | Admin |
| Orang tua | `createOrangTuaAction`, `updateOrangTuaAction`, `setOrangTuaAktifAction`, `linkOrangTuaAction`, `updateHubunganOrangTuaAction`, `unlinkOrangTuaAction` | Admin |
| Pengajuan | `createPengajuanAction`, `updatePengajuanDraftAction`, `submitPengajuanAction`, `addAnggotaAction`, `removeAnggotaAction` | Siswa |
| Pengajuan | `verifyDokumenAction`, `approvePengajuanAction`, `rejectPengajuanAction`, `issueSuratAction`, `startPklAction` | Admin |
| Pengajuan | `reviewPengajuanAction` (verifikasi dokumen & keputusan) | Admin |
| Dokumen | `recordDokumenAction` (metadata setelah upload ke Storage) | Siswa |
| Surat | `issueSuratAction`, `downloadSuratAction` | Admin |
| Jurnal | `createJurnalAction`, `updateJurnalAction`, `deleteJurnalAction` | Siswa |
| Verifikasi | `verifyJurnalGuruAction`, `verifyJurnalInstrukturAction`, `requestJurnalRevisiAction` | Guru/instruktur |
| Tugas | `createTugasAction`, `updateTugasAction`, `markTugasSelesaiAction` | Guru/siswa |
| Mutaba'ah | `createFormAction`, `updateFormDraftAction`, `publishFormAction`, `createFormVersionAction`, `archiveFormAction` | Admin |
| Mutaba'ah | `saveMutabaahAction` | Siswa |
| Penilaian | `savePenilaianAction` | Guru/instruktur (v1.1) |
| Penarikan | `issuePenarikanAction`, `markPklSelesaiAction` | Admin |
| Pengaturan | `updateSchoolSettingsAction`, `uploadSchoolAssetAction`, `updateLetterFormatAction` | Admin |
| Notifikasi | `markNotificationReadAction`, `markAllNotificationsReadAction` | Semua |
| Sertifikat | `issueSertifikatAction` | Admin (v1.1) |

Aturan:

- Setiap action memanggil `requireRole()` dan memeriksa kepemilikan data.
- Mutasi kompleks admin memakai `createAdminClient()` setelah cek role.
- Action mengembalikan `{ ok: true }` atau `{ ok: false, message }`; error field-level memakai `fieldErrors`.
- Jangan menaruh logika database di komponen presentasional.

---

## 11. Route yang tidak dibuat

- Tidak ada REST API publik untuk CRUD.
- Tidak ada endpoint upload publik.
- Tidak ada endpoint yang mengembalikan service role key.
- Tidak ada halaman `/admin/dashboard` terpisah; ringkasan ada di `/admin`.
- Tidak ada halaman `Daily Activity`; gunakan `/siswa/jurnal`.
- Tidak ada halaman `Data PKL`; gunakan `/admin/penempatan` atau `/admin/pengajuan`.
