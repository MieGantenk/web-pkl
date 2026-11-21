import { cache } from "react";
import { connection } from "next/server";

import { getPeriodeKelas } from "@/lib/periode-kelas";
import { createAdminClient } from "@/lib/supabase/admin";

export const ORANG_TUA_PAGE_SIZE = 10;

export type PeriodeRef = {
  id: string;
  nama: string;
};

export type RelasiAnak = {
  id: string;
  hubungan: "ayah" | "ibu" | "wali";
  siswa: {
    id: string;
    nama: string;
    nis: string;
    kelas: string | null;
    aktif: boolean;
    periode: PeriodeRef | null;
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
  periode: PeriodeRef[];
};

export type OrangTuaPeriodeOption = {
  id: string;
  nama: string;
  tahun_ajaran: string;
  count: number;
};

export type OrangTuaListResult = {
  rows: OrangTuaListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  periodeOptions: OrangTuaPeriodeOption[];
};

export type OrangTuaDetail = OrangTuaListItem;

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

function uniquePeriods(anak: RelasiAnak[]) {
  const periods = new Map<string, PeriodeRef>();

  for (const relasi of anak) {
    if (relasi.siswa?.periode) {
      periods.set(relasi.siswa.periode.id, relasi.siswa.periode);
    }
  }

  return Array.from(periods.values());
}

export async function getOrangTuaList(params: {
  q: string;
  status: string;
  periode: string;
  page: number;
}): Promise<OrangTuaListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = ORANG_TUA_PAGE_SIZE;

  const [periodeResult, siswaResult, relasiResult] = await Promise.all([
    admin
      .from("periode_pkl")
      .select("id, nama, tahun_ajaran")
      .order("tanggal_mulai", { ascending: true }),
    admin
      .from("siswa")
      .select(
        "id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap)",
      ),
    admin
      .from("orang_tua_siswa")
      .select("id, pengguna_id, siswa_id, hubungan")
      .order("created_at", { ascending: true }),
  ]);

  if (periodeResult.error) {
    throw new Error("Gagal memuat pilihan periode.");
  }

  if (siswaResult.error) {
    throw new Error("Gagal memuat data siswa.");
  }

  if (relasiResult.error) {
    throw new Error("Gagal memuat relasi anak.");
  }

  const periodRows = periodeResult.data ?? [];
  const periodeByTahun = new Map(
    periodRows.map((periode) => [periode.tahun_ajaran, periode]),
  );
  const siswaById = new Map(
    (siswaResult.data ?? []).map((siswa) => [siswa.id, siswa]),
  );

  function periodeForKelas(kelas: string | null): PeriodeRef | null {
    const mapping = getPeriodeKelas(kelas);

    if (!mapping) {
      return null;
    }

    const periode = periodeByTahun.get(mapping.tahunAjaran);

    return periode ? { id: periode.id, nama: periode.nama } : null;
  }

  const anakByPengguna = new Map<string, RelasiAnak[]>();
  const parentIdsByPeriode = new Map<string, Set<string>>();

  for (const relation of relasiResult.data ?? []) {
    const siswa = siswaById.get(relation.siswa_id);
    const periode = siswa ? periodeForKelas(siswa.kelas) : null;

    if (periode) {
      const parents =
        parentIdsByPeriode.get(periode.id) ?? new Set<string>();
      parents.add(relation.pengguna_id);
      parentIdsByPeriode.set(periode.id, parents);
    }

    const anak = anakByPengguna.get(relation.pengguna_id) ?? [];

    anak.push({
      id: relation.id,
      hubungan: relation.hubungan,
      siswa: siswa
        ? {
            id: siswa.id,
            nama: siswa.pengguna?.nama_lengkap ?? "Tanpa nama",
            nis: siswa.nis,
            kelas: siswa.kelas,
            aktif: siswa.aktif,
            periode,
          }
        : null,
    });
    anakByPengguna.set(relation.pengguna_id, anak);
  }

  const periodeOptions: OrangTuaPeriodeOption[] = periodRows.map(
    (periode) => ({
      ...periode,
      count: parentIdsByPeriode.get(periode.id)?.size ?? 0,
    }),
  );

  function emptyResult(): OrangTuaListResult {
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
      periodeOptions,
    };
  }

  let selectedIds: string[] | null = null;

  if (params.periode) {
    const parents = parentIdsByPeriode.get(params.periode);

    if (!parents?.size) {
      return emptyResult();
    }

    selectedIds = Array.from(parents);
  }

  let query = admin
    .from("pengguna")
    .select("id, nama_lengkap, username, email, telepon, aktif", {
      count: "exact",
    })
    .eq("peran", "ortu")
    .order("nama_lengkap", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (selectedIds) {
    query = query.in("id", selectedIds);
  }

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

  const rows = (data ?? []).map((row) => {
    const anak = anakByPengguna.get(row.id) ?? [];

    return {
      id: row.id,
      nama: row.nama_lengkap,
      username: row.username,
      email: row.email,
      telepon: row.telepon,
      aktif: row.aktif,
      anak,
      periode: uniquePeriods(anak),
    };
  });

  const total = count ?? 0;

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    periodeOptions,
  };
}

export const getOrangTuaDetail = cache(
  async (penggunaId: string): Promise<OrangTuaDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const [dataResult, relationResult, periodeResult] = await Promise.all([
      admin
        .from("pengguna")
        .select(
          "id, nama_lengkap, username, email, telepon, aktif, peran",
        )
        .eq("id", penggunaId)
        .maybeSingle(),
      admin
        .from("orang_tua_siswa")
        .select(
          "id, hubungan, siswa:siswa_id(id, nis, kelas, aktif, pengguna:pengguna_id(nama_lengkap))",
        )
        .eq("pengguna_id", penggunaId)
        .order("created_at", { ascending: true }),
      admin
        .from("periode_pkl")
        .select("id, nama, tahun_ajaran")
        .order("tanggal_mulai", { ascending: true }),
    ]);

    if (
      dataResult.error ||
      relationResult.error ||
      periodeResult.error
    ) {
      throw new Error("Gagal memuat data orang tua.");
    }

    const data = dataResult.data;

    if (!data || data.peran !== "ortu") {
      return null;
    }

    const periodeByTahun = new Map(
      (periodeResult.data ?? []).map((periode) => [
        periode.tahun_ajaran,
        periode,
      ]),
    );

    function periodeForKelas(kelas: string | null): PeriodeRef | null {
      const mapping = getPeriodeKelas(kelas);

      if (!mapping) {
        return null;
      }

      const periode = periodeByTahun.get(mapping.tahunAjaran);

      return periode ? { id: periode.id, nama: periode.nama } : null;
    }

    const anak: RelasiAnak[] = (relationResult.data ?? []).map(
      (relation) => ({
        id: relation.id,
        hubungan: relation.hubungan,
        siswa: relation.siswa
          ? {
              id: relation.siswa.id,
              nama:
                relation.siswa.pengguna?.nama_lengkap ?? "Tanpa nama",
              nis: relation.siswa.nis,
              kelas: relation.siswa.kelas,
              aktif: relation.siswa.aktif,
              periode: periodeForKelas(relation.siswa.kelas),
            }
          : null,
      }),
    );

    return {
      id: data.id,
      nama: data.nama_lengkap,
      username: data.username,
      email: data.email,
      telepon: data.telepon,
      aktif: data.aktif,
      anak,
      periode: uniquePeriods(anak),
    };
  },
);
