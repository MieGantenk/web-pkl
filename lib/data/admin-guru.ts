import { cache } from "react";
import { connection } from "next/server";

import type { JurusanOption } from "@/lib/data/master";
import { createAdminClient } from "@/lib/supabase/admin";

export const GURU_PAGE_SIZE = 10;

export type GuruListItem = {
  id: string;
  nip: string | null;
  nuptk: string | null;
  jabatan: string | null;
  jurusanNama: string | null;
  nama: string;
  username: string;
  aktif: boolean;
  bimbinganCount: number;
};

export type GuruListResult = {
  rows: GuruListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  jurusanOptions: JurusanOption[];
};

export type GuruDetail = {
  id: string;
  nip: string | null;
  nuptk: string | null;
  jabatan: string | null;
  jurusan_id: string | null;
  pengguna: {
    id: string;
    nama_lengkap: string;
    username: string;
    email: string;
    telepon: string | null;
    aktif: boolean;
  };
  jurusan: { id: string; nama: string } | null;
  bimbinganCount: number;
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getGuruList(params: {
  q: string;
  jurusan: string;
  status: string;
  page: number;
}): Promise<GuruListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = GURU_PAGE_SIZE;

  const jurusanOptionsPromise = admin
    .from("jurusan")
    .select("id, nama")
    .order("nama", { ascending: true });

  const searchPromise = term
    ? Promise.all([
        admin
          .from("pengguna")
          .select("id")
          .eq("peran", "guru")
          .or(`nama_lengkap.ilike.%${term}%,username.ilike.%${term}%`),
        admin
          .from("guru")
          .select("pengguna_id")
          .or(`nip.ilike.%${term}%,nuptk.ilike.%${term}%`),
      ])
    : Promise.resolve(null);

  const [jurusanResult, searchResult] = await Promise.all([
    jurusanOptionsPromise,
    searchPromise,
  ]);

  if (jurusanResult.error) {
    throw new Error("Gagal memuat pilihan jurusan.");
  }

  const jurusanOptions = jurusanResult.data ?? [];

  let matchedIds: string[] | null = null;

  if (searchResult) {
    const [byName, byNip] = searchResult;

    if (byName.error || byNip.error) {
      throw new Error("Gagal mencari guru.");
    }

    matchedIds = Array.from(
      new Set([
        ...(byName.data ?? []).map((row) => row.id),
        ...(byNip.data ?? []).map((row) => row.pengguna_id),
      ]),
    );

    if (!matchedIds.length) {
      return {
        rows: [],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
        jurusanOptions,
      };
    }
  }

  let query = admin
    .from("guru")
    .select(
      "id, nip, nuptk, jabatan, pengguna:pengguna_id!inner(nama_lengkap, username, aktif), jurusan:jurusan_id(nama)",
      { count: "exact" },
    )
    .order("nama_lengkap", { referencedTable: "pengguna", ascending: true })
    .order("nip", { ascending: true, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (matchedIds) {
    query = query.in("pengguna_id", matchedIds);
  }

  if (params.jurusan) {
    query = query.eq("jurusan_id", params.jurusan);
  }

  if (params.status === "aktif") {
    query = query.eq("pengguna.aktif", true);
  } else if (params.status === "nonaktif") {
    query = query.eq("pengguna.aktif", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data guru.");
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const bimbinganByGuru = new Map<string, number>();

  if (ids.length) {
    const { data: placements, error: placementError } = await admin
      .from("pengajuan_pkl")
      .select("guru_pembimbing_id, status")
      .in("guru_pembimbing_id", ids);

    if (placementError) {
      throw new Error("Gagal memuat jumlah bimbingan.");
    }

    for (const placement of placements ?? []) {
      if (
        !placement.guru_pembimbing_id ||
        placement.status === "ditolak" ||
        placement.status === "dibatalkan"
      ) {
        continue;
      }

      bimbinganByGuru.set(
        placement.guru_pembimbing_id,
        (bimbinganByGuru.get(placement.guru_pembimbing_id) ?? 0) + 1,
      );
    }
  }

  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      nip: row.nip,
      nuptk: row.nuptk,
      jabatan: row.jabatan,
      jurusanNama: row.jurusan?.nama ?? null,
      nama: row.pengguna?.nama_lengkap ?? "Tanpa nama",
      username: row.pengguna?.username ?? "—",
      aktif: row.pengguna?.aktif ?? false,
      bimbinganCount: bimbinganByGuru.get(row.id) ?? 0,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    jurusanOptions,
  };
}

export const getGuruDetail = cache(
  async (id: string): Promise<GuruDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("guru")
      .select(
        "id, nip, nuptk, jabatan, jurusan_id, pengguna:pengguna_id(id, nama_lengkap, username, email, telepon, aktif), jurusan:jurusan_id(id, nama)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data guru.");
    }

    if (!data || !data.pengguna) {
      return null;
    }

    const { count, error: placementError } = await admin
      .from("pengajuan_pkl")
      .select("id", { count: "exact", head: true })
      .eq("guru_pembimbing_id", data.id)
      .neq("status", "ditolak")
      .neq("status", "dibatalkan");

    if (placementError) {
      throw new Error("Gagal memuat jumlah bimbingan.");
    }

    return {
      id: data.id,
      nip: data.nip,
      nuptk: data.nuptk,
      jabatan: data.jabatan,
      jurusan_id: data.jurusan_id,
      pengguna: data.pengguna,
      jurusan: data.jurusan,
      bimbinganCount: count ?? 0,
    };
  },
);
