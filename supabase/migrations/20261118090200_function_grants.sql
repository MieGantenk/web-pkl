-- ============================================================================
--  Function grants: jangan biarkan anon memanggil helper/trigger functions.
--  Helper RLS tetap executable untuk authenticated karena dipakai policy.
-- ============================================================================

revoke all on function public.current_user_role() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.current_siswa_id() from public, anon, authenticated;
revoke all on function public.current_guru_id() from public, anon, authenticated;
revoke all on function public.can_view_siswa(uuid) from public, anon, authenticated;
revoke all on function public.can_view_pengajuan(uuid) from public, anon, authenticated;
revoke all on function public.is_pengajuan_member(uuid) from public, anon, authenticated;
revoke all on function public.is_pengajuan_owner(uuid) from public, anon, authenticated;
revoke all on function public.is_siswa_in_pengajuan(uuid, uuid) from public, anon, authenticated;
revoke all on function public.can_verify_jurnal(uuid) from public, anon, authenticated;
revoke all on function public.can_manage_tugas(uuid) from public, anon, authenticated;
revoke all on function public.can_grade(uuid) from public, anon, authenticated;
revoke all on function public.can_view_jurnal(uuid) from public, anon, authenticated;
revoke all on function public.can_view_mutabaah(uuid) from public, anon, authenticated;
revoke all on function public.can_view_jawaban(uuid) from public, anon, authenticated;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_siswa_id() to authenticated;
grant execute on function public.current_guru_id() to authenticated;
grant execute on function public.can_view_siswa(uuid) to authenticated;
grant execute on function public.can_view_pengajuan(uuid) to authenticated;
grant execute on function public.is_pengajuan_member(uuid) to authenticated;
grant execute on function public.is_pengajuan_owner(uuid) to authenticated;
grant execute on function public.is_siswa_in_pengajuan(uuid, uuid) to authenticated;
grant execute on function public.can_verify_jurnal(uuid) to authenticated;
grant execute on function public.can_manage_tugas(uuid) to authenticated;
grant execute on function public.can_grade(uuid) to authenticated;
grant execute on function public.can_view_jurnal(uuid) to authenticated;
grant execute on function public.can_view_mutabaah(uuid) to authenticated;
grant execute on function public.can_view_jawaban(uuid) to authenticated;

revoke all on function public.enforce_one_active_pengajuan() from public, anon, authenticated;
revoke all on function public.enforce_verifikasi_order() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_jurnal_status() from public, anon, authenticated;
