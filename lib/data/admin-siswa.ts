import { cache } from "react";
import { connection } from "next/server";

import type { StatusJurnal, StatusPengajuan } from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const SISWA_PAGE_SIZE = 10;

export type SiswaListItem = {
  id: string;
  nis: string;
  kelas: string | null;
  aktif: boolean;
  nama: string;
  username: string;
  pengajuanStatus: StatusPengajuan | null;
};

export type SiswaListResult = {
  rows: SiswaListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  kelasOptions: string[];
};

export type SiswaDetail = {
  id: string;
  nis: string;
  nisn: string | null;
  kelas: string | null;
  telepon: string | null;
  alamat: string | null;
  nama_orangtua: string | null;
  telepon_orangtua: string | null;
  jurusan_id: string | null;
  pengguna: {
    id: string;
    nama_lengkap: string;
    username: string;
    email: string;
    aktif: boolean;
  };
  jurusan: { id: string; nama: string } | null;
  pengajuan: {
    id: string;
    status: StatusPengajuan;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    perusahaan: { nama: string } | null;
    periode: { nama: string } | null;
  } | null;
  jurnal: Array<{
    id: string;
    tanggal: string;
    kegiatan: string;
    status: StatusJurnal;
  }>;
};

export type JurusanOption = { id: string; nama: string };

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getSiswaList(params: {
  q: string;
  kelas: string;
  status: string;
  page: number;
}): Promise<SiswaListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = SISWA_PAGE_SIZE;

  const kelasOptionsPromise = admin
    .from("siswa")
    .select("kelas")
    .not("kelas", "is", null)
    .order("kelas", { ascending: true });

  const searchPromise = term
    ? Promise.all([
        admin
          .from("pengguna")
          .select("id")
          .eq("peran", "siswa")
          .or(`nama_lengkap.ilike.%${term}%,username.ilike.%${term}%`),
        admin
          .from("siswa")
          .select("pengguna_id")
          .ilike("nis", `%${term}%`),
      ])
    : Promise.resolve(null);

  const [kelasResult, searchResult] = await Promise.all([
    kelasOptionsPromise,
    searchPromise,
  ]);

  if (kelasResult.error) {
    throw new Error("Gagal memuat pilihan kelas.");
  }

  const kelasOptions = Array.from(
    new Set(
      (kelasResult.data ?? [])
        .map((row) => row.kelas)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let matchedIds: string[] | null = null;

  if (searchResult) {
    const [byName, byNis] = searchResult;

    if (byName.error || byNis.error) {
      throw new Error("Gagal mencari siswa.");
    }

    matchedIds = Array.from(
      new Set([
        ...(byName.data ?? []).map((row) => row.id),
        ...(byNis.data ?? []).map((row) => row.pengguna_id),
      ]),
    );

    if (!matchedIds.length) {
      return {
        rows: [],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
        kelasOptions,
      };
    }
  }

  let query = admin
    .from("siswa")
    .select(
      "id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap, username, aktif)",
      { count: "exact" },
    )
    .order("kelas", { ascending: true })
    .order("nis", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (matchedIds) {
    query = query.in("pengguna_id", matchedIds);
  }

  if (params.kelas) {
    query = query.eq("kelas", params.kelas);
  }

  if (params.status === "aktif") {
    query = query.eq("aktif", true);
  } else if (params.status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data siswa.");
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const statusByStudent = new Map<string, StatusPengajuan>();

  if (ids.length) {
    const { data: placements, error: placementError } = await admin
      .from("pengajuan_anggota")
      .select("siswa_id, created_at, pengajuan:pengajuan_id(status)")
      .in("siswa_id", ids)
      .order("created_at", { ascending: false });

    if (placementError) {
      throw new Error("Gagal memuat status pengajuan.");
    }

    for (const placement of placements ?? []) {
      if (
        !statusByStudent.has(placement.siswa_id) &&
        placement.pengajuan
      ) {
        statusByStudent.set(
          placement.siswa_id,
          placement.pengajuan.status,
        );
      }
    }
  }

  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      nis: row.nis,
      kelas: row.kelas,
      aktif: row.pengguna?.aktif ?? row.aktif,
      nama: row.pengguna?.nama_lengkap ?? "Tanpa nama",
      username: row.pengguna?.username ?? "—",
      pengajuanStatus: statusByStudent.get(row.id) ?? null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    kelasOptions,
  };
}

export const getSiswaDetail = cache(
  async (id: string): Promise<SiswaDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("siswa")
      .select(
        "id, nis, nisn, kelas, telepon, alamat, nama_orangtua, telepon_orangtua, jurusan_id, aktif, pengguna:pengguna_id(id, nama_lengkap, username, email, aktif), jurusan:jurusan_id(id, nama)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data siswa.");
    }

    if (!data || !data.pengguna) {
      return null;
    }

    const [pengajuanResult, jurnalResult] = await Promise.all([
      admin
        .from("pengajuan_anggota")
        .select(
          "pengajuan:pengajuan_id(id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama), periode:periode_id(nama))",
        )
        .eq("siswa_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("jurnal")
        .select("id, tanggal, kegiatan, status")
        .eq("siswa_id", data.id)
        .order("tanggal", { ascending: false })
        .limit(3),
    ]);

    if (pengajuanResult.error || jurnalResult.error) {
      throw new Error("Gagal memuat riwayat siswa.");
    }

    return {
      id: data.id,
      nis: data.nis,
      nisn: data.nisn,
      kelas: data.kelas,
      telepon: data.telepon,
      alamat: data.alamat,
      nama_orangtua: data.nama_orangtua,
      telepon_orangtua: data.telepon_orangtua,
      jurusan_id: data.jurusan_id,
      pengguna: data.pengguna,
      jurusan: data.jurusan,
      pengajuan: pengajuanResult.data?.pengajuan ?? null,
      jurnal: jurnalResult.data ?? [],
    };
  },
);

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
