import { cache } from "react";
import { connection } from "next/server";

import {
  statusJurnal,
  type StatusJurnal,
  type StatusVerifikasi,
} from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { postgresUuidPattern } from "@/lib/validators/common";

export const JURNAL_PAGE_SIZE = 10;

export type JurnalFilters = {
  q: string;
  status: StatusJurnal | "";
  kelas: string;
  guru: string;
  dari: string;
  sampai: string;
  page: number;
};

export type JurnalListItem = {
  id: string;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  kegiatan: string;
  status: StatusJurnal;
  siswa: {
    id: string;
    nama: string;
    nis: string;
    kelas: string | null;
    jurusan: string | null;
  };
  perusahaan: string | null;
  periode: string | null;
};

export type JurnalListResult = {
  rows: JurnalListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  statusOptions: Array<{ value: StatusJurnal; label: string }>;
  kelasOptions: string[];
  guruOptions: Array<{ id: string; nama: string }>;
};

export type JurnalVerification = {
  peran: "guru" | "instruktur";
  status: StatusVerifikasi;
  catatan: string | null;
  verifikator: string | null;
  updatedAt: string;
};

export type JurnalDetail = JurnalListItem & {
  deskripsi: string | null;
  guru: string | null;
  fotoUrl: string | null;
  verifikasi: JurnalVerification[];
};

const listSelect =
  "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, status, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama)), pengajuan:pengajuan_id(perusahaan:perusahaan_id(nama), periode:periode_id(nama))";

const detailSelect =
  "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, status, foto_path, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama)), pengajuan:pengajuan_id(perusahaan:perusahaan_id(nama), periode:periode_id(nama), guru:guru_pembimbing_id(pengguna:pengguna_id(nama_lengkap)))";

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export function normalizeDateFilter(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

function mapListRow(row: {
  id: string;
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  kegiatan: string;
  status: StatusJurnal;
  siswa: {
    id: string;
    nis: string;
    kelas: string | null;
    pengguna: { nama_lengkap: string } | null;
    jurusan: { nama: string } | null;
  } | null;
  pengajuan: {
    perusahaan: { nama: string } | null;
    periode: { nama: string } | null;
  } | null;
}): JurnalListItem {
  return {
    id: row.id,
    tanggal: row.tanggal,
    waktuMulai: row.waktu_mulai,
    waktuSelesai: row.waktu_selesai,
    kegiatan: row.kegiatan,
    status: row.status,
    siswa: {
      id: row.siswa?.id ?? "",
      nama: row.siswa?.pengguna?.nama_lengkap ?? "Siswa",
      nis: row.siswa?.nis ?? "—",
      kelas: row.siswa?.kelas ?? null,
      jurusan: row.siswa?.jurusan?.nama ?? null,
    },
    perusahaan: row.pengajuan?.perusahaan?.nama ?? null,
    periode: row.pengajuan?.periode?.nama ?? null,
  };
}

export async function getJurnalList(
  filters: JurnalFilters,
): Promise<JurnalListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, filters.page || 1);
  const pageSize = JURNAL_PAGE_SIZE;
  const term = cleanSearch(filters.q);
  const dari = normalizeDateFilter(filters.dari);
  const sampai = normalizeDateFilter(filters.sampai);
  const statusOptions = (
    Object.entries(statusJurnal) as Array<
      [StatusJurnal, (typeof statusJurnal)[StatusJurnal]]
    >
  ).map(([value, meta]) => ({ value, label: meta.label }));

  const [studentsResult, guruResult] = await Promise.all([
    admin
      .from("siswa")
      .select("id, nis, kelas, pengguna:pengguna_id(nama_lengkap)"),
    admin.from("guru").select("id, pengguna:pengguna_id(nama_lengkap)"),
  ]);

  if (studentsResult.error || guruResult.error) {
    throw new Error("Gagal memuat pilihan filter jurnal.");
  }

  const students = studentsResult.data ?? [];
  const kelasOptions = Array.from(
    new Set(
      students
        .map((student) => student.kelas)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const guruOptions = (guruResult.data ?? [])
    .filter((guru) => guru.pengguna?.nama_lengkap)
    .map((guru) => ({
      id: guru.id,
      nama: guru.pengguna?.nama_lengkap ?? "Tanpa nama",
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  function emptyResult(): JurnalListResult {
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
      statusOptions,
      kelasOptions,
      guruOptions,
    };
  }

  let matchedStudentIds: string[] | null = null;

  if (term) {
    const lowered = term.toLowerCase();
    matchedStudentIds = students
      .filter(
        (student) =>
          student.nis.toLowerCase().includes(lowered) ||
          (student.pengguna?.nama_lengkap ?? "").toLowerCase().includes(lowered),
      )
      .map((student) => student.id);

    if (!matchedStudentIds.length) {
      return emptyResult();
    }
  }

  if (filters.kelas) {
    const idsInKelas = new Set(
      students
        .filter((student) => student.kelas === filters.kelas)
        .map((student) => student.id),
    );

    matchedStudentIds = matchedStudentIds
      ? matchedStudentIds.filter((id) => idsInKelas.has(id))
      : Array.from(idsInKelas);

    if (!matchedStudentIds.length) {
      return emptyResult();
    }
  }

  let matchedPengajuanIds: string[] | null = null;

  if (filters.guru && postgresUuidPattern.test(filters.guru)) {
    const { data, error } = await admin
      .from("pengajuan_pkl")
      .select("id")
      .eq("guru_pembimbing_id", filters.guru);

    if (error) {
      throw new Error("Gagal memuat penempatan guru.");
    }

    matchedPengajuanIds = (data ?? []).map((application) => application.id);

    if (!matchedPengajuanIds.length) {
      return emptyResult();
    }
  }

  let query = admin
    .from("jurnal")
    .select(listSelect, { count: "exact" })
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (matchedStudentIds) {
    query = query.in("siswa_id", matchedStudentIds);
  }

  if (matchedPengajuanIds) {
    query = query.in("pengajuan_id", matchedPengajuanIds);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (dari) {
    query = query.gte("tanggal", dari);
  }

  if (sampai) {
    query = query.lte("tanggal", sampai);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat jurnal.");
  }

  const total = count ?? 0;

  return {
    rows: (data ?? []).map((row) => mapListRow(row)),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    statusOptions,
    kelasOptions,
    guruOptions,
  };
}

export const getJurnalDetail = cache(
  async (id: string): Promise<JurnalDetail | null> => {
    await connection();

    const admin = createAdminClient();
    const [journalResult, verificationResult] = await Promise.all([
      admin
        .from("jurnal")
        .select(detailSelect)
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("verifikasi_jurnal")
        .select(
          "peran, status, catatan, updated_at, verifikator:verifikator_id(nama_lengkap)",
        )
        .eq("jurnal_id", id)
        .order("updated_at", { ascending: true }),
    ]);

    if (journalResult.error || verificationResult.error) {
      throw new Error("Gagal memuat detail jurnal.");
    }

    const row = journalResult.data;

    if (!row) {
      return null;
    }

    let fotoUrl: string | null = null;

    if (row.foto_path) {
      const { data } = await admin.storage
        .from("jurnal")
        .createSignedUrl(row.foto_path, 60 * 60);
      fotoUrl = data?.signedUrl ?? null;
    }

    return {
      ...mapListRow(row),
      deskripsi: row.deskripsi,
      guru:
        row.pengajuan?.guru?.pengguna?.nama_lengkap ??
        null,
      fotoUrl,
      verifikasi: (verificationResult.data ?? []).map((verification) => ({
        peran: verification.peran,
        status: verification.status,
        catatan: verification.catatan,
        verifikator: verification.verifikator?.nama_lengkap ?? null,
        updatedAt: verification.updated_at,
      })),
    };
  },
);
