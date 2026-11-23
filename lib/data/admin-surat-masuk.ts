import { cache } from "react";
import { connection } from "next/server";

import {
  statusVerifikasi,
  type StatusVerifikasi,
} from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const SURAT_MASUK_PAGE_SIZE = 10;

export const jenisDokumenList = [
  "izin_orang_tua_ttd",
  "surat_balasan_perusahaan",
  "surat_pernyataan",
  "dokumen_pendukung",
  "lainnya",
] as const;

export type JenisDokumen = (typeof jenisDokumenList)[number];

export const jenisDokumenLabel: Record<JenisDokumen, string> = {
  izin_orang_tua_ttd: "Izin orang tua bertanda tangan",
  surat_balasan_perusahaan: "Surat balasan perusahaan",
  surat_pernyataan: "Surat pernyataan",
  dokumen_pendukung: "Dokumen pendukung",
  lainnya: "Dokumen lain",
};

export type SuratMasukStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
};

export type SuratMasukRow = {
  id: string;
  jenis: JenisDokumen;
  fileName: string | null;
  mimeType: string | null;
  ukuran: number | null;
  status: StatusVerifikasi;
  catatan: string | null;
  diunggahPada: string;
  fileUrl: string | null;
  pengajuanId: string;
  perusahaan: string | null;
  periode: string | null;
  students: SuratMasukStudent[];
};

export type SuratMasukListResult = {
  rows: SuratMasukRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function resolveDokumenSearch(
  admin: ReturnType<typeof createAdminClient>,
  term: string,
) {
  const [users, studentsByNis, companies] = await Promise.all([
    admin
      .from("pengguna")
      .select("id")
      .eq("peran", "siswa")
      .or(`nama_lengkap.ilike.%${term}%,username.ilike.%${term}%`),
    admin.from("siswa").select("id").ilike("nis", `%${term}%`),
    admin.from("perusahaan").select("id").ilike("nama", `%${term}%`),
  ]);

  if (users.error || studentsByNis.error || companies.error) {
    throw new Error("Gagal mencari surat masuk.");
  }

  const studentIds = new Set(
    (studentsByNis.data ?? []).map((row) => row.id),
  );
  const userIds = (users.data ?? []).map((row) => row.id);

  if (userIds.length) {
    const { data, error } = await admin
      .from("siswa")
      .select("id")
      .in("pengguna_id", userIds);

    if (error) {
      throw new Error("Gagal mencari siswa.");
    }

    for (const row of data ?? []) {
      studentIds.add(row.id);
    }
  }

  const applicationIds = new Set<string>();

  if (studentIds.size) {
    const { data, error } = await admin
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .in("siswa_id", Array.from(studentIds));

    if (error) {
      throw new Error("Gagal mencari pengajuan.");
    }

    for (const row of data ?? []) {
      applicationIds.add(row.pengajuan_id);
    }
  }

  const companyIds = (companies.data ?? []).map((row) => row.id);

  if (companyIds.length) {
    const { data, error } = await admin
      .from("pengajuan_pkl")
      .select("id")
      .in("perusahaan_id", companyIds);

    if (error) {
      throw new Error("Gagal mencari pengajuan.");
    }

    for (const row of data ?? []) {
      applicationIds.add(row.id);
    }
  }

  const [byFile, byApplication] = await Promise.all([
    admin
      .from("dokumen")
      .select("id")
      .ilike("file_name", `%${term}%`)
      .limit(1000),
    applicationIds.size
      ? admin
          .from("dokumen")
          .select("id")
          .in("pengajuan_id", Array.from(applicationIds))
          .limit(1000)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byFile.error || byApplication.error) {
    throw new Error("Gagal mencari surat masuk.");
  }

  return Array.from(
    new Set([
      ...(byFile.data ?? []).map((row) => row.id),
      ...(byApplication.data ?? []).map((row) => row.id),
    ]),
  );
}

async function getStudentsByApplication(applicationIds: string[]) {
  if (!applicationIds.length) {
    return new Map<string, SuratMasukStudent[]>();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pengajuan_anggota")
    .select(
      "pengajuan_id, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap))",
    )
    .in("pengajuan_id", applicationIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat siswa pengajuan.");
  }

  const byApplication = new Map<string, SuratMasukStudent[]>();

  for (const member of data ?? []) {
    const siswa = member.siswa;

    if (!siswa) continue;

    const list = byApplication.get(member.pengajuan_id) ?? [];
    list.push({
      id: siswa.id,
      nama: siswa.pengguna?.nama_lengkap ?? "Siswa",
      nis: siswa.nis,
      kelas: siswa.kelas,
    });
    byApplication.set(member.pengajuan_id, list);
  }

  return byApplication;
}

export const getSuratMasukList = cache(
  async (params: {
    q: string;
    jenis: string;
    status: string;
    page: number;
  }): Promise<SuratMasukListResult> => {
    await connection();

    const admin = createAdminClient();
    let page = Math.max(1, params.page || 1);
    const pageSize = SURAT_MASUK_PAGE_SIZE;
    const term = cleanSearch(params.q);
    const jenis = jenisDokumenList.includes(params.jenis as JenisDokumen)
      ? (params.jenis as JenisDokumen)
      : "";
    const status = Object.hasOwn(statusVerifikasi, params.status)
      ? (params.status as StatusVerifikasi)
      : "";

    let ids: string[] | null = null;

    if (term) {
      ids = await resolveDokumenSearch(admin, term);

      if (!ids.length) {
        return {
          rows: [],
          total: 0,
          page,
          pageSize,
          pageCount: 1,
        };
      }
    }

    function documentsQuery(targetPage: number) {
      let query = admin
        .from("dokumen")
        .select(
          "id, jenis, file_name, mime_type, ukuran, status, catatan, diunggah_pada, file_path, pengajuan_id, pengajuan:pengajuan_id(id, perusahaan:perusahaan_id(nama), periode:periode_id(nama))",
          { count: "exact" },
        )
        .order("diunggah_pada", { ascending: false })
        .range(
          (targetPage - 1) * pageSize,
          targetPage * pageSize - 1,
        );

      if (jenis) query = query.eq("jenis", jenis);
      if (status) query = query.eq("status", status);
      if (ids) query = query.in("id", ids);

      return query;
    }

    let result = await documentsQuery(page);

    if (result.error && page > 1) {
      page = 1;
      result = await documentsQuery(page);
    }

    if (result.error) {
      throw new Error("Gagal memuat surat dari siswa.");
    }

    const rows = result.data ?? [];
    const applicationIds = Array.from(
      new Set(rows.map((row) => row.pengajuan_id)),
    );
    const studentsByApplication =
      await getStudentsByApplication(applicationIds);

    const mapped = await Promise.all(
      rows.map(async (row) => {
        let fileUrl: string | null = null;

        if (row.file_path) {
          const { data } = await admin.storage
            .from("dokumen")
            .createSignedUrl(row.file_path, 60 * 60);
          fileUrl = data?.signedUrl ?? null;
        }

        return {
          id: row.id,
          jenis: row.jenis,
          fileName: row.file_name,
          mimeType: row.mime_type,
          ukuran: row.ukuran,
          status: row.status,
          catatan: row.catatan,
          diunggahPada: row.diunggah_pada,
          fileUrl,
          pengajuanId: row.pengajuan_id,
          perusahaan: row.pengajuan?.perusahaan?.nama ?? null,
          periode: row.pengajuan?.periode?.nama ?? null,
          students: studentsByApplication.get(row.pengajuan_id) ?? [],
        } satisfies SuratMasukRow;
      }),
    );

    const total = result.count ?? 0;

    return {
      rows: mapped,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },
);
