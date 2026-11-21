import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const PERIODE_PAGE_SIZE = 10;

export type PeriodeListItem = {
  id: string;
  nama: string;
  tahun_ajaran: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  aktif: boolean;
  siswa: number;
};

export type PeriodeListResult = {
  rows: PeriodeListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PeriodeDetail = PeriodeListItem;

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function getSiswaCountByPeriode() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pengajuan_anggota")
    .select("siswa_id, pengajuan:pengajuan_id(periode_id, status)");

  if (error) {
    throw new Error("Gagal memuat jumlah siswa per periode.");
  }

  const studentsByPeriode = new Map<string, Set<string>>();

  for (const placement of data ?? []) {
    const pengajuan = placement.pengajuan;

    if (!pengajuan || pengajuan.status === "ditolak" || !pengajuan.periode_id) {
      continue;
    }

    const studentIds =
      studentsByPeriode.get(pengajuan.periode_id) ?? new Set<string>();
    studentIds.add(placement.siswa_id);
    studentsByPeriode.set(pengajuan.periode_id, studentIds);
  }

  return studentsByPeriode;
}

export async function getPeriodeList(params: {
  q: string;
  status: string;
  page: number;
}): Promise<PeriodeListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = PERIODE_PAGE_SIZE;

  let query = admin
    .from("periode_pkl")
    .select(
      "id, nama, tahun_ajaran, tanggal_mulai, tanggal_selesai, aktif",
      { count: "exact" },
    )
    .order("aktif", { ascending: false })
    .order("tanggal_mulai", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (term) {
    query = query.or(
      `nama.ilike.%${term}%,tahun_ajaran.ilike.%${term}%`,
    );
  }

  if (params.status === "aktif") {
    query = query.eq("aktif", true);
  } else if (params.status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data periode PKL.");
  }

  const studentsByPeriode = await getSiswaCountByPeriode();

  const total = count ?? 0;
  return {
    rows: (data ?? []).map((periode) => ({
      ...periode,
      siswa: studentsByPeriode.get(periode.id)?.size ?? 0,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getPeriodeDetail = cache(
  async (id: string): Promise<PeriodeDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("periode_pkl")
      .select(
        "id, nama, tahun_ajaran, tanggal_mulai, tanggal_selesai, aktif",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data periode PKL.");
    }

    if (!data) {
      return null;
    }

    const studentsByPeriode = await getSiswaCountByPeriode();

    return {
      ...data,
      siswa: studentsByPeriode.get(data.id)?.size ?? 0,
    };
  },
);
