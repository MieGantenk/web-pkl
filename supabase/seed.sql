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
