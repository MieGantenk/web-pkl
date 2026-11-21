-- ============================================================================
--  Seed minimal
--  Jalankan setelah migration.
--  Akreditasi sengaja null: wajib diisi admin sebelum surat diterbitkan.
-- ============================================================================

insert into public.pengaturan_sekolah (
  id,
  nama_sekolah,
  alamat,
  telepon,
  email,
  website,
  kepala_sekolah,
  akreditasi,
  format_nomor_surat
)
values (
  1,
  'SMK-IT As-Syifa Boarding School',
  'KP. Kumpay, Kecamatan Jalancagak, Kabupaten Subang, Jawa Barat',
  '081122223934',
  'smkit@assyifa.sch.id',
  'https://smkit.assyifa.sch.id',
  'H. Agus Nur Purwanto, S.T.',
  null,
  '{nomor}/{kode}/{tahun}'
)
on conflict (id) do nothing;

-- Periode PKL mengikuti tingkat kelas: XI pada 2026/2027, X pada 2027/2028.
insert into public.periode_pkl (
  nama,
  tahun_ajaran,
  tanggal_mulai,
  tanggal_selesai,
  aktif
)
values
  ('PKL Ganjil 2026/2027', '2026/2027', '2026-07-01', '2026-12-31', true),
  ('PKL Ganjil 2027/2028', '2027/2028', '2027-07-01', '2027-12-31', false)
on conflict (tahun_ajaran, nama) do nothing;
