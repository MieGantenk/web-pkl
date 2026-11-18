-- ============================================================================
--  RLS performance: hindari auth.uid() dievaluasi per baris.
--  https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

alter policy pengguna_update_self on public.pengguna
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy siswa_update_self on public.siswa
  using (pengguna_id = (select auth.uid()))
  with check (pengguna_id = (select auth.uid()));

alter policy dokumen_insert_member on public.dokumen
  with check (
    public.is_pengajuan_member(pengajuan_id)
    and diunggah_oleh = (select auth.uid())
  );

alter policy pengajuan_insert_owner on public.pengajuan_pkl
  with check (
    dibuat_oleh = (select auth.uid())
    and public.current_user_role() = 'siswa'
  );

alter policy pengajuan_update_owner on public.pengajuan_pkl
  using (
    dibuat_oleh = (select auth.uid())
    and status = 'draft'
  )
  with check (dibuat_oleh = (select auth.uid()));

alter policy verifikasi_insert on public.verifikasi_jurnal
  with check (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = (select auth.uid())
    and peran::text = public.current_user_role()::text
  );

alter policy verifikasi_update on public.verifikasi_jurnal
  using (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = (select auth.uid())
  )
  with check (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = (select auth.uid())
  );

alter policy penilaian_insert on public.penilaian
  with check (
    public.can_grade(pengajuan_id)
    and penilai_id = (select auth.uid())
    and peran::text = public.current_user_role()::text
  );

alter policy penilaian_update on public.penilaian
  using (penilai_id = (select auth.uid()))
  with check (penilai_id = (select auth.uid()));

alter policy notifikasi_select on public.notifikasi
  using (
    pengguna_id = (select auth.uid())
    or public.is_admin()
  );

alter policy notifikasi_update_self on public.notifikasi
  using (pengguna_id = (select auth.uid()))
  with check (pengguna_id = (select auth.uid()));
