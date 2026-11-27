create index if not exists pengajuan_pkl_created_at_desc_idx
  on public.pengajuan_pkl (created_at desc);

create index if not exists pengajuan_pkl_status_created_at_desc_idx
  on public.pengajuan_pkl (status, created_at desc);

create index if not exists jurnal_tanggal_created_at_desc_idx
  on public.jurnal (tanggal desc, created_at desc);

create index if not exists jurnal_status_tanggal_created_at_desc_idx
  on public.jurnal (status, tanggal desc, created_at desc);

create index if not exists surat_tanggal_terbit_created_at_desc_idx
  on public.surat (tanggal_terbit desc nulls last, created_at desc);

create index if not exists dokumen_diunggah_pada_desc_idx
  on public.dokumen (diunggah_pada desc);

create index if not exists mutabaah_harian_tanggal_created_at_desc_idx
  on public.mutabaah_harian (tanggal desc, created_at desc);

create index if not exists log_aktivitas_created_at_desc_idx
  on public.log_aktivitas (created_at desc);

create index if not exists notifikasi_pengguna_created_at_desc_idx
  on public.notifikasi (pengguna_id, created_at desc);
