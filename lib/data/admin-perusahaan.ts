import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const PERUSAHAAN_PAGE_SIZE = 10;

export type PerusahaanListItem = {
  id: string;
  nama: string;
  kota: string | null;
  telepon: string | null;
  email: string | null;
  aktif: boolean;
  instrukturCount: number;
};

export type PerusahaanListResult = {
  rows: PerusahaanListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PerusahaanInstruktur = {
  id: string;
  nama: string;
  peran: "instruktur" | "pembimbing";
  jabatan: string | null;
  telepon: string | null;
  aktif: boolean;
};

export type PerusahaanDetail = {
  id: string;
  nama: string;
  alamat: string;
  kota: string | null;
  telepon: string | null;
  email: string | null;
  website: string | null;
  aktif: boolean;
  instruktur: PerusahaanInstruktur[];
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getPerusahaanList(params: {
  q: string;
  status: string;
  page: number;
}): Promise<PerusahaanListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = PERUSAHAAN_PAGE_SIZE;

  let query = admin
    .from("perusahaan")
    .select("id, nama, kota, telepon, email, aktif", { count: "exact" })
    .order("nama", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (term) {
    query = query.or(
      `nama.ilike.%${term}%,kota.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  if (params.status === "aktif") {
    query = query.eq("aktif", true);
  } else if (params.status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data perusahaan.");
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const instrukturByPerusahaan = new Map<string, number>();

  if (ids.length) {
    const { data: instructors, error: instructorError } = await admin
      .from("instruktur")
      .select("perusahaan_id")
      .in("perusahaan_id", ids);

    if (instructorError) {
      throw new Error("Gagal memuat jumlah instruktur.");
    }

    for (const instructor of instructors ?? []) {
      instrukturByPerusahaan.set(
        instructor.perusahaan_id,
        (instrukturByPerusahaan.get(instructor.perusahaan_id) ?? 0) + 1,
      );
    }
  }

  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      nama: row.nama,
      kota: row.kota,
      telepon: row.telepon,
      email: row.email,
      aktif: row.aktif,
      instrukturCount: instrukturByPerusahaan.get(row.id) ?? 0,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getPerusahaanDetail = cache(
  async (id: string): Promise<PerusahaanDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("perusahaan")
      .select("id, nama, alamat, kota, telepon, email, website, aktif")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data perusahaan.");
    }

    if (!data) {
      return null;
    }

    const { data: instructors, error: instructorError } = await admin
      .from("instruktur")
      .select(
        "id, peran, jabatan, telepon, aktif, pengguna:pengguna_id(nama_lengkap)",
      )
      .eq("perusahaan_id", data.id)
      .order("created_at", { ascending: true });

    if (instructorError) {
      throw new Error("Gagal memuat data instruktur.");
    }

    return {
      ...data,
      instruktur: (instructors ?? []).map((instructor) => ({
        id: instructor.id,
        nama: instructor.pengguna?.nama_lengkap ?? "Tanpa nama",
        peran: instructor.peran,
        jabatan: instructor.jabatan,
        telepon: instructor.telepon,
        aktif: instructor.aktif,
      })),
    };
  },
);
