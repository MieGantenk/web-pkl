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

  const total = count ?? 0;

  return {
    rows: data ?? [],
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

    return data ?? null;
  },
);
