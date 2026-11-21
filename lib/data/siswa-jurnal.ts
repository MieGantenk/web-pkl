import { cache } from "react";
import { connection } from "next/server";
import { endOfMonth, format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { jakartaToday } from "@/lib/date";
import {
  statusJurnal,
  type StatusJurnal,
  type StatusVerifikasi,
} from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export const SISWA_JURNAL_PAGE_SIZE = 10;

export type SiswaJurnalFilters = {
  q: string;
  status: StatusJurnal | "";
  bulan: string;
  page: number;
};

export type SiswaJurnalListItem = {
  id: string;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  kegiatan: string;
  status: StatusJurnal;
  perusahaan: string | null;
  periode: string | null;
};

export type SiswaJurnalSummary = {
  total: number;
  final: number;
  revisi: number;
  hariIni: {
    id: string;
    tanggal: string;
    status: StatusJurnal;
  } | null;
};

export type SiswaJurnalListResult = {
  rows: SiswaJurnalListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  siswa: {
    id: string;
    nis: string;
    kelas: string | null;
    jurusan: string | null;
  } | null;
  summary: SiswaJurnalSummary;
  statusOptions: Array<{ value: StatusJurnal; label: string }>;
  monthOptions: Array<{ value: string; label: string }>;
};

export type SiswaJurnalVerification = {
  peran: "guru" | "instruktur";
  status: StatusVerifikasi;
  catatan: string | null;
  verifikator: string | null;
  updatedAt: string;
};

export type SiswaJurnalDetail = SiswaJurnalListItem & {
  deskripsi: string | null;
  fotoUrl: string | null;
  verifikasi: SiswaJurnalVerification[];
};

type SiswaJurnalBase = {
  today: string;
  siswa: SiswaJurnalListResult["siswa"];
  summary: SiswaJurnalSummary;
  statusOptions: Array<{ value: StatusJurnal; label: string }>;
  monthOptions: Array<{ value: string; label: string }>;
};

const listSelect =
  "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, status, pengajuan:pengajuan_id(perusahaan:perusahaan_id(nama), periode:periode_id(nama))";

const detailSelect =
  "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, status, foto_path, pengajuan:pengajuan_id(perusahaan:perusahaan_id(nama), periode:periode_id(nama))";

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

function isMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function normalizeMonthFilter(value: string) {
  return isMonth(value) ? value : "";
}

function monthLabel(value: string) {
  return format(parseISO(`${value}-01`), "MMMM yyyy", { locale: localeId });
}

function statusOptions() {
  return (
    Object.entries(statusJurnal) as Array<
      [StatusJurnal, (typeof statusJurnal)[StatusJurnal]]
    >
  ).map(([value, meta]) => ({ value, label: meta.label }));
}

function mapListRow(row: {
  id: string;
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  kegiatan: string;
  status: StatusJurnal;
  pengajuan: {
    perusahaan: { nama: string } | null;
    periode: { nama: string } | null;
  } | null;
}): SiswaJurnalListItem {
  return {
    id: row.id,
    tanggal: row.tanggal,
    waktuMulai: row.waktu_mulai,
    waktuSelesai: row.waktu_selesai,
    kegiatan: row.kegiatan,
    status: row.status,
    perusahaan: row.pengajuan?.perusahaan?.nama ?? null,
    periode: row.pengajuan?.periode?.nama ?? null,
  };
}

const getSiswaJurnalBase = cache(
  async (penggunaId: string): Promise<SiswaJurnalBase> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const options = statusOptions();
    const emptySummary: SiswaJurnalSummary = {
      total: 0,
      final: 0,
      revisi: 0,
      hariIni: null,
    };

    const { data: siswa, error: siswaError } = await supabase
      .from("siswa")
      .select("id, nis, kelas, jurusan:jurusan_id(nama)")
      .eq("pengguna_id", penggunaId)
      .eq("aktif", true)
      .maybeSingle();

    if (siswaError) {
      throw new Error("Gagal memuat profil siswa.");
    }

    if (!siswa) {
      return {
        today,
        siswa: null,
        summary: emptySummary,
        statusOptions: options,
        monthOptions: [
          { value: today.slice(0, 7), label: monthLabel(today.slice(0, 7)) },
        ],
      };
    }

    const { data: journals, error: journalsError } = await supabase
      .from("jurnal")
      .select("id, tanggal, status")
      .eq("siswa_id", siswa.id)
      .order("tanggal", { ascending: false });

    if (journalsError) {
      throw new Error("Gagal memuat ringkasan jurnal.");
    }

    const rows = journals ?? [];
    const months = new Set(rows.map((journal) => journal.tanggal.slice(0, 7)));
    months.add(today.slice(0, 7));

    return {
      today,
      siswa: {
        id: siswa.id,
        nis: siswa.nis,
        kelas: siswa.kelas,
        jurusan: siswa.jurusan?.nama ?? null,
      },
      summary: {
        total: rows.length,
        final: rows.filter(
          (journal) => journal.status === "terverifikasi_instruktur",
        ).length,
        revisi: rows.filter((journal) => journal.status === "revisi").length,
        hariIni:
          rows.find((journal) => journal.tanggal === today) ?? null,
      },
      statusOptions: options,
      monthOptions: Array.from(months)
        .sort((a, b) => b.localeCompare(a))
        .map((value) => ({ value, label: monthLabel(value) })),
    };
  },
);

export async function getSiswaJurnalList(
  penggunaId: string,
  filters: SiswaJurnalFilters,
): Promise<SiswaJurnalListResult> {
  await connection();

  const base = await getSiswaJurnalBase(penggunaId);
  const page = Math.max(1, filters.page || 1);
  const pageSize = SISWA_JURNAL_PAGE_SIZE;

  function emptyResult(): SiswaJurnalListResult {
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
      siswa: base.siswa,
      summary: base.summary,
      statusOptions: base.statusOptions,
      monthOptions: base.monthOptions,
    };
  }

  if (!base.siswa) {
    return emptyResult();
  }

  const supabase = await createClient();
  const term = cleanSearch(filters.q);
  const bulan = normalizeMonthFilter(filters.bulan);
  let query = supabase
    .from("jurnal")
    .select(listSelect, { count: "exact" })
    .eq("siswa_id", base.siswa.id)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (bulan) {
    const start = `${bulan}-01`;
    const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");
    query = query.gte("tanggal", start).lte("tanggal", end);
  }

  if (term) {
    query = query.or(
      `kegiatan.ilike.%${term}%,deskripsi.ilike.%${term}%`,
    );
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
    siswa: base.siswa,
    summary: base.summary,
    statusOptions: base.statusOptions,
    monthOptions: base.monthOptions,
  };
}

export const getSiswaJurnalDetail = cache(
  async (
    penggunaId: string,
    id: string,
  ): Promise<SiswaJurnalDetail | null> => {
    await connection();

    const supabase = await createClient();
    const { data: siswa, error: siswaError } = await supabase
      .from("siswa")
      .select("id")
      .eq("pengguna_id", penggunaId)
      .eq("aktif", true)
      .maybeSingle();

    if (siswaError) {
      throw new Error("Gagal memuat profil siswa.");
    }

    if (!siswa) {
      return null;
    }

    const [journalResult, verificationResult] = await Promise.all([
      supabase
        .from("jurnal")
        .select(detailSelect)
        .eq("id", id)
        .eq("siswa_id", siswa.id)
        .maybeSingle(),
      supabase
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
      const { data } = await supabase.storage
        .from("jurnal")
        .createSignedUrl(row.foto_path, 60 * 60);
      fotoUrl = data?.signedUrl ?? null;
    }

    return {
      ...mapListRow(row),
      deskripsi: row.deskripsi,
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
