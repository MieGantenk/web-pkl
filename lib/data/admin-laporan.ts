import { connection } from "next/server";

import type { StatusPengajuan } from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const LAPORAN_PAGE_SIZE = 15;

const REPORT_STATUSES: StatusPengajuan[] = [
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
  "selesai",
];

export type LaporanFilters = {
  periode: string;
  perusahaan: string;
  kelas: string;
  q: string;
  page: number;
};

export type LaporanRow = {
  key: string;
  pengajuanId: string;
  siswaId: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: string | null;
  perusahaanId: string | null;
  perusahaan: string | null;
  kota: string | null;
  periodeId: string | null;
  periode: string | null;
  status: StatusPengajuan;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  jurnal: number;
  jurnalTerakhir: string | null;
};

export type LaporanBreakdown = {
  id: string;
  label: string;
  sublabel?: string;
  siswa: number;
  jurnal: number;
};

export type LaporanReport = {
  rows: LaporanRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: {
    siswa: number;
    perusahaan: number;
    jurnal: number;
    surat: number;
  };
  perusahaanBreakdown: LaporanBreakdown[];
  kelasBreakdown: LaporanBreakdown[];
  periodeOptions: Array<{
    id: string;
    nama: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    aktif: boolean;
  }>;
  perusahaanOptions: Array<{
    id: string;
    nama: string;
    kota: string | null;
  }>;
  kelasOptions: string[];
};

type AppRow = {
  id: string;
  status: StatusPengajuan;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  perusahaan: { id: string; nama: string; kota: string | null } | null;
  periode: { id: string; nama: string } | null;
};

type MemberRow = {
  pengajuan_id: string;
  siswa: {
    id: string;
    nis: string;
    kelas: string | null;
    pengguna: { nama_lengkap: string } | null;
    jurusan: { nama: string } | null;
  } | null;
};

type ReportData = Omit<LaporanReport, "rows" | "total" | "pageCount"> & {
  allRows: LaporanRow[];
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function loadLaporan(filters: LaporanFilters): Promise<ReportData> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page || 1);
  const pageSize = LAPORAN_PAGE_SIZE;
  const term = cleanSearch(filters.q).toLowerCase();

  let appsQuery = admin
    .from("pengajuan_pkl")
    .select(
      "id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(id, nama, kota), periode:periode_id(id, nama)",
    )
    .in("status", REPORT_STATUSES)
    .order("created_at", { ascending: false });

  if (filters.periode) {
    appsQuery = appsQuery.eq("periode_id", filters.periode);
  }

  if (filters.perusahaan) {
    appsQuery = appsQuery.eq("perusahaan_id", filters.perusahaan);
  }

  const [appsRes, periodsRes, companiesRes, classesRes] = await Promise.all([
    appsQuery,
    admin
      .from("periode_pkl")
      .select("id, nama, tanggal_mulai, tanggal_selesai, aktif")
      .order("tanggal_mulai", { ascending: false }),
    admin.from("perusahaan").select("id, nama, kota").order("nama"),
    admin.from("siswa").select("kelas").eq("aktif", true),
  ]);

  if (
    appsRes.error ||
    periodsRes.error ||
    companiesRes.error ||
    classesRes.error
  ) {
    throw new Error("Gagal memuat opsi laporan.");
  }

  const periodeOptions = periodsRes.data ?? [];
  const perusahaanOptions = companiesRes.data ?? [];
  const kelasOptions = Array.from(
    new Set(
      (classesRes.data ?? [])
        .map((row) => row.kelas)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const apps = (appsRes.data ?? []) as AppRow[];
  const appIds = apps.map((app) => app.id);
  let members: MemberRow[] = [];

  if (appIds.length) {
    const { data, error } = await admin
      .from("pengajuan_anggota")
      .select(
        "pengajuan_id, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama))",
      )
      .in("pengajuan_id", appIds);

    if (error) {
      throw new Error("Gagal memuat anggota PKL.");
    }

    members = (data ?? []) as MemberRow[];
  }

  const appMap = new Map(apps.map((app) => [app.id, app]));
  const allRows: LaporanRow[] = [];
  const seen = new Set<string>();

  for (const member of members) {
    if (!member.siswa) {
      continue;
    }

    const app = appMap.get(member.pengajuan_id);

    if (!app) {
      continue;
    }

    const student = member.siswa;
    const nama = student.pengguna?.nama_lengkap ?? "Siswa";

    if (term) {
      const haystack = `${nama} ${student.nis}`.toLowerCase();

      if (!haystack.includes(term)) {
        continue;
      }
    }

    if (filters.kelas && student.kelas !== filters.kelas) {
      continue;
    }

    const key = `${app.id}:${student.id}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    allRows.push({
      key,
      pengajuanId: app.id,
      siswaId: student.id,
      nama,
      nis: student.nis,
      kelas: student.kelas,
      jurusan: student.jurusan?.nama ?? null,
      perusahaanId: app.perusahaan?.id ?? null,
      perusahaan: app.perusahaan?.nama ?? null,
      kota: app.perusahaan?.kota ?? null,
      periodeId: app.periode?.id ?? null,
      periode: app.periode?.nama ?? null,
      status: app.status,
      tanggalMulai: app.tanggal_mulai,
      tanggalSelesai: app.tanggal_selesai,
      jurnal: 0,
      jurnalTerakhir: null,
    });
  }

  const filteredAppIds = Array.from(
    new Set(allRows.map((row) => row.pengajuanId)),
  );
  const journalByKey = new Map<
    string,
    { total: number; last: string | null }
  >();
  let surat = 0;

  if (filteredAppIds.length) {
    const [journalRes, suratRes] = await Promise.all([
      admin
        .from("jurnal")
        .select("pengajuan_id, siswa_id, tanggal")
        .in("pengajuan_id", filteredAppIds),
      admin
        .from("surat")
        .select("id", { count: "exact", head: true })
        .in("pengajuan_id", filteredAppIds)
        .eq("status", "terbit"),
    ]);

    if (journalRes.error || suratRes.error) {
      throw new Error("Gagal memuat rekap jurnal dan surat.");
    }

    for (const journal of journalRes.data ?? []) {
      if (!journal.pengajuan_id) {
        continue;
      }

      const key = `${journal.pengajuan_id}:${journal.siswa_id}`;
      const current = journalByKey.get(key) ?? { total: 0, last: null };

      current.total += 1;

      if (!current.last || journal.tanggal > current.last) {
        current.last = journal.tanggal;
      }

      journalByKey.set(key, current);
    }

    surat = suratRes.count ?? 0;
  }

  for (const row of allRows) {
    const journal = journalByKey.get(row.key);
    row.jurnal = journal?.total ?? 0;
    row.jurnalTerakhir = journal?.last ?? null;
  }

  allRows.sort(
    (a, b) =>
      (a.kelas ?? "").localeCompare(b.kelas ?? "", "id") ||
      a.nama.localeCompare(b.nama, "id"),
  );

  const uniqueStudents = new Set(allRows.map((row) => row.siswaId));
  const uniqueCompanies = new Set(
    allRows.map((row) => row.perusahaanId ?? "tanpa"),
  );
  const totalJurnal = allRows.reduce((total, row) => total + row.jurnal, 0);

  const perusahaanMap = new Map<
    string,
    { label: string; sublabel?: string; students: Set<string>; jurnal: number }
  >();
  const kelasMap = new Map<
    string,
    { label: string; students: Set<string>; jurnal: number }
  >();

  for (const row of allRows) {
    const companyKey = row.perusahaanId ?? "tanpa";
    const company = perusahaanMap.get(companyKey) ?? {
      label: row.perusahaan ?? "Tanpa perusahaan",
      sublabel: row.kota ?? undefined,
      students: new Set<string>(),
      jurnal: 0,
    };

    company.students.add(row.siswaId);
    company.jurnal += row.jurnal;
    perusahaanMap.set(companyKey, company);

    const classKey = row.kelas ?? "tanpa";
    const kelas = kelasMap.get(classKey) ?? {
      label: row.kelas ?? "Tanpa kelas",
      students: new Set<string>(),
      jurnal: 0,
    };

    kelas.students.add(row.siswaId);
    kelas.jurnal += row.jurnal;
    kelasMap.set(classKey, kelas);
  }

  const perusahaanBreakdown = Array.from(perusahaanMap.entries())
    .map(([id, item]) => ({
      id,
      label: item.label,
      sublabel: item.sublabel,
      siswa: item.students.size,
      jurnal: item.jurnal,
    }))
    .sort(
      (a, b) =>
        b.siswa - a.siswa || a.label.localeCompare(b.label, "id"),
    );

  const kelasBreakdown = Array.from(kelasMap.entries())
    .map(([id, item]) => ({
      id,
      label: item.label,
      siswa: item.students.size,
      jurnal: item.jurnal,
    }))
    .sort(
      (a, b) =>
        b.siswa - a.siswa || a.label.localeCompare(b.label, "id"),
    );

  return {
    allRows,
    summary: {
      siswa: uniqueStudents.size,
      perusahaan: uniqueCompanies.size,
      jurnal: totalJurnal,
      surat,
    },
    perusahaanBreakdown,
    kelasBreakdown,
    periodeOptions,
    perusahaanOptions,
    kelasOptions,
    page,
    pageSize,
  };
}

export async function getLaporanReport(
  filters: LaporanFilters,
): Promise<LaporanReport> {
  await connection();

  const data = await loadLaporan(filters);
  const { allRows, ...meta } = data;
  const total = allRows.length;
  const pageCount = Math.max(1, Math.ceil(total / data.pageSize));
  const page = Math.min(Math.max(1, data.page), pageCount);
  const from = (page - 1) * data.pageSize;

  return {
    ...meta,
    rows: allRows.slice(from, from + data.pageSize),
    total,
    page,
    pageCount,
  };
}

export async function getLaporanExportRows(
  filters: LaporanFilters,
): Promise<LaporanRow[]> {
  const data = await loadLaporan(filters);
  return data.allRows;
}
