-- ============================================================================
--  Web PKL — RLS & helper functions
--  Prinsip:
--  - Admin memakai service role di server action (setelah cek role).
--  - Siswa/guru/instruktur/ortu memakai session user + RLS.
--  - Semua tabel wajib RLS.
-- ============================================================================

set search_path = public;

-- ============================================================================
--  Helper functions (security definer, bypass RLS)
-- ============================================================================

create or replace function public.current_user_role()
returns public.peran_pengguna
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select peran
  from public.pengguna
  where id = auth.uid() and aktif = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.current_siswa_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.siswa where pengguna_id = auth.uid() and aktif = true;
$$;

create or replace function public.current_guru_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.guru where pengguna_id = auth.uid();
$$;

create or replace function public.can_view_siswa(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
    or exists (
      select 1 from public.siswa s
      where s.id = target and s.pengguna_id = auth.uid()
    )
    or exists (
      select 1 from public.orang_tua_siswa os
      where os.siswa_id = target and os.pengguna_id = auth.uid()
    )
    or exists (
      select 1
      from public.pengajuan_anggota pa
      join public.pengajuan_pkl p on p.id = pa.pengajuan_id
      where pa.siswa_id = target
        and (
          p.guru_pembimbing_id = public.current_guru_id()
          or exists (
            select 1 from public.instruktur i
            where i.pengguna_id = auth.uid()
              and (p.instruktur_id = i.id or p.pembimbing_id = i.id)
          )
        )
    );
$$;

create or replace function public.can_view_pengajuan(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.pengajuan_anggota pa
      join public.siswa s on s.id = pa.siswa_id
      where pa.pengajuan_id = target and s.pengguna_id = auth.uid()
    )
    or exists (
      select 1 from public.pengajuan_pkl p
      where p.id = target and p.guru_pembimbing_id = public.current_guru_id()
    )
    or exists (
      select 1
      from public.pengajuan_pkl p
      join public.instruktur i on i.pengguna_id = auth.uid()
      where p.id = target
        and (p.instruktur_id = i.id or p.pembimbing_id = i.id)
    )
    or exists (
      select 1
      from public.pengajuan_anggota pa
      join public.orang_tua_siswa os on os.siswa_id = pa.siswa_id
      where pa.pengajuan_id = target and os.pengguna_id = auth.uid()
    );
$$;

create or replace function public.is_pengajuan_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.pengajuan_anggota pa
    join public.siswa s on s.id = pa.siswa_id
    where pa.pengajuan_id = target and s.pengguna_id = auth.uid()
  );
$$;

create or replace function public.is_siswa_in_pengajuan(target_siswa uuid, target_pengajuan uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.pengajuan_anggota pa
    where pa.siswa_id = target_siswa and pa.pengajuan_id = target_pengajuan
  );
$$;

create or replace function public.is_pengajuan_owner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.pengajuan_pkl p
    where p.id = target
      and p.dibuat_oleh = auth.uid()
      and p.status = 'draft'
  );
$$;

create or replace function public.can_verify_jurnal(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.jurnal j
    join public.pengajuan_anggota pa on pa.siswa_id = j.siswa_id
    join public.pengajuan_pkl p on p.id = pa.pengajuan_id
    where j.id = target
      and (
        (
          public.current_user_role() = 'guru'
          and p.guru_pembimbing_id = public.current_guru_id()
        )
        or (
          public.current_user_role() = 'instruktur'
          and exists (
            select 1 from public.instruktur i
            where i.pengguna_id = auth.uid()
              and (p.instruktur_id = i.id or p.pembimbing_id = i.id)
          )
        )
      )
  );
$$;

create or replace function public.can_manage_tugas(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
    or exists (
      select 1 from public.pengajuan_pkl p
      where p.id = target and p.guru_pembimbing_id = public.current_guru_id()
    );
$$;

create or replace function public.can_grade(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
    or exists (
      select 1 from public.pengajuan_pkl p
      where p.id = target and p.guru_pembimbing_id = public.current_guru_id()
    )
    or exists (
      select 1
      from public.pengajuan_pkl p
      join public.instruktur i on i.pengguna_id = auth.uid()
      where p.id = target
        and (p.instruktur_id = i.id or p.pembimbing_id = i.id)
    );
$$;

create or replace function public.can_view_jurnal(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.jurnal j
    where j.id = target and public.can_view_siswa(j.siswa_id)
  );
$$;

create or replace function public.can_view_mutabaah(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.mutabaah_harian h
    where h.id = target and public.can_view_siswa(h.siswa_id)
  );
$$;

create or replace function public.can_view_jawaban(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.mutabaah_jawaban j
    join public.mutabaah_harian h on h.id = j.harian_id
    where j.id = target and public.can_view_siswa(h.siswa_id)
  );
$$;

-- ============================================================================
--  Verifikasi jurnal 2 langkah
-- ============================================================================

create or replace function public.enforce_verifikasi_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.peran = 'instruktur' then
    if not exists (
      select 1 from public.verifikasi_jurnal
      where jurnal_id = new.jurnal_id
        and peran = 'guru'
        and status = 'diterima'
    ) then
      raise exception 'Jurnal harus diverifikasi guru terlebih dahulu';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_verifikasi_order on public.verifikasi_jurnal;
create trigger enforce_verifikasi_order
before insert or update on public.verifikasi_jurnal
for each row execute function public.enforce_verifikasi_order();

create or replace function public.sync_jurnal_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jurnal_id uuid;
  v_guru public.status_verifikasi;
  v_instruktur public.status_verifikasi;
begin
  v_jurnal_id := coalesce(new.jurnal_id, old.jurnal_id);

  select status into v_guru
  from public.verifikasi_jurnal
  where jurnal_id = v_jurnal_id and peran = 'guru';

  select status into v_instruktur
  from public.verifikasi_jurnal
  where jurnal_id = v_jurnal_id and peran = 'instruktur';

  update public.jurnal
  set status = case
    when v_guru = 'revisi' or v_instruktur = 'revisi' then 'revisi'::public.status_jurnal
    when v_guru = 'diterima' and v_instruktur = 'diterima' then 'terverifikasi_instruktur'::public.status_jurnal
    when v_guru = 'diterima' then 'terverifikasi_guru'::public.status_jurnal
    else 'menunggu'::public.status_jurnal
  end
  where id = v_jurnal_id;

  return null;
end;
$$;

drop trigger if exists sync_jurnal_status on public.verifikasi_jurnal;
create trigger sync_jurnal_status
after insert or update or delete on public.verifikasi_jurnal
for each row execute function public.sync_jurnal_status();

-- ============================================================================
--  Enable RLS
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'pengguna','jurusan','guru','siswa','perusahaan','periode_pkl','instruktur',
    'orang_tua_siswa','pengajuan_pkl','pengajuan_anggota','surat','dokumen',
    'jurnal','verifikasi_jurnal','tugas','tugas_siswa','mutabaah_form',
    'mutabaah_pertanyaan','mutabaah_opsi','mutabaah_harian','mutabaah_jawaban',
    'mutabaah_jawaban_opsi','penilaian','sertifikat','pengaturan_sekolah',
    'penomoran_surat','log_aktivitas','notifikasi'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ============================================================================
--  Grants
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Login page boleh membaca profil sekolah
grant select on public.pengaturan_sekolah to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Pengguna: jangan ekspos email/telepon ke sesi user biasa
revoke all on public.pengguna from authenticated;
grant select (id, nama_lengkap, peran, avatar_url, aktif) on public.pengguna to authenticated;
grant update (nama_lengkap, telepon, avatar_url) on public.pengguna to authenticated;

-- Siswa hanya boleh ubah kontak
revoke update on public.siswa from authenticated;
grant update (telepon, alamat) on public.siswa to authenticated;

-- Jurnal: siswa tidak boleh mengubah status verifikasi
revoke insert, update on public.jurnal from authenticated;
grant insert (siswa_id, pengajuan_id, tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, foto_path)
  on public.jurnal to authenticated;
grant update (tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, foto_path)
  on public.jurnal to authenticated;

-- Dokumen: siswa hanya boleh membuat baris unggahan
revoke insert on public.dokumen from authenticated;
grant insert (pengajuan_id, jenis, file_path, file_name, mime_type, ukuran, diunggah_oleh)
  on public.dokumen to authenticated;

-- Pengajuan: siswa hanya boleh mengubah field draft
revoke insert, update on public.pengajuan_pkl from authenticated;
grant insert (perusahaan_id, periode_id, dibuat_oleh, guru_pembimbing_id, catatan)
  on public.pengajuan_pkl to authenticated;
grant update (perusahaan_id, periode_id, catatan)
  on public.pengajuan_pkl to authenticated;

-- Anggota pengajuan
revoke insert on public.pengajuan_anggota from authenticated;
grant insert (pengajuan_id, siswa_id, peran) on public.pengajuan_anggota to authenticated;

-- Verifikasi jurnal
revoke insert, update on public.verifikasi_jurnal from authenticated;
grant insert (jurnal_id, verifikator_id, peran, status, catatan)
  on public.verifikasi_jurnal to authenticated;
grant update (status, catatan) on public.verifikasi_jurnal to authenticated;

-- Tugas siswa
revoke insert, update on public.tugas_siswa from authenticated;
grant insert (tugas_id, siswa_id) on public.tugas_siswa to authenticated;
grant update (status, catatan, file_path, selesai_pada) on public.tugas_siswa to authenticated;

-- Mutaba'ah
revoke insert, update on public.mutabaah_harian from authenticated;
grant insert (siswa_id, form_id, tanggal, catatan) on public.mutabaah_harian to authenticated;
grant update (catatan) on public.mutabaah_harian to authenticated;

revoke insert, update on public.mutabaah_jawaban from authenticated;
grant insert (harian_id, pertanyaan_id, jawaban_teks, jawaban_angka, jawaban_boolean)
  on public.mutabaah_jawaban to authenticated;
grant update (jawaban_teks, jawaban_angka, jawaban_boolean)
  on public.mutabaah_jawaban to authenticated;

revoke insert on public.mutabaah_jawaban_opsi from authenticated;
grant insert (jawaban_id, opsi_id) on public.mutabaah_jawaban_opsi to authenticated;

-- Penilaian
revoke insert, update on public.penilaian from authenticated;
grant insert (pengajuan_id, siswa_id, penilai_id, peran, nilai, catatan)
  on public.penilaian to authenticated;
grant update (nilai, catatan) on public.penilaian to authenticated;

-- Notifikasi: user hanya boleh menandai dibaca
revoke update on public.notifikasi from authenticated;
grant update (dibaca) on public.notifikasi to authenticated;

-- ============================================================================
--  Policies — master data
-- ============================================================================

drop policy if exists pengguna_select on public.pengguna;
create policy pengguna_select on public.pengguna
  for select to authenticated using (true);

drop policy if exists pengguna_update_self on public.pengguna;
create policy pengguna_update_self on public.pengguna
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists pengguna_admin_all on public.pengguna;
create policy pengguna_admin_all on public.pengguna
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists jurusan_select on public.jurusan;
create policy jurusan_select on public.jurusan
  for select to authenticated using (true);

drop policy if exists jurusan_admin_all on public.jurusan;
create policy jurusan_admin_all on public.jurusan
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists perusahaan_select on public.perusahaan;
create policy perusahaan_select on public.perusahaan
  for select to authenticated using (true);

drop policy if exists perusahaan_admin_all on public.perusahaan;
create policy perusahaan_admin_all on public.perusahaan
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists periode_select on public.periode_pkl;
create policy periode_select on public.periode_pkl
  for select to authenticated using (true);

drop policy if exists periode_admin_all on public.periode_pkl;
create policy periode_admin_all on public.periode_pkl
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists guru_select on public.guru;
create policy guru_select on public.guru
  for select to authenticated using (true);

drop policy if exists guru_admin_all on public.guru;
create policy guru_admin_all on public.guru
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists instruktur_select on public.instruktur;
create policy instruktur_select on public.instruktur
  for select to authenticated using (true);

drop policy if exists instruktur_admin_all on public.instruktur;
create policy instruktur_admin_all on public.instruktur
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists siswa_select on public.siswa;
create policy siswa_select on public.siswa
  for select to authenticated using (public.can_view_siswa(id));

drop policy if exists siswa_update_self on public.siswa;
create policy siswa_update_self on public.siswa
  for update to authenticated
  using (pengguna_id = auth.uid()) with check (pengguna_id = auth.uid());

drop policy if exists siswa_admin_all on public.siswa;
create policy siswa_admin_all on public.siswa
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists ortu_select on public.orang_tua_siswa;
create policy ortu_select on public.orang_tua_siswa
  for select to authenticated
  using (
    public.is_admin()
    or pengguna_id = auth.uid()
    or exists (
      select 1 from public.siswa s
      where s.id = siswa_id and s.pengguna_id = auth.uid()
    )
  );

drop policy if exists ortu_admin_all on public.orang_tua_siswa;
create policy ortu_admin_all on public.orang_tua_siswa
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Policies — alur PKL
-- ============================================================================

drop policy if exists pengajuan_select on public.pengajuan_pkl;
create policy pengajuan_select on public.pengajuan_pkl
  for select to authenticated using (public.can_view_pengajuan(id));

drop policy if exists pengajuan_insert_owner on public.pengajuan_pkl;
create policy pengajuan_insert_owner on public.pengajuan_pkl
  for insert to authenticated
  with check (
    dibuat_oleh = auth.uid()
    and public.current_user_role() = 'siswa'
  );

drop policy if exists pengajuan_update_owner on public.pengajuan_pkl;
create policy pengajuan_update_owner on public.pengajuan_pkl
  for update to authenticated
  using (dibuat_oleh = auth.uid() and status = 'draft')
  with check (dibuat_oleh = auth.uid());

drop policy if exists pengajuan_admin_all on public.pengajuan_pkl;
create policy pengajuan_admin_all on public.pengajuan_pkl
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists anggota_select on public.pengajuan_anggota;
create policy anggota_select on public.pengajuan_anggota
  for select to authenticated using (public.can_view_pengajuan(pengajuan_id));

drop policy if exists anggota_insert_owner on public.pengajuan_anggota;
create policy anggota_insert_owner on public.pengajuan_anggota
  for insert to authenticated with check (public.is_pengajuan_owner(pengajuan_id));

drop policy if exists anggota_delete_owner on public.pengajuan_anggota;
create policy anggota_delete_owner on public.pengajuan_anggota
  for delete to authenticated using (public.is_pengajuan_owner(pengajuan_id));

drop policy if exists anggota_admin_all on public.pengajuan_anggota;
create policy anggota_admin_all on public.pengajuan_anggota
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists surat_select on public.surat;
create policy surat_select on public.surat
  for select to authenticated using (public.can_view_pengajuan(pengajuan_id));

drop policy if exists surat_admin_all on public.surat;
create policy surat_admin_all on public.surat
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists dokumen_select on public.dokumen;
create policy dokumen_select on public.dokumen
  for select to authenticated using (public.can_view_pengajuan(pengajuan_id));

drop policy if exists dokumen_insert_member on public.dokumen;
create policy dokumen_insert_member on public.dokumen
  for insert to authenticated
  with check (
    public.is_pengajuan_member(pengajuan_id)
    and diunggah_oleh = auth.uid()
  );

drop policy if exists dokumen_admin_all on public.dokumen;
create policy dokumen_admin_all on public.dokumen
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Policies — jurnal & verifikasi
-- ============================================================================

drop policy if exists jurnal_select on public.jurnal;
create policy jurnal_select on public.jurnal
  for select to authenticated using (public.can_view_siswa(siswa_id));

drop policy if exists jurnal_insert_self on public.jurnal;
create policy jurnal_insert_self on public.jurnal
  for insert to authenticated
  with check (
    siswa_id = public.current_siswa_id()
    and (
      pengajuan_id is null
      or public.is_siswa_in_pengajuan(siswa_id, pengajuan_id)
    )
  );

drop policy if exists jurnal_update_self on public.jurnal;
create policy jurnal_update_self on public.jurnal
  for update to authenticated
  using (
    siswa_id = public.current_siswa_id()
    and status in ('menunggu', 'revisi')
  )
  with check (siswa_id = public.current_siswa_id());

drop policy if exists jurnal_admin_all on public.jurnal;
create policy jurnal_admin_all on public.jurnal
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists verifikasi_select on public.verifikasi_jurnal;
create policy verifikasi_select on public.verifikasi_jurnal
  for select to authenticated using (public.can_view_jurnal(jurnal_id));

drop policy if exists verifikasi_insert on public.verifikasi_jurnal;
create policy verifikasi_insert on public.verifikasi_jurnal
  for insert to authenticated
  with check (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = auth.uid()
    and peran::text = public.current_user_role()::text
  );

drop policy if exists verifikasi_update on public.verifikasi_jurnal;
create policy verifikasi_update on public.verifikasi_jurnal
  for update to authenticated
  using (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = auth.uid()
  )
  with check (
    public.can_verify_jurnal(jurnal_id)
    and verifikator_id = auth.uid()
  );

drop policy if exists verifikasi_admin_select on public.verifikasi_jurnal;
create policy verifikasi_admin_select on public.verifikasi_jurnal
  for select to authenticated using (public.is_admin());

-- ============================================================================
--  Policies — tugas
-- ============================================================================

drop policy if exists tugas_select on public.tugas;
create policy tugas_select on public.tugas
  for select to authenticated using (public.can_view_pengajuan(pengajuan_id));

drop policy if exists tugas_insert_guru on public.tugas;
create policy tugas_insert_guru on public.tugas
  for insert to authenticated
  with check (
    (public.is_admin() and guru_id = public.current_guru_id())
    or (
      public.can_manage_tugas(pengajuan_id)
      and guru_id = public.current_guru_id()
    )
  );

drop policy if exists tugas_update_guru on public.tugas;
create policy tugas_update_guru on public.tugas
  for update to authenticated
  using (public.can_manage_tugas(pengajuan_id))
  with check (public.can_manage_tugas(pengajuan_id));

drop policy if exists tugas_admin_all on public.tugas;
create policy tugas_admin_all on public.tugas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists tugas_siswa_select on public.tugas_siswa;
create policy tugas_siswa_select on public.tugas_siswa
  for select to authenticated using (public.can_view_siswa(siswa_id));

drop policy if exists tugas_siswa_insert_guru on public.tugas_siswa;
create policy tugas_siswa_insert_guru on public.tugas_siswa
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.tugas t
      where t.id = tugas_id
        and public.is_siswa_in_pengajuan(siswa_id, t.pengajuan_id)
        and public.can_manage_tugas(t.pengajuan_id)
    )
  );

drop policy if exists tugas_siswa_update_self on public.tugas_siswa;
create policy tugas_siswa_update_self on public.tugas_siswa
  for update to authenticated
  using (siswa_id = public.current_siswa_id())
  with check (siswa_id = public.current_siswa_id());

drop policy if exists tugas_siswa_update_guru on public.tugas_siswa;
create policy tugas_siswa_update_guru on public.tugas_siswa
  for update to authenticated
  using (
    exists (
      select 1 from public.tugas t
      where t.id = tugas_id and public.can_manage_tugas(t.pengajuan_id)
    )
  )
  with check (
    exists (
      select 1
      from public.tugas t
      where t.id = tugas_id
        and public.is_siswa_in_pengajuan(siswa_id, t.pengajuan_id)
        and public.can_manage_tugas(t.pengajuan_id)
    )
  );

drop policy if exists tugas_siswa_admin_all on public.tugas_siswa;
create policy tugas_siswa_admin_all on public.tugas_siswa
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Policies — mutaba'ah
-- ============================================================================

drop policy if exists mutabaah_form_select on public.mutabaah_form;
create policy mutabaah_form_select on public.mutabaah_form
  for select to authenticated
  using (status in ('aktif', 'arsip') or public.is_admin());

drop policy if exists mutabaah_form_admin_all on public.mutabaah_form;
create policy mutabaah_form_admin_all on public.mutabaah_form
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mutabaah_pertanyaan_select on public.mutabaah_pertanyaan;
create policy mutabaah_pertanyaan_select on public.mutabaah_pertanyaan
  for select to authenticated
  using (
    exists (
      select 1 from public.mutabaah_form f
      where f.id = form_id
        and (f.status in ('aktif', 'arsip') or public.is_admin())
    )
  );

drop policy if exists mutabaah_pertanyaan_admin_all on public.mutabaah_pertanyaan;
create policy mutabaah_pertanyaan_admin_all on public.mutabaah_pertanyaan
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mutabaah_opsi_select on public.mutabaah_opsi;
create policy mutabaah_opsi_select on public.mutabaah_opsi
  for select to authenticated
  using (
    exists (
      select 1
      from public.mutabaah_pertanyaan q
      join public.mutabaah_form f on f.id = q.form_id
      where q.id = pertanyaan_id
        and (f.status in ('aktif', 'arsip') or public.is_admin())
    )
  );

drop policy if exists mutabaah_opsi_admin_all on public.mutabaah_opsi;
create policy mutabaah_opsi_admin_all on public.mutabaah_opsi
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mutabaah_harian_select on public.mutabaah_harian;
create policy mutabaah_harian_select on public.mutabaah_harian
  for select to authenticated using (public.can_view_siswa(siswa_id));

drop policy if exists mutabaah_harian_insert_self on public.mutabaah_harian;
create policy mutabaah_harian_insert_self on public.mutabaah_harian
  for insert to authenticated
  with check (
    siswa_id = public.current_siswa_id()
    and tanggal = (now() at time zone 'Asia/Jakarta')::date
    and exists (
      select 1 from public.mutabaah_form f
      where f.id = form_id and f.status = 'aktif'
    )
  );

drop policy if exists mutabaah_harian_update_self on public.mutabaah_harian;
create policy mutabaah_harian_update_self on public.mutabaah_harian
  for update to authenticated
  using (
    siswa_id = public.current_siswa_id()
    and tanggal = (now() at time zone 'Asia/Jakarta')::date
  )
  with check (siswa_id = public.current_siswa_id());

drop policy if exists mutabaah_harian_admin_all on public.mutabaah_harian;
create policy mutabaah_harian_admin_all on public.mutabaah_harian
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mutabaah_jawaban_select on public.mutabaah_jawaban;
create policy mutabaah_jawaban_select on public.mutabaah_jawaban
  for select to authenticated using (public.can_view_mutabaah(harian_id));

drop policy if exists mutabaah_jawaban_insert_self on public.mutabaah_jawaban;
create policy mutabaah_jawaban_insert_self on public.mutabaah_jawaban
  for insert to authenticated
  with check (
    exists (
      select 1 from public.mutabaah_harian h
      where h.id = harian_id
        and h.siswa_id = public.current_siswa_id()
        and h.tanggal = (now() at time zone 'Asia/Jakarta')::date
    )
    and exists (
      select 1
      from public.mutabaah_harian h
      join public.mutabaah_pertanyaan q on q.form_id = h.form_id
      where h.id = harian_id and q.id = pertanyaan_id
    )
  );

drop policy if exists mutabaah_jawaban_update_self on public.mutabaah_jawaban;
create policy mutabaah_jawaban_update_self on public.mutabaah_jawaban
  for update to authenticated
  using (
    exists (
      select 1 from public.mutabaah_harian h
      where h.id = harian_id
        and h.siswa_id = public.current_siswa_id()
        and h.tanggal = (now() at time zone 'Asia/Jakarta')::date
    )
  )
  with check (true);

drop policy if exists mutabaah_jawaban_admin_all on public.mutabaah_jawaban;
create policy mutabaah_jawaban_admin_all on public.mutabaah_jawaban
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mutabaah_jawaban_opsi_select on public.mutabaah_jawaban_opsi;
create policy mutabaah_jawaban_opsi_select on public.mutabaah_jawaban_opsi
  for select to authenticated using (public.can_view_jawaban(jawaban_id));

drop policy if exists mutabaah_jawaban_opsi_insert_self on public.mutabaah_jawaban_opsi;
create policy mutabaah_jawaban_opsi_insert_self on public.mutabaah_jawaban_opsi
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.mutabaah_jawaban j
      join public.mutabaah_harian h on h.id = j.harian_id
      join public.mutabaah_opsi o on o.pertanyaan_id = j.pertanyaan_id
      where j.id = jawaban_id
        and o.id = opsi_id
        and h.siswa_id = public.current_siswa_id()
        and h.tanggal = (now() at time zone 'Asia/Jakarta')::date
    )
  );

drop policy if exists mutabaah_jawaban_opsi_delete_self on public.mutabaah_jawaban_opsi;
create policy mutabaah_jawaban_opsi_delete_self on public.mutabaah_jawaban_opsi
  for delete to authenticated
  using (
    exists (
      select 1
      from public.mutabaah_jawaban j
      join public.mutabaah_harian h on h.id = j.harian_id
      where j.id = jawaban_id
        and h.siswa_id = public.current_siswa_id()
        and h.tanggal = (now() at time zone 'Asia/Jakarta')::date
    )
  );

drop policy if exists mutabaah_jawaban_opsi_admin_all on public.mutabaah_jawaban_opsi;
create policy mutabaah_jawaban_opsi_admin_all on public.mutabaah_jawaban_opsi
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Policies — penilaian & sertifikat
-- ============================================================================

drop policy if exists penilaian_select on public.penilaian;
create policy penilaian_select on public.penilaian
  for select to authenticated using (public.can_view_siswa(siswa_id));

drop policy if exists penilaian_insert on public.penilaian;
create policy penilaian_insert on public.penilaian
  for insert to authenticated
  with check (
    public.can_grade(pengajuan_id)
    and penilai_id = auth.uid()
    and peran::text = public.current_user_role()::text
  );

drop policy if exists penilaian_update on public.penilaian;
create policy penilaian_update on public.penilaian
  for update to authenticated
  using (penilai_id = auth.uid())
  with check (penilai_id = auth.uid());

drop policy if exists penilaian_admin_select on public.penilaian;
create policy penilaian_admin_select on public.penilaian
  for select to authenticated using (public.is_admin());

drop policy if exists sertifikat_select on public.sertifikat;
create policy sertifikat_select on public.sertifikat
  for select to authenticated using (public.can_view_siswa(siswa_id));

drop policy if exists sertifikat_admin_all on public.sertifikat;
create policy sertifikat_admin_all on public.sertifikat
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Policies — pengaturan, audit, notifikasi
-- ============================================================================

drop policy if exists pengaturan_select on public.pengaturan_sekolah;
create policy pengaturan_select on public.pengaturan_sekolah
  for select to authenticated using (true);

drop policy if exists pengaturan_select_anon on public.pengaturan_sekolah;
create policy pengaturan_select_anon on public.pengaturan_sekolah
  for select to anon using (true);

drop policy if exists pengaturan_admin_all on public.pengaturan_sekolah;
create policy pengaturan_admin_all on public.pengaturan_sekolah
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists penomoran_admin_all on public.penomoran_surat;
create policy penomoran_admin_all on public.penomoran_surat
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists log_admin_select on public.log_aktivitas;
create policy log_admin_select on public.log_aktivitas
  for select to authenticated using (public.is_admin());

drop policy if exists notifikasi_select on public.notifikasi;
create policy notifikasi_select on public.notifikasi
  for select to authenticated
  using (pengguna_id = auth.uid() or public.is_admin());

drop policy if exists notifikasi_update_self on public.notifikasi;
create policy notifikasi_update_self on public.notifikasi
  for update to authenticated
  using (pengguna_id = auth.uid())
  with check (pengguna_id = auth.uid());

drop policy if exists notifikasi_admin_all on public.notifikasi;
create policy notifikasi_admin_all on public.notifikasi
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
