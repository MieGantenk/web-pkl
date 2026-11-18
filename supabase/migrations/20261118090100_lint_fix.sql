-- ============================================================================
--  Lint fixes: search_path + last auth.uid() initplan.
-- ============================================================================

alter function public.set_updated_at() set search_path = public, pg_temp;

alter policy ortu_select on public.orang_tua_siswa
  using (
    public.is_admin()
    or pengguna_id = (select auth.uid())
    or exists (
      select 1 from public.siswa s
      where s.id = siswa_id
        and s.pengguna_id = (select auth.uid())
    )
  );
