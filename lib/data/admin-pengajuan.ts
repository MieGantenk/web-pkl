import { cache } from "react";
import { connection } from "next/server";

import type {
  JenisSurat,
  StatusPengajuan,
  StatusSurat,
  StatusVerifikasi,
} from "@/lib/status";
import { statusPengajuan } from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const PENGAJUAN_PAGE_SIZE = 10;

const STATUS_KEYS = Object.keys(statusPengajuan) as StatusPengajuan[];

export type PengajuanQueueItem = {
  id: string;
  status: StatusPengajuan;
  createdAt: string;
  studentName: string;
  companyName: string | null;
  companyKota: string | null;
  periodName: string | null;
  memberCount: number;
};

export type PengajuanAdminMember = {
  id: string;
  siswaId: string;
  nama: string;
  nis: string;
  kelas: string | null;
  peran: "ketua" | "anggota";
};

export type PengajuanAdminDokumen = {
  id: string;
  jenis:
    | "izin_orang_tua_ttd"
    | "surat_balasan_perusahaan"
    | "surat_pernyataan"
    | "dokumen_pendukung"
    | "lainnya";
  fileName: string | null;
  mimeType: string | null;
  ukuran: number | null;
  status: StatusVerifikasi;
  catatan: string | null;
  diunggahPada: string;
  fileUrl: string | null;
};

export type PengajuanAdminSurat = {
  id: string;
  jenis: JenisSurat;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
  fileUrl: string | null;
};

export type PengajuanAdminDetail = {
  id: string;
  status: StatusPengajuan;
  alasanPenolakan: string | null;
  catatan: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  createdAt: string;
  dibuatOleh: string;
  student: {
    nama: string;
    username: string;
    nis: string | null;
    kelas: string | null;
    jurusan: string | null;
  } | null;
  perusahaan: { id: string; nama: string; kota: string | null } | null;
  periode: { id: string; nama: string; tahun_ajaran: string } | null;
  members: PengajuanAdminMember[];
  dokumen: PengajuanAdminDokumen[];
  surat: PengajuanAdminSurat[];
};

export type AdminPengajuanQueue = {
  items: PengajuanQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  pendingIzin: number;
  pendingBalasan: number;
  selected: PengajuanAdminDetail | null;
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function getSearchApplicationIds(admin: ReturnType<typeof createAdminClient>, term: string) {
  const [studentUsers, studentsByNis, companies] = await Promise.all([
    admin
      .from("pengguna")
      .select("id")
      .eq("peran", "siswa")
      .or(`nama_lengkap.ilike.%${term}%,username.ilike.%${term}%`),
    admin.from("siswa").select("pengguna_id").ilike("nis", `%${term}%`),
    admin.from("perusahaan").select("id").ilike("nama", `%${term}%`),
  ]);

  if (
    studentUsers.error ||
    studentsByNis.error ||
    companies.error
  ) {
    throw new Error("Gagal mencari pengajuan.");
  }

  const creatorIds = Array.from(
    new Set([
      ...(studentUsers.data ?? []).map((row) => row.id),
      ...(studentsByNis.data ?? []).map((row) => row.pengguna_id),
    ]),
  );
  const companyIds = (companies.data ?? []).map((row) => row.id);

  const [byCreator, byCompany] = await Promise.all([
    creatorIds.length
      ? admin
          .from("pengajuan_pkl")
          .select("id")
          .in("dibuat_oleh", creatorIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? admin
          .from("pengajuan_pkl")
          .select("id")
          .in("perusahaan_id", companyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byCreator.error || byCompany.error) {
    throw new Error("Gagal mencari pengajuan.");
  }

  return Array.from(
    new Set([
      ...(byCreator.data ?? []).map((row) => row.id),
      ...(byCompany.data ?? []).map((row) => row.id),
    ]),
  );
}

export const getAdminPengajuanQueue = cache(
  async (params: {
    q: string;
    status: string;
    page: number;
    selectedId: string;
  }): Promise<AdminPengajuanQueue> => {
    await connection();

    const admin = createAdminClient();
    const page = Math.max(1, params.page || 1);
    const term = cleanSearch(params.q);
    const pageSize = PENGAJUAN_PAGE_SIZE;
    const statusFilter = STATUS_KEYS.includes(params.status as StatusPengajuan)
      ? (params.status as StatusPengajuan)
      : params.status === "tindakan"
        ? "tindakan"
        : "";

    const searchPromise = term
      ? getSearchApplicationIds(admin, term)
      : Promise.resolve(null);

    const [searchIds, izinCountResult, balasanCountResult] = await Promise.all([
      searchPromise,
      admin
        .from("pengajuan_pkl")
        .select("id", { count: "exact", head: true })
        .eq("status", "izin_ortu_diunggah"),
      admin
        .from("pengajuan_pkl")
        .select("id", { count: "exact", head: true })
        .eq("status", "balasan_diunggah"),
    ]);

    if (izinCountResult.error || balasanCountResult.error) {
      throw new Error("Gagal memuat antrean pengajuan.");
    }

    let query = admin
      .from("pengajuan_pkl")
      .select(
        "id, status, created_at, dibuat_oleh, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (searchIds) {
      if (!searchIds.length) {
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          pageCount: 1,
          pendingIzin: izinCountResult.count ?? 0,
          pendingBalasan: balasanCountResult.count ?? 0,
          selected: params.selectedId
            ? await getAdminPengajuanDetail(params.selectedId)
            : null,
        };
      }

      query = query.in("id", searchIds);
    }

    if (statusFilter === "tindakan") {
      query = query.in("status", ["izin_ortu_diunggah", "balasan_diunggah"]);
    } else if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error("Gagal memuat data pengajuan.");
    }

    const rows = data ?? [];
    const ids = rows.map((row) => row.id);
    const creatorIds = Array.from(
      new Set(rows.map((row) => row.dibuat_oleh)),
    );
    const [creatorResult, memberResult] = await Promise.all([
      creatorIds.length
        ? admin
            .from("pengguna")
            .select("id, nama_lengkap")
            .in("id", creatorIds)
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? admin
            .from("pengajuan_anggota")
            .select("pengajuan_id")
            .in("pengajuan_id", ids)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (creatorResult.error || memberResult.error) {
      throw new Error("Gagal memuat peserta pengajuan.");
    }

    const creatorName = new Map(
      (creatorResult.data ?? []).map((row) => [row.id, row.nama_lengkap]),
    );
    const memberCount = new Map<string, number>();

    for (const member of memberResult.data ?? []) {
      memberCount.set(
        member.pengajuan_id,
        (memberCount.get(member.pengajuan_id) ?? 0) + 1,
      );
    }

    const total = count ?? 0;
    const selected = params.selectedId
      ? await getAdminPengajuanDetail(params.selectedId)
      : null;

    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        studentName: creatorName.get(row.dibuat_oleh) ?? "Tanpa nama",
        companyName: row.perusahaan?.nama ?? null,
        companyKota: row.perusahaan?.kota ?? null,
        periodName: row.periode?.nama ?? null,
        memberCount: memberCount.get(row.id) ?? 0,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      pendingIzin: izinCountResult.count ?? 0,
      pendingBalasan: balasanCountResult.count ?? 0,
      selected,
    };
  },
);

async function getAdminPengajuanDetail(
  pengajuanId: string,
): Promise<PengajuanAdminDetail | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pengajuan_pkl")
    .select(
      "id, status, alasan_penolakan, catatan, tanggal_mulai, tanggal_selesai, created_at, dibuat_oleh, perusahaan:perusahaan_id(id, nama, kota), periode:periode_id(id, nama, tahun_ajaran)",
    )
    .eq("id", pengajuanId)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat detail pengajuan.");
  }

  if (!data) {
    return null;
  }

  const [creatorResult, studentResult, memberResult, documentResult, letterResult] =
    await Promise.all([
      admin
        .from("pengguna")
        .select("nama_lengkap, username")
        .eq("id", data.dibuat_oleh)
        .maybeSingle(),
      admin
        .from("siswa")
        .select("nis, kelas, jurusan:jurusan_id(nama)")
        .eq("pengguna_id", data.dibuat_oleh)
        .maybeSingle(),
      admin
        .from("pengajuan_anggota")
        .select(
          "id, siswa_id, peran, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap))",
        )
        .eq("pengajuan_id", data.id)
        .order("created_at", { ascending: true }),
      admin
        .from("dokumen")
        .select(
          "id, jenis, file_name, mime_type, ukuran, status, catatan, diunggah_pada, file_path",
        )
        .eq("pengajuan_id", data.id)
        .order("diunggah_pada", { ascending: false }),
      admin
        .from("surat")
        .select("id, jenis, nomor, tanggal_terbit, status, file_path")
        .eq("pengajuan_id", data.id)
        .order("created_at", { ascending: false }),
    ]);

  if (
    creatorResult.error ||
    studentResult.error ||
    memberResult.error ||
    documentResult.error ||
    letterResult.error
  ) {
    throw new Error("Gagal memuat detail pengajuan.");
  }

  const documents = await Promise.all(
    (documentResult.data ?? []).map(async (document) => {
      let fileUrl: string | null = null;

      if (document.file_path) {
        const { data: signed } = await admin.storage
          .from("dokumen")
          .createSignedUrl(document.file_path, 60 * 60);
        fileUrl = signed?.signedUrl ?? null;
      }

      return {
        id: document.id,
        jenis: document.jenis,
        fileName: document.file_name,
        mimeType: document.mime_type,
        ukuran: document.ukuran,
        status: document.status,
        catatan: document.catatan,
        diunggahPada: document.diunggah_pada,
        fileUrl,
      };
    }),
  );

  const letters = await Promise.all(
    (letterResult.data ?? []).map(async (letter) => {
      let fileUrl: string | null = null;

      if (letter.file_path) {
        const { data: signed } = await admin.storage
          .from("surat")
          .createSignedUrl(letter.file_path, 60 * 60);
        fileUrl = signed?.signedUrl ?? null;
      }

      return {
        id: letter.id,
        jenis: letter.jenis,
        nomor: letter.nomor,
        tanggalTerbit: letter.tanggal_terbit,
        status: letter.status,
        fileUrl,
      };
    }),
  );

  return {
    id: data.id,
    status: data.status,
    alasanPenolakan: data.alasan_penolakan,
    catatan: data.catatan,
    tanggalMulai: data.tanggal_mulai,
    tanggalSelesai: data.tanggal_selesai,
    createdAt: data.created_at,
    dibuatOleh: data.dibuat_oleh,
    student: creatorResult.data
      ? {
          nama: creatorResult.data.nama_lengkap,
          username: creatorResult.data.username,
          nis: studentResult.data?.nis ?? null,
          kelas: studentResult.data?.kelas ?? null,
          jurusan: studentResult.data?.jurusan?.nama ?? null,
        }
      : null,
    perusahaan: data.perusahaan,
    periode: data.periode,
    members: (memberResult.data ?? []).map((member) => ({
      id: member.id,
      siswaId: member.siswa_id,
      nama: member.siswa?.pengguna?.nama_lengkap ?? "Tanpa nama",
      nis: member.siswa?.nis ?? "—",
      kelas: member.siswa?.kelas ?? null,
      peran: member.peran,
    })),
    dokumen: documents,
    surat: letters,
  };
}
