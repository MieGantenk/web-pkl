-- ============================================================================
--  Guru pembimbing, banyak form mutaba'ah aktif, dan kehadiran jurnal.
-- ============================================================================

-- Kehadiran harian siswa pada jurnal.
create type public.kehadiran_jurnal as enum ('hadir', 'izin', 'sakit');

alter table public.jurnal
  add column kehadiran public.kehadiran_jurnal not null default 'hadir';

revoke insert, update on public.jurnal from authenticated;
grant insert (
  siswa_id,
  pengajuan_id,
  tanggal,
  kehadiran,
  waktu_mulai,
  waktu_selesai,
  kegiatan,
  deskripsi,
  foto_path
) on public.jurnal to authenticated;
grant update (
  tanggal,
  kehadiran,
  waktu_mulai,
  waktu_selesai,
  kegiatan,
  deskripsi,
  foto_path
) on public.jurnal to authenticated;

-- Siswa boleh mengganti guru pembimbing selama draft.
grant update (perusahaan_id, periode_id, guru_pembimbing_id, catatan)
  on public.pengajuan_pkl to authenticated;

-- Beberapa form mutaba'ah boleh aktif bersamaan.
drop index if exists public.mutabaah_form_satu_aktif_per_periode;

-- Satu entri per siswa per form per tanggal.
drop index if exists public.mutabaah_harian_siswa_id_tanggal_idx;
create unique index if not exists mutabaah_harian_siswa_form_tanggal_unique
  on public.mutabaah_harian (siswa_id, form_id, tanggal);

comment on column public.jurnal.kehadiran is
  'Hadir, izin, atau sakit. Jurnal izin/sakit tidak memakai foto kegiatan.';
