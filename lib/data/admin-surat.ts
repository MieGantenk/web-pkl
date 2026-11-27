import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import {
  jenisSuratList,
  type JenisSurat,
  type StatusPengajuan,
  type StatusSurat,
} from "@/lib/status";
import {
  canIssueSuratForApplication,
  emptySuratRequirementState,
  suratEligibleStatuses,
  type SuratRequirementState,
} from "@/lib/surat";
import { createAdminClient } from "@/lib/supabase/admin";

export const SURAT_PAGE_SIZE = 10;

export type SuratStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
};

export type SuratListItem = {
  id: string;
  jenis: JenisSurat;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
  pengajuanId: string;
  applicationStatus: StatusPengajuan | null;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  students: SuratStudent[];
  hasFile: boolean;
};

export type SuratListResult = {
  rows: SuratListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type SuratIssueOption = {
  pengajuanId: string;
  status: StatusPengajuan;
  tanggalSelesai: string | null;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  students: SuratStudent[];
  existingSurat: { id: string; nomor: string | null } | null;
  documents: SuratRequirementState;
};

export type SuratUploadLetter = {
  id: string;
  nomor: string | null;
  hasFile: boolean;
};

export type SuratUploadOption = {
  pengajuanId: string;
  status: StatusPengajuan;
  tanggalSelesai: string | null;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  students: SuratStudent[];
  letters: Partial<Record<JenisSurat, SuratUploadLetter>>;
  documents: SuratRequirementState;
};

export type SuratKelengkapanCell = {
  jenis: JenisSurat;
  state: "terbit" | "siap" | "terkunci";
  surat: SuratUploadLetter | null;
  reason: string | null;
};

export type SuratKelengkapanRow = {
  pengajuanId: string;
  status: StatusPengajuan;
  tanggalSelesai: string | null;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  students: SuratStudent[];
  documents: SuratRequirementState;
  cells: Record<JenisSurat, SuratKelengkapanCell>;
};

export type SuratKelengkapanData = {
  rows: SuratKelengkapanRow[];
  total: number;
};

export type SuratPdfData = {
  surat: {
    id: string;
    jenis: JenisSurat;
    nomor: string | null;
    tanggalTerbit: string | null;
    status: StatusSurat;
    filePath: string | null;
  };
  application: {
    id: string;
    status: StatusPengajuan;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
    perusahaan: {
      nama: string;
      alamat: string;
      kota: string | null;
    } | null;
    periode: { nama: string } | null;
    guru: string | null;
    instruktur: string | null;
  };
  students: SuratStudent[];
  school: {
    nama: string;
    alamat: string;
    telepon: string | null;
    email: string | null;
    website: string | null;
    kepala: string;
    niy: string;
    akreditasi: string | null;
    kopDataUrl: string | null;
    footerDataUrl: string | null;
  };
};

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

function formatPrincipalName(value: string | null | undefined) {
  const name = value?.trim() || "H. Agus Nur Purwanto, S.T., Gr.";
  const degree = name.replace(/\s*,?\s*Gr\.?$/i, "");

  if (/^H\.\s*Agus Nur Purwanto,\s*S\.T\.?$/i.test(degree)) {
    return `${degree}, Gr.`;
  }

  return name;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

async function resolveSuratSearch(term: string) {
  const admin = createAdminClient();

  const [nomorRes, perusahaanRes, penggunaRes, nisRes] =
    await Promise.all([
      admin
        .from("surat")
        .select("id")
        .ilike("nomor", `%${term}%`)
        .limit(200),
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

  if (
    nomorRes.error ||
    perusahaanRes.error ||
    penggunaRes.error ||
    nisRes.error
  ) {
    throw new Error("Gagal mencari surat.");
  }

  const studentIds = new Set((nisRes.data ?? []).map((row) => row.id));
  const userIds = (penggunaRes.data ?? []).map((row) => row.id);

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
      .in("siswa_id", Array.from(studentIds))
      .limit(1000);

    if (error) {
      throw new Error("Gagal mencari pengajuan.");
    }

    for (const row of data ?? []) {
      applicationIds.add(row.pengajuan_id);
    }
  }

  const companyIds = (perusahaanRes.data ?? []).map((row) => row.id);

  if (companyIds.length) {
    const { data, error } = await admin
      .from("pengajuan_pkl")
      .select("id")
      .in("perusahaan_id", companyIds)
      .limit(500);

    if (error) {
      throw new Error("Gagal mencari perusahaan.");
    }

    for (const row of data ?? []) {
      applicationIds.add(row.id);
    }
  }

  const suratIds = new Set((nomorRes.data ?? []).map((row) => row.id));

  if (applicationIds.size) {
    const { data, error } = await admin
      .from("surat")
      .select("id")
      .in("pengajuan_id", Array.from(applicationIds))
      .limit(1000);

    if (error) {
      throw new Error("Gagal mencari surat.");
    }

    for (const row of data ?? []) {
      suratIds.add(row.id);
    }
  }

  return Array.from(suratIds);
}

async function getMembers(applicationIds: string[]) {
  if (!applicationIds.length) {
    return new Map<string, SuratStudent[]>();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pengajuan_anggota")
    .select(
      "pengajuan_id, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama))",
    )
    .in("pengajuan_id", applicationIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat siswa pada surat.");
  }

  const byApplication = new Map<string, SuratStudent[]>();

  for (const member of data ?? []) {
    const siswa = member.siswa;

    if (!siswa) continue;

    const list = byApplication.get(member.pengajuan_id) ?? [];
    list.push({
      id: siswa.id,
      nama: siswa.pengguna?.nama_lengkap ?? "Siswa",
      nis: siswa.nis,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan,
    });
    byApplication.set(member.pengajuan_id, list);
  }

  return byApplication;
}

async function getDocumentStates(applicationIds: string[]) {
  const byApplication = new Map<string, SuratRequirementState>();

  if (!applicationIds.length) {
    return byApplication;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dokumen")
    .select("pengajuan_id, jenis, status, file_path")
    .in("pengajuan_id", applicationIds)
    .in("jenis", ["izin_orang_tua_ttd", "surat_balasan_perusahaan"]);

  if (error) {
    throw new Error("Gagal memuat verifikasi dokumen pengajuan.");
  }

  for (const applicationId of applicationIds) {
    const documents = (data ?? []).filter(
      (document) => document.pengajuan_id === applicationId,
    );

    byApplication.set(applicationId, {
      izinVerified: documents.some(
        (document) =>
          document.jenis === "izin_orang_tua_ttd" &&
          document.status === "diterima" &&
          Boolean(document.file_path),
      ),
      balasanVerified: documents.some(
        (document) =>
          document.jenis === "surat_balasan_perusahaan" &&
          document.status === "diterima" &&
          Boolean(document.file_path),
      ),
    });
  }

  return byApplication;
}

function suratLockedReason(
  jenis: JenisSurat,
  status: StatusPengajuan,
  documents: SuratRequirementState,
  schedule: { tanggalSelesai: string | null; today: string },
) {
  if (jenis === "pengajuan" && status === "izin_ortu_diunggah") {
    return documents.izinVerified
      ? null
      : "Menunggu verifikasi izin orang tua bertanda tangan.";
  }

  if (jenis === "keberangkatan" && status === "diterima") {
    return documents.balasanVerified
      ? null
      : "Menunggu persetujuan surat balasan perusahaan.";
  }

  if (jenis === "penarikan") {
    if (!schedule.tanggalSelesai) {
      return "Tanggal selesai PKL belum diisi.";
    }

    if (schedule.tanggalSelesai > schedule.today) {
      return `Surat penarikan dapat diterbitkan setelah ${schedule.tanggalSelesai}.`;
    }
  }

  return null;
}

export async function getSuratList(params: {
  q: string;
  jenis: string;
  status: string;
  page: number;
}): Promise<SuratListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const term = cleanSearch(params.q);
  const pageSize = SURAT_PAGE_SIZE;
  const jenis = jenisSuratList.includes(params.jenis as JenisSurat)
    ? (params.jenis as JenisSurat)
    : "";
  const status =
    params.status === "terbit" ||
    params.status === "draft" ||
    params.status === "dibatalkan"
      ? params.status
      : "";

  let ids: string[] | null = null;

  if (term) {
    ids = await resolveSuratSearch(term);

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

  let query = admin
    .from("surat")
    .select(
      "id, jenis, nomor, tanggal_terbit, status, file_path, pengajuan_id, pengajuan:pengajuan_id(id, status, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama))",
      { count: "exact" },
    )
    .order("tanggal_terbit", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (jenis) query = query.eq("jenis", jenis);
  if (status) query = query.eq("status", status);
  if (ids) query = query.in("id", ids);

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat daftar surat.");
  }

  const rows = data ?? [];
  const members = await getMembers(
    unique(rows.map((row) => row.pengajuan_id)),
  );
  const total = count ?? 0;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      jenis: row.jenis,
      nomor: row.nomor,
      tanggalTerbit: row.tanggal_terbit,
      status: row.status,
      pengajuanId: row.pengajuan_id,
      applicationStatus: row.pengajuan?.status ?? null,
      perusahaan: row.pengajuan?.perusahaan ?? null,
      periode: row.pengajuan?.periode ?? null,
      students: members.get(row.pengajuan_id) ?? [],
      hasFile: Boolean(row.file_path),
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getSuratIssueOptions = cache(
  async (jenis: JenisSurat): Promise<SuratIssueOption[]> => {
    await connection();

    const admin = createAdminClient();
    const { data: applications, error } = await admin
      .from("pengajuan_pkl")
      .select(
        "id, status, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
      )
      .in("status", suratEligibleStatuses[jenis])
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error("Gagal memuat pengajuan yang dapat diterbitkan surat.");
    }

    const rows = applications ?? [];
    const applicationIds = rows.map((row) => row.id);
    const [members, existingRes, documentStates] = await Promise.all([
      getMembers(applicationIds),
      applicationIds.length
        ? admin
            .from("surat")
            .select("id, nomor, pengajuan_id")
            .eq("jenis", jenis)
            .in("pengajuan_id", applicationIds)
        : Promise.resolve({ data: [], error: null }),
      getDocumentStates(applicationIds),
    ]);

    if (existingRes.error) {
      throw new Error("Gagal memeriksa surat yang sudah terbit.");
    }

    const existingByApplication = new Map(
      (existingRes.data ?? []).map((row) => [
        row.pengajuan_id,
        { id: row.id, nomor: row.nomor },
      ]),
    );

    return rows
      .map((row) => {
        const documents =
          documentStates.get(row.id) ?? emptySuratRequirementState;

        return {
          pengajuanId: row.id,
          status: row.status,
          tanggalSelesai: row.tanggal_selesai,
          perusahaan: row.perusahaan,
          periode: row.periode,
          students: members.get(row.id) ?? [],
          existingSurat: existingByApplication.get(row.id) ?? null,
          documents,
        };
      })
      .filter((row) =>
        canIssueSuratForApplication(jenis, row.status, row.documents, {
          tanggalSelesai: row.tanggalSelesai,
          today: jakartaToday(),
        }),
      );
  },
);

export const getSuratUploadOptions = cache(
  async (): Promise<SuratUploadOption[]> => {
    await connection();

    const admin = createAdminClient();
    const statuses = Array.from(
      new Set(Object.values(suratEligibleStatuses).flat()),
    );
    const { data, error } = await admin
      .from("pengajuan_pkl")
      .select(
        "id, status, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
      )
      .in("status", statuses)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error("Gagal memuat pilihan pengajuan surat.");
    }

    const rows = data ?? [];
    const applicationIds = rows.map((row) => row.id);
    const [members, lettersResult, documentStates] = await Promise.all([
      getMembers(applicationIds),
      applicationIds.length
        ? admin
            .from("surat")
            .select("id, jenis, nomor, file_path, pengajuan_id")
            .in("pengajuan_id", applicationIds)
        : Promise.resolve({ data: [], error: null }),
      getDocumentStates(applicationIds),
    ]);

    if (lettersResult.error) {
      throw new Error("Gagal memuat surat yang sudah terbit.");
    }

    const lettersByApplication = new Map<
      string,
      Partial<Record<JenisSurat, SuratUploadLetter>>
    >();

    for (const letter of lettersResult.data ?? []) {
      const letters =
        lettersByApplication.get(letter.pengajuan_id) ?? {};
      letters[letter.jenis] = {
        id: letter.id,
        nomor: letter.nomor,
        hasFile: Boolean(letter.file_path),
      };
      lettersByApplication.set(letter.pengajuan_id, letters);
    }

    return rows.map((row) => ({
      pengajuanId: row.id,
      status: row.status,
      tanggalSelesai: row.tanggal_selesai,
      perusahaan: row.perusahaan,
      periode: row.periode,
      students: members.get(row.id) ?? [],
      letters: lettersByApplication.get(row.id) ?? {},
      documents:
        documentStates.get(row.id) ?? emptySuratRequirementState,
    }));
  },
);

export const getSuratKelengkapan = cache(
  async (params: {
    q: string;
    status: string;
  }): Promise<SuratKelengkapanData> => {
    await connection();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pengajuan_pkl")
      .select(
        "id, status, tanggal_selesai, created_at, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error("Gagal memuat kelengkapan surat.");
    }

    const applications = data ?? [];
    const applicationIds = applications.map((row) => row.id);
    const [members, lettersResult, documentStates] = await Promise.all([
      getMembers(applicationIds),
      applicationIds.length
        ? admin
            .from("surat")
            .select("id, jenis, nomor, file_path, pengajuan_id")
            .in("pengajuan_id", applicationIds)
        : Promise.resolve({ data: [], error: null }),
      getDocumentStates(applicationIds),
    ]);

    if (lettersResult.error) {
      throw new Error("Gagal memuat surat yang sudah terbit.");
    }

    const lettersByApplication = new Map<
      string,
      Partial<Record<JenisSurat, SuratUploadLetter>>
    >();

    for (const letter of lettersResult.data ?? []) {
      const letters =
        lettersByApplication.get(letter.pengajuan_id) ?? {};
      letters[letter.jenis] = {
        id: letter.id,
        nomor: letter.nomor,
        hasFile: Boolean(letter.file_path),
      };
      lettersByApplication.set(letter.pengajuan_id, letters);
    }

    const term = params.q.trim().toLowerCase();
    const rows = applications
      .map((application): SuratKelengkapanRow => {
        const students = members.get(application.id) ?? [];
        const letters = lettersByApplication.get(application.id) ?? {};
        const documents =
          documentStates.get(application.id) ??
          emptySuratRequirementState;
        const cells = Object.fromEntries(
          jenisSuratList.map((jenis) => {
            const surat = letters[jenis] ?? null;
            const issueable = canIssueSuratForApplication(
              jenis,
              application.status,
              documents,
              {
                tanggalSelesai: application.tanggal_selesai,
                today: jakartaToday(),
              },
            );
            const state = surat
              ? "terbit"
              : issueable
                ? "siap"
                : "terkunci";
            const reason = surat || issueable
              ? null
              : (suratLockedReason(
                  jenis,
                  application.status,
                  documents,
                  {
                    tanggalSelesai: application.tanggal_selesai,
                    today: jakartaToday(),
                  },
                ) ?? "Belum tersedia pada status pengajuan ini.");

            return [
              jenis,
              {
                jenis,
                state,
                surat,
                reason,
              } satisfies SuratKelengkapanCell,
            ];
          }),
        ) as Record<JenisSurat, SuratKelengkapanCell>;

        return {
          pengajuanId: application.id,
          status: application.status,
          tanggalSelesai: application.tanggal_selesai,
          perusahaan: application.perusahaan,
          periode: application.periode,
          students,
          documents,
          cells,
        };
      })
      .filter((row) => {
        const matchesStatus =
          !params.status || row.status === params.status;
        const haystack = [
          ...row.students.map((student) => student.nama),
          ...row.students.map((student) => student.nis),
          row.perusahaan?.nama ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return matchesStatus && (!term || haystack.includes(term));
      });

    return { rows, total: rows.length };
  },
);

async function imageDataUrl(path: string | null) {
  if (!path) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("sekolah").download(path);

  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const mime = data.type || "image/png";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function getSuratPdfData(
  id: string,
): Promise<SuratPdfData | null> {
  const admin = createAdminClient();
    const [suratRes, settingsRes] = await Promise.all([
      admin
        .from("surat")
        .select(
          "id, jenis, nomor, tanggal_terbit, status, file_path, pengajuan_id, pengajuan:pengajuan_id(id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama, alamat, kota), periode:periode_id(nama), guru:guru_pembimbing_id(pengguna:pengguna_id(nama_lengkap)), instruktur:instruktur_id(pengguna:pengguna_id(nama_lengkap)))",
        )
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("pengaturan_sekolah")
        .select(
          "nama_sekolah, alamat, telepon, email, website, kepala_sekolah, nip_kepala, akreditasi, kop_path, footer_path",
        )
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (suratRes.error || settingsRes.error) {
      throw new Error("Gagal memuat data surat.");
    }

    const surat = suratRes.data;
    const application = surat?.pengajuan;

    if (!surat || !application) return null;

    const members = await getMembers([surat.pengajuan_id]);
    const settings = settingsRes.data;
    const [kopDataUrl, footerDataUrl] = await Promise.all([
      imageDataUrl(settings?.kop_path ?? null),
      imageDataUrl(settings?.footer_path ?? null),
    ]);

    return {
      surat: {
        id: surat.id,
        jenis: surat.jenis,
        nomor: surat.nomor,
        tanggalTerbit: surat.tanggal_terbit,
        status: surat.status,
        filePath: surat.file_path,
      },
      application: {
        id: application.id,
        status: application.status,
        tanggalMulai: application.tanggal_mulai,
        tanggalSelesai: application.tanggal_selesai,
        perusahaan: application.perusahaan,
        periode: application.periode,
        guru: application.guru?.pengguna?.nama_lengkap ?? null,
        instruktur: application.instruktur?.pengguna?.nama_lengkap ?? null,
      },
      students: members.get(surat.pengajuan_id) ?? [],
      school: {
        nama: settings?.nama_sekolah ?? "SMK-IT As-Syifa Boarding School",
        alamat:
          settings?.alamat ??
          "KP. Kumpay, Kecamatan Jalancagak, Kabupaten Subang, Jawa Barat",
        telepon: settings?.telepon ?? null,
        email: settings?.email ?? null,
        website: settings?.website ?? null,
        kepala: formatPrincipalName(settings?.kepala_sekolah),
        niy: settings?.nip_kepala?.trim() || "200907840809056",
        akreditasi: settings?.akreditasi ?? null,
        kopDataUrl,
        footerDataUrl,
      },
    };
}

export function currentSuratYear() {
  return Number(jakartaToday().slice(0, 4));
}
