import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const ORANG_TUA_PAGE_SIZE = 10;

export type RelasiAnak = {
  id: string;
  hubungan: "ayah" | "ibu" | "wali";
  siswa: {
    id: string;
    nama: string;
    nis: string;
    kelas: string | null;
    aktif: boolean;
  } | null;
};

export type OrangTuaListItem = {
  id: string;
  nama: string;
  username: string;
  email: string;
  telepon: string | null;
  aktif: boolean;
  anak: RelasiAnak[];
};

export type OrangTuaListResult = {
  rows: OrangTuaListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type OrangTuaDetail = OrangTuaListItem;

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getOrangTuaList(params: {
  q: string;
  status: string;
  page: number;
}): Promise<OrangTuaListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = ORANG_TUA_PAGE_SIZE;

  let query = admin
    .from("pengguna")
    .select("id, nama_lengkap, username, email, telepon, aktif", {
      count: "exact",
    })
    .eq("peran", "ortu")
    .order("nama_lengkap", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (term) {
    query = query.or(
      `nama_lengkap.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  if (params.status === "aktif") {
    query = query.eq("aktif", true);
  } else if (params.status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data orang tua.");
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const anakByPengguna = new Map<string, RelasiAnak[]>();

  if (ids.length) {
    const { data: relations, error: relationError } = await admin
      .from("orang_tua_siswa")
      .select(
        "id, pengguna_id, hubungan, siswa:siswa_id(id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap))",
      )
      .in("pengguna_id", ids)
      .order("created_at", { ascending: true });

    if (relationError) {
      throw new Error("Gagal memuat relasi anak.");
    }

    for (const relation of relations ?? []) {
      const list = anakByPengguna.get(relation.pengguna_id) ?? [];

      list.push({
        id: relation.id,
        hubungan: relation.hubungan,
        siswa: relation.siswa
          ? {
              id: relation.siswa.id,
              nama: relation.siswa.pengguna?.nama_lengkap ?? "Tanpa nama",
              nis: relation.siswa.nis,
              kelas: relation.siswa.kelas,
              aktif: relation.siswa.aktif,
            }
          : null,
      });
      anakByPengguna.set(relation.pengguna_id, list);
    }
  }

  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      nama: row.nama_lengkap,
      username: row.username,
      email: row.email,
      telepon: row.telepon,
      aktif: row.aktif,
      anak: anakByPengguna.get(row.id) ?? [],
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getOrangTuaDetail = cache(
  async (penggunaId: string): Promise<OrangTuaDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pengguna")
      .select(
        "id, nama_lengkap, username, email, telepon, aktif, peran",
      )
      .eq("id", penggunaId)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data orang tua.");
    }

    if (!data || data.peran !== "ortu") {
      return null;
    }

    const { data: relations, error: relationError } = await admin
      .from("orang_tua_siswa")
      .select(
        "id, hubungan, siswa:siswa_id(id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap))",
      )
      .eq("pengguna_id", data.id)
      .order("created_at", { ascending: true });

    if (relationError) {
      throw new Error("Gagal memuat relasi anak.");
    }

    return {
      id: data.id,
      nama: data.nama_lengkap,
      username: data.username,
      email: data.email,
      telepon: data.telepon,
      aktif: data.aktif,
      anak: (relations ?? []).map((relation) => ({
        id: relation.id,
        hubungan: relation.hubungan,
        siswa: relation.siswa
          ? {
              id: relation.siswa.id,
              nama: relation.siswa.pengguna?.nama_lengkap ?? "Tanpa nama",
              nis: relation.siswa.nis,
              kelas: relation.siswa.kelas,
              aktif: relation.siswa.aktif,
            }
          : null,
      })),
    };
  },
);
