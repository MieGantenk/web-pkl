import { cache } from "react";
import { connection } from "next/server";
import { endOfMonth, format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { jakartaToday } from "@/lib/date";
import {
  statusJurnal,
  type KehadiranJurnal,
  type StatusJurnal,
  type StatusVerifikasi,
} from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

import { normalizeMonthFilter } from "./siswa-jurnal";

export const ORTU_JURNAL_PAGE_SIZE = 10;

export type OrtuJurnalChild = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
  hubungan: "ayah" | "ibu" | "wali";
};

export type OrtuJurnalVerification = {
  peran: "guru" | "instruktur";
  status: StatusVerifikasi;
  catatan: string | null;
  verifikator: string | null;
  updatedAt: string;
};

export type OrtuJurnalRow = {
  id: string;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  kegiatan: string;
  kehadiran: KehadiranJurnal;
  deskripsi: string | null;
  status: StatusJurnal;
  fotoUrl: string | null;
  perusahaan: string | null;
  periode: string | null;
  verifikasi: OrtuJurnalVerification[];
};

export type OrtuJurnalStatusOption = {
  value: StatusJurnal;
  label: string;
  count: number;
};

export type OrtuJurnalData = {
  children: OrtuJurnalChild[];
  activeChild: OrtuJurnalChild | null;
  rows: OrtuJurnalRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: {
    total: number;
    final: number;
    revisi: number;
  };
  statusOptions: OrtuJurnalStatusOption[];
  monthOptions: Array<{ value: string; label: string }>;
};

type OrtuJurnalFilters = {
  anak?: string;
  q: string;
  status: StatusJurnal | "";
  bulan: string;
  page: number;
};

const listSelect =
  "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, kehadiran, deskripsi, status, foto_path, pengajuan:pengajuan_id(perusahaan:perusahaan_id(nama), periode:periode_id(nama))";

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

function monthLabel(value: string) {
  return format(parseISO(`${value}-01`), "MMMM yyyy", { locale: localeId });
}

function statusOptions(): OrtuJurnalStatusOption[] {
  return (
    Object.entries(statusJurnal) as Array<
      [StatusJurnal, (typeof statusJurnal)[StatusJurnal]]
    >
  ).map(([value, meta]) => ({
    value,
    label: meta.label,
    count: 0,
  }));
}

export const getOrtuJurnalData = cache(
  async (
    penggunaId: string,
    filters: OrtuJurnalFilters,
  ): Promise<OrtuJurnalData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    let page = Math.max(1, filters.page || 1);
    const pageSize = ORTU_JURNAL_PAGE_SIZE;
    const options = statusOptions();
    const emptySummary = { total: 0, final: 0, revisi: 0 };

    const { data: links, error: linksError } = await supabase
      .from("orang_tua_siswa")
      .select("siswa_id, hubungan")
      .eq("pengguna_id", penggunaId)
      .order("created_at", { ascending: true });

    if (linksError) {
      throw new Error("Gagal memuat data anak.");
    }

    const childIds = (links ?? []).map((link) => link.siswa_id);
    let childRows: Array<{
      id: string;
      nis: string;
      kelas: string | null;
      jurusan: { nama: string } | null;
      pengguna: { nama_lengkap: string } | null;
    }> = [];

    if (childIds.length) {
      const { data, error } = await supabase
        .from("siswa")
        .select(
          "id, nis, kelas, jurusan:jurusan_id(nama), pengguna:pengguna_id(nama_lengkap)",
        )
        .in("id", childIds)
        .eq("aktif", true);

      if (error) {
        throw new Error("Gagal memuat profil anak.");
      }

      childRows = data ?? [];
    }

    const childById = new Map(childRows.map((child) => [child.id, child]));
    const children = (links ?? []).flatMap((link) => {
      const child = childById.get(link.siswa_id);

      if (!child) {
        return [];
      }

      return [
        {
          id: child.id,
          nama: child.pengguna?.nama_lengkap ?? "Siswa",
          nis: child.nis,
          kelas: child.kelas,
          jurusan: child.jurusan,
          hubungan: link.hubungan,
        },
      ];
    });

    const activeChild =
      children.find((child) => child.id === filters.anak) ??
      children[0] ??
      null;

    if (!activeChild) {
      return {
        children,
        activeChild: null,
        rows: [],
        total: 0,
        page: 1,
        pageSize,
        pageCount: 1,
        summary: emptySummary,
        statusOptions: options,
        monthOptions: [
          {
            value: today.slice(0, 7),
            label: monthLabel(today.slice(0, 7)),
          },
        ],
      };
    }

    const { data: allJournals, error: journalsError } = await supabase
      .from("jurnal")
      .select("id, tanggal, status")
      .eq("siswa_id", activeChild.id)
      .order("tanggal", { ascending: false });

    if (journalsError) {
      throw new Error("Gagal memuat ringkasan jurnal.");
    }

    const journalRows = allJournals ?? [];
    const counts = journalRows.reduce(
      (result, journal) => {
        result[journal.status] += 1;
        return result;
      },
      {
        menunggu: 0,
        terverifikasi_guru: 0,
        terverifikasi_instruktur: 0,
        revisi: 0,
      } as Record<StatusJurnal, number>,
    );
    const months = new Set(
      journalRows.map((journal) => journal.tanggal.slice(0, 7)),
    );
    months.add(today.slice(0, 7));

    page = Math.min(
      page,
      Math.max(1, Math.ceil(journalRows.length / pageSize)),
    );

    const term = cleanSearch(filters.q);
    const bulan = normalizeMonthFilter(filters.bulan);

    function journalsQuery(targetPage: number) {
      let query = supabase
        .from("jurnal")
        .select(listSelect, { count: "exact" })
        .eq("siswa_id", activeChild.id)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .range(
          (targetPage - 1) * pageSize,
          targetPage * pageSize - 1,
        );

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

      return query;
    }

    let result = await journalsQuery(page);

    if (result.error && page > 1) {
      page = 1;
      result = await journalsQuery(page);
    }

    const { data: listRows, count, error: listError } = result;

    if (listError) {
      throw new Error("Gagal memuat jurnal.");
    }

    const rows = listRows ?? [];
    const journalIds = rows.map((journal) => journal.id);
    let verifications: Array<{
      jurnal_id: string;
      peran: "guru" | "instruktur";
      status: StatusVerifikasi;
      catatan: string | null;
      updated_at: string;
      verifikator: { nama_lengkap: string } | null;
    }> = [];

    if (journalIds.length) {
      const { data, error } = await supabase
        .from("verifikasi_jurnal")
        .select(
          "jurnal_id, peran, status, catatan, updated_at, verifikator:verifikator_id(nama_lengkap)",
        )
        .in("jurnal_id", journalIds)
        .order("updated_at", { ascending: true });

      if (error) {
        throw new Error("Gagal memuat verifikasi jurnal.");
      }

      verifications = data ?? [];
    }

    const verificationByJournal = new Map<
      string,
      OrtuJurnalVerification[]
    >();

    for (const verification of verifications) {
      const list = verificationByJournal.get(verification.jurnal_id) ?? [];

      list.push({
        peran: verification.peran,
        status: verification.status,
        catatan: verification.catatan,
        verifikator: verification.verifikator?.nama_lengkap ?? null,
        updatedAt: verification.updated_at,
      });
      verificationByJournal.set(verification.jurnal_id, list);
    }

    const dataRows: OrtuJurnalRow[] = await Promise.all(
      rows.map(async (journal) => {
        let fotoUrl: string | null = null;

        if (journal.foto_path) {
          const { data } = await supabase.storage
            .from("jurnal")
            .createSignedUrl(journal.foto_path, 60 * 60);
          fotoUrl = data?.signedUrl ?? null;
        }

        return {
          id: journal.id,
          tanggal: journal.tanggal,
          waktuMulai: journal.waktu_mulai,
          waktuSelesai: journal.waktu_selesai,
          kegiatan: journal.kegiatan,
          kehadiran: journal.kehadiran,
          deskripsi: journal.deskripsi,
          status: journal.status,
          fotoUrl,
          perusahaan: journal.pengajuan?.perusahaan?.nama ?? null,
          periode: journal.pengajuan?.periode?.nama ?? null,
          verifikasi: verificationByJournal.get(journal.id) ?? [],
        };
      }),
    );

    const total = count ?? 0;

    return {
      children,
      activeChild,
      rows: dataRows,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      summary: {
        total: journalRows.length,
        final: counts.terverifikasi_instruktur,
        revisi: counts.revisi,
      },
      statusOptions: options.map((option) => ({
        ...option,
        count: counts[option.value],
      })),
      monthOptions: Array.from(months)
        .sort((a, b) => b.localeCompare(a))
        .map((value) => ({ value, label: monthLabel(value) })),
    };
  },
);
