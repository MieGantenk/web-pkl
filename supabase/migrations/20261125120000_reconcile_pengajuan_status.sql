-- ============================================================================
--  Rapikan status pengajuan lama yang tertinggal dari alur surat.
--
--  Sebelum perbaikan:
--  - unggah surat manual tidak memajukan status pengajuan;
--  - menyetujui izin orang tua langsung menandai surat pengajuan terbit;
--  - surat keberangkatan tidak memulai tahap pelaksanaan.
--
--  Migrasi ini hanya memajukan status jika berkas surat/dokumen benar-benar
--  ada di penyimpanan dan sudah diverifikasi. Tidak ada data yang dihapus.
-- ============================================================================

-- 1. Surat izin orang tua sudah terbit dan berberkas, tetapi status masih
--    "diajukan". Siswa perlu dapat mengunggah scan bertanda tangan.
update public.pengajuan_pkl p
set status = 'izin_ortu_terbit', updated_at = now()
where p.status = 'diajukan'
  and exists (
    select 1
    from public.surat s
    where s.pengajuan_id = p.id
      and s.jenis = 'izin_orang_tua'
      and s.status = 'terbit'
      and s.file_path is not null
  );

-- 2. Surat pengajuan sudah terbit dan berberkas, izin sudah diverifikasi,
--    tetapi status masih "izin_ortu_diunggah".
update public.pengajuan_pkl p
set status = 'pengajuan_terbit', updated_at = now()
where p.status = 'izin_ortu_diunggah'
  and exists (
    select 1
    from public.dokumen d
    where d.pengajuan_id = p.id
      and d.jenis = 'izin_orang_tua_ttd'
      and d.status = 'diterima'
      and d.file_path is not null
  )
  and exists (
    select 1
    from public.surat s
    where s.pengajuan_id = p.id
      and s.jenis = 'pengajuan'
      and s.status = 'terbit'
      and s.file_path is not null
  );

-- 3. Surat pengajuan pernah ditandai terbit tanpa surat/berkas, sementara
--    izin sudah diverifikasi dan balasan belum diunggah. Kembalikan ke status
--    yang memungkinkan admin menerbitkan surat pengajuan yang hilang.
update public.pengajuan_pkl p
set status = 'izin_ortu_diunggah', updated_at = now()
where p.status = 'pengajuan_terbit'
  and not exists (
    select 1
    from public.surat s
    where s.pengajuan_id = p.id
      and s.jenis = 'pengajuan'
      and s.status = 'terbit'
  )
  and exists (
    select 1
    from public.dokumen d
    where d.pengajuan_id = p.id
      and d.jenis = 'izin_orang_tua_ttd'
      and d.status = 'diterima'
      and d.file_path is not null
  )
  and not exists (
    select 1
    from public.dokumen d
    where d.pengajuan_id = p.id
      and d.jenis = 'surat_balasan_perusahaan'
  );

-- 4. Surat keberangkatan sudah terbit dan berberkas, balasan perusahaan sudah
--    disetujui, tetapi status belum masuk tahap pelaksanaan.
update public.pengajuan_pkl p
set status = 'berlangsung', updated_at = now()
where p.status in ('diterima', 'keberangkatan_terbit')
  and exists (
    select 1
    from public.surat s
    where s.pengajuan_id = p.id
      and s.jenis = 'keberangkatan'
      and s.status = 'terbit'
      and s.file_path is not null
  )
  and exists (
    select 1
    from public.dokumen d
    where d.pengajuan_id = p.id
      and d.jenis = 'surat_balasan_perusahaan'
      and d.status = 'diterima'
      and d.file_path is not null
  );
