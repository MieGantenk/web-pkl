import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export type JurusanOption = { id: string; nama: string };

export type PerusahaanOption = { id: string; nama: string; aktif: boolean };

export type SiswaOption = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  aktif: boolean;
};

export const getJurusanOptions = cache(async (): Promise<JurusanOption[]> => {
  await connection();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jurusan")
    .select("id, nama")
    .order("nama", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat data jurusan.");
  }

  return data ?? [];
});

export const getPerusahaanOptions = cache(
  async (): Promise<PerusahaanOption[]> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("perusahaan")
      .select("id, nama, aktif")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error("Gagal memuat data perusahaan.");
    }

    return data ?? [];
  },
);

export const getSiswaOptions = cache(async (): Promise<SiswaOption[]> => {
  await connection();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("siswa")
    .select("id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap)")
    .order("kelas", { ascending: true })
    .order("nis", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat data siswa.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    nama: row.pengguna?.nama_lengkap ?? "Tanpa nama",
    nis: row.nis,
    kelas: row.kelas,
    aktif: row.aktif,
  }));
});
