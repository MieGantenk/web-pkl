import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const INSTRUKTUR_PAGE_SIZE = 10;

export type PenugasanItem = {
  id: string;
  peran: "instruktur" | "pembimbing";
  jabatan: string | null;
  telepon: string | null;
  aktif: boolean;
  perusahaan: { id: string; nama: string; aktif: boolean } | null;
};

export type InstrukturListItem = {
  id: string;
  nama: string;
  username: string;
  email: string;
  telepon: string | null;
  aktif: boolean;
  penugasan: PenugasanItem[];
};

export type InstrukturListResult = {
  rows: InstrukturListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type InstrukturDetail = InstrukturListItem;

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getInstrukturList(params: {
  q: string;
  perusahaan: string;
  status: string;
  page: number;
}): Promise<InstrukturListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = INSTRUKTUR_PAGE_SIZE;

  let userIds: string[] | null = null;

  if (params.perusahaan) {
    const { data, error } = await admin
      .from("instruktur")
      .select("pengguna_id")
      .eq("perusahaan_id", params.perusahaan);

    if (error) {
      throw new Error("Gagal memuat penugasan instruktur.");
    }

    userIds = Array.from(new Set((data ?? []).map((row) => row.pengguna_id)));

    if (!userIds.length) {
      return {
        rows: [],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
      };
    }
  }

  let query = admin
    .from("pengguna")
    .select("id, nama_lengkap, username, email, telepon, aktif", {
      count: "exact",
    })
    .eq("peran", "instruktur")
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

  if (userIds) {
    query = query.in("id", userIds);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data instruktur.");
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const penugasanByPengguna = new Map<string, PenugasanItem[]>();

  if (ids.length) {
    const { data: assignments, error: assignmentError } = await admin
      .from("instruktur")
      .select(
        "id, pengguna_id, peran, jabatan, telepon, aktif, perusahaan:perusahaan_id(id, nama, aktif)",
      )
      .in("pengguna_id", ids)
      .order("created_at", { ascending: true });

    if (assignmentError) {
      throw new Error("Gagal memuat penugasan instruktur.");
    }

    for (const assignment of assignments ?? []) {
      const list = penugasanByPengguna.get(assignment.pengguna_id) ?? [];

      list.push({
        id: assignment.id,
        peran: assignment.peran,
        jabatan: assignment.jabatan,
        telepon: assignment.telepon,
        aktif: assignment.aktif,
        perusahaan: assignment.perusahaan,
      });
      penugasanByPengguna.set(assignment.pengguna_id, list);
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
      penugasan: penugasanByPengguna.get(row.id) ?? [],
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getInstrukturDetail = cache(
  async (penggunaId: string): Promise<InstrukturDetail | null> => {
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
      throw new Error("Gagal memuat data instruktur.");
    }

    if (!data || data.peran !== "instruktur") {
      return null;
    }

    const { data: assignments, error: assignmentError } = await admin
      .from("instruktur")
      .select(
        "id, peran, jabatan, telepon, aktif, perusahaan:perusahaan_id(id, nama, aktif)",
      )
      .eq("pengguna_id", data.id)
      .order("created_at", { ascending: true });

    if (assignmentError) {
      throw new Error("Gagal memuat penugasan instruktur.");
    }

    return {
      id: data.id,
      nama: data.nama_lengkap,
      username: data.username,
      email: data.email,
      telepon: data.telepon,
      aktif: data.aktif,
      penugasan: (assignments ?? []).map((assignment) => ({
        id: assignment.id,
        peran: assignment.peran,
        jabatan: assignment.jabatan,
        telepon: assignment.telepon,
        aktif: assignment.aktif,
        perusahaan: assignment.perusahaan,
      })),
    };
  },
);
