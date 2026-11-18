-- ============================================================================
--  Web PKL — Storage buckets & policies
--  Path convention:
--    sekolah/{logo|kop|footer}.png
--    surat/{pengajuan_id}/{jenis}-{uuid}.pdf
--    dokumen/{pengajuan_id}/{jenis}-{uuid}.{ext}
--    jurnal/{siswa_id}/{tanggal}-{uuid}.jpg
--    tugas/{tugas_id}/{siswa_id}/{uuid}.{ext}
--    sertifikat/{siswa_id}/{uuid}.pdf
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('sekolah', 'sekolah', true),
  ('surat', 'surat', false),
  ('dokumen', 'dokumen', false),
  ('jurnal', 'jurnal', false),
  ('tugas', 'tugas', false),
  ('sertifikat', 'sertifikat', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
--  Sekolah (logo, kop, footer) — public read, admin write
-- ---------------------------------------------------------------------------

drop policy if exists storage_sekolah_read on storage.objects;
create policy storage_sekolah_read on storage.objects
  for select to public
  using (bucket_id = 'sekolah');

drop policy if exists storage_sekolah_admin_write on storage.objects;
create policy storage_sekolah_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'sekolah' and public.is_admin())
  with check (bucket_id = 'sekolah' and public.is_admin());

-- ---------------------------------------------------------------------------
--  Surat — hanya yang boleh melihat pengajuan
-- ---------------------------------------------------------------------------

drop policy if exists storage_surat_read on storage.objects;
create policy storage_surat_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'surat'
    and public.can_view_pengajuan(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_surat_admin_write on storage.objects;
create policy storage_surat_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'surat' and public.is_admin())
  with check (bucket_id = 'surat' and public.is_admin());

-- ---------------------------------------------------------------------------
--  Dokumen — siswa anggota pengajuan boleh upload; admin verifikasi
-- ---------------------------------------------------------------------------

drop policy if exists storage_dokumen_read on storage.objects;
create policy storage_dokumen_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dokumen'
    and public.can_view_pengajuan(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_dokumen_insert on storage.objects;
create policy storage_dokumen_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dokumen'
    and public.is_pengajuan_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_dokumen_update on storage.objects;
create policy storage_dokumen_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'dokumen'
    and public.is_pengajuan_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'dokumen'
    and public.is_pengajuan_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_dokumen_delete on storage.objects;
create policy storage_dokumen_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dokumen'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
--  Jurnal — siswa pemilik; guru/instruktur/ortu read-only
-- ---------------------------------------------------------------------------

drop policy if exists storage_jurnal_read on storage.objects;
create policy storage_jurnal_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'jurnal'
    and public.can_view_siswa(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_jurnal_insert on storage.objects;
create policy storage_jurnal_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'jurnal'
    and ((storage.foldername(name))[1])::uuid = public.current_siswa_id()
  );

drop policy if exists storage_jurnal_update on storage.objects;
create policy storage_jurnal_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'jurnal'
    and ((storage.foldername(name))[1])::uuid = public.current_siswa_id()
  )
  with check (
    bucket_id = 'jurnal'
    and ((storage.foldername(name))[1])::uuid = public.current_siswa_id()
  );

drop policy if exists storage_jurnal_delete on storage.objects;
create policy storage_jurnal_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'jurnal'
    and (
      ((storage.foldername(name))[1])::uuid = public.current_siswa_id()
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
--  Tugas — siswa pemilik; guru read-only
-- ---------------------------------------------------------------------------

drop policy if exists storage_tugas_read on storage.objects;
create policy storage_tugas_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tugas'
    and public.can_view_siswa(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists storage_tugas_insert on storage.objects;
create policy storage_tugas_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tugas'
    and ((storage.foldername(name))[2])::uuid = public.current_siswa_id()
    and exists (
      select 1 from public.tugas_siswa ts
      where ts.tugas_id = ((storage.foldername(name))[1])::uuid
        and ts.siswa_id = public.current_siswa_id()
    )
  );

drop policy if exists storage_tugas_update on storage.objects;
create policy storage_tugas_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tugas'
    and ((storage.foldername(name))[2])::uuid = public.current_siswa_id()
  )
  with check (
    bucket_id = 'tugas'
    and ((storage.foldername(name))[2])::uuid = public.current_siswa_id()
    and exists (
      select 1 from public.tugas_siswa ts
      where ts.tugas_id = ((storage.foldername(name))[1])::uuid
        and ts.siswa_id = public.current_siswa_id()
    )
  );

drop policy if exists storage_tugas_delete on storage.objects;
create policy storage_tugas_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tugas'
    and (
      ((storage.foldername(name))[2])::uuid = public.current_siswa_id()
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
--  Sertifikat — read-only untuk yang berhak; tulis admin
-- ---------------------------------------------------------------------------

drop policy if exists storage_sertifikat_read on storage.objects;
create policy storage_sertifikat_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sertifikat'
    and public.can_view_siswa(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists storage_sertifikat_admin_write on storage.objects;
create policy storage_sertifikat_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'sertifikat' and public.is_admin())
  with check (bucket_id = 'sertifikat' and public.is_admin());
