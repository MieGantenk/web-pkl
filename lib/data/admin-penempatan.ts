import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const PENEMPATAN_PAGE_SIZE = 10;

export const PENEMPATAN_STATUSES = [
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
] as const;

export type PenempatanStatus = (typeof PENEMPATAN_STATUSES)[number];

export function isPenempatanStatus(
  value: string,
): value is PenempatanStatus {
  return (PENEMPATAN_STATUSES as readonly string[]).includes(value);
}

export type PenempatanStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
};

export type PenempatanListItem = {
  id: string;
  status: PenempatanStatus;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  perusahaan: { id: string; nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  guru: string | null;
  instruktur: string | null;
  pembimbing: string | null;
  students: PenempatanStudent[];
};

export type PenempatanListResult = {
  rows: PenempatanListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PenempatanEditor = {
  application: {
    id: string;
    status: PenempatanStatus;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    guru_pembimbing_id: string | null;
    instruktur_id: string | null;
    pembimbing_id: string | null;
    perusahaan: {
      id: string;
      nama: string;
      kota: string | null;
      alamat: string;
      telepon: string | null;
    } | null;
    periode: {
      id: string;
      nama: string;
      tanggal_mulai: string;
      tanggal_selesai: string;
    } | null;
    students: PenempatanStudent[];
  };
  gurus: Array<{ id: string; nama: string }>;
  instrukturOptions: Array<{
    id: string;
    nama: string;
    peran: "instruktur" | "pembimbing";
  }>;
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function resolveSearch(term: string) {
  const admin = createAdminClient();

  const [perusahaanRes, penggunaRes, nisRes] = await Promise.all([
    admin
      .from("perusahaan")
      .select("id")
      .ilike("nama", `%${term}%`)
      .limit(200),
    admin
      .from("pengguna")
      .select("id")
      .eq("peran", "siswa")
      .ilike("nama_lengkap", `%${term}%`)
      .limit(200),
    admin.from("siswa").select("id").ilike("nis", `%${term}%`).limit(200),
  ]);

  if (perusahaanRes.error || penggunaRes.error || nisRes.error) {
    throw new Error("Gagal mencari data penempatan.");
  }

  const companyIds = (perusahaanRes.data ?? []).map((row) => row.id);
  const userIds = (penggunaRes.data ?? []).map((row) => row.id);
  const studentIds = new Set((nisRes.data ?? []).map((row) => row.id));

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

  let applicationIds: string[] = [];

  if (studentIds.size) {
    const { data, error } = await admin
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .in("siswa_id", Array.from(studentIds))
      .limit(1000);

    if (error) {
      throw new Error("Gagal mencari pengajuan siswa.");
    }

    applicationIds = Array.from(
      new Set((data ?? []).map((row) => row.pengajuan_id)),
    );
  }

  return { companyIds, applicationIds };
}

export async function getPenempatanList(params: {
  q: string;
  status: string;
  page: number;
}): Promise<PenempatanListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = PENEMPATAN_PAGE_SIZE;
  const status = isPenempatanStatus(params.status) ? params.status : "";

  let search: { companyIds: string[]; applicationIds: string[] } | null =
    null;

  if (term) {
    search = await resolveSearch(term);

    if (!search.companyIds.length && !search.applicationIds.length) {
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
    .from("pengajuan_pkl")
    .select(
      "id, status, tanggal_mulai, tanggal_selesai, created_at, perusahaan:perusahaan_id(id, nama, kota), periode:periode_id(nama), guru:guru_pembimbing_id(id, pengguna:pengguna_id(nama_lengkap)), instruktur:instruktur_id(id, pengguna:pengguna_id(nama_lengkap)), pembimbing:pembimbing_id(id, pengguna:pengguna_id(nama_lengkap))",
      { count: "exact" },
    )
    .in("status", [...PENEMPATAN_STATUSES])
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    if (search.applicationIds.length && search.companyIds.length) {
      query = query.or(
        `id.in.(${search.applicationIds.join(",")}),perusahaan_id.in.(${search.companyIds.join(",")})`,
      );
    } else if (search.applicationIds.length) {
      query = query.in("id", search.applicationIds);
    } else {
      query = query.in("perusahaan_id", search.companyIds);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat data penempatan.");
  }

  const rows = data ?? [];
  const applicationIds = rows.map((row) => row.id);
  const membersByApplication = new Map<string, PenempatanStudent[]>();

  if (applicationIds.length) {
    const { data: members, error: memberError } = await admin
      .from("pengajuan_anggota")
      .select(
        "pengajuan_id, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama))",
      )
      .in("pengajuan_id", applicationIds)
      .order("created_at", { ascending: true });

    if (memberError) {
      throw new Error("Gagal memuat siswa pada penempatan.");
    }

    for (const member of members ?? []) {
      const siswa = member.siswa;

      if (!siswa) {
        continue;
      }

      const list = membersByApplication.get(member.pengajuan_id) ?? [];
      list.push({
        id: siswa.id,
        nama: siswa.pengguna?.nama_lengkap ?? "Siswa",
        nis: siswa.nis,
        kelas: siswa.kelas,
        jurusan: siswa.jurusan,
      });
      membersByApplication.set(member.pengajuan_id, list);
    }
  }

  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status as PenempatanStatus,
      tanggal_mulai: row.tanggal_mulai,
      tanggal_selesai: row.tanggal_selesai,
      perusahaan: row.perusahaan,
      periode: row.periode,
      guru: row.guru?.pengguna?.nama_lengkap ?? null,
      instruktur: row.instruktur?.pengguna?.nama_lengkap ?? null,
      pembimbing: row.pembimbing?.pengguna?.nama_lengkap ?? null,
      students: membersByApplication.get(row.id) ?? [],
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getPenempatanEditor = cache(
  async (id: string): Promise<PenempatanEditor | null> => {
    await connection();

    const admin = createAdminClient();
    const { data: application, error } = await admin
      .from("pengajuan_pkl")
      .select(
        "id, status, tanggal_mulai, tanggal_selesai, guru_pembimbing_id, instruktur_id, pembimbing_id, perusahaan_id, perusahaan:perusahaan_id(id, nama, kota, alamat, telepon), periode:periode_id(id, nama, tanggal_mulai, tanggal_selesai)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data penempatan.");
    }

    if (!application || !isPenempatanStatus(application.status)) {
      return null;
    }

    const [membersRes, gurusRes, instrukturRes] = await Promise.all([
      admin
        .from("pengajuan_anggota")
        .select(
          "siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama))",
        )
        .eq("pengajuan_id", application.id)
        .order("created_at", { ascending: true }),
      admin
        .from("guru")
        .select("id, pengguna:pengguna_id(nama_lengkap, aktif)")
        .order("created_at", { ascending: true }),
      admin
        .from("instruktur")
        .select(
          "id, peran, pengguna:pengguna_id(nama_lengkap, aktif)",
        )
        .eq("perusahaan_id", application.perusahaan_id)
        .eq("aktif", true)
        .order("created_at", { ascending: true }),
    ]);

    if (membersRes.error || gurusRes.error || instrukturRes.error) {
      throw new Error("Gagal memuat pilihan penempatan.");
    }

    const students = (membersRes.data ?? []).flatMap((member) => {
      const siswa = member.siswa;

      if (!siswa) {
        return [];
      }

      return [
        {
          id: siswa.id,
          nama: siswa.pengguna?.nama_lengkap ?? "Siswa",
          nis: siswa.nis,
          kelas: siswa.kelas,
          jurusan: siswa.jurusan,
        },
      ];
    });

    return {
      application: {
        id: application.id,
        status: application.status,
        tanggal_mulai: application.tanggal_mulai,
        tanggal_selesai: application.tanggal_selesai,
        guru_pembimbing_id: application.guru_pembimbing_id,
        instruktur_id: application.instruktur_id,
        pembimbing_id: application.pembimbing_id,
        perusahaan: application.perusahaan,
        periode: application.periode,
        students,
      },
      gurus: (gurusRes.data ?? []).flatMap((guru) =>
        guru.pengguna?.aktif
          ? [
              {
                id: guru.id,
                nama: guru.pengguna.nama_lengkap,
              },
            ]
          : [],
      ),
      instrukturOptions: (instrukturRes.data ?? []).flatMap((assignment) =>
        assignment.pengguna?.aktif
          ? [
              {
                id: assignment.id,
                nama: assignment.pengguna.nama_lengkap,
                peran: assignment.peran,
              },
            ]
          : [],
      ),
    };
  },
);
