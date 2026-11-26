import { cache } from "react";
import { connection } from "next/server";

import type {
  JenisSurat,
  StatusPengajuan,
  StatusSurat,
  StatusVerifikasi,
} from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const FINAL_STATUSES: StatusPengajuan[] = [
  "ditolak",
  "dibatalkan",
  "selesai",
];

export type PengajuanMember = {
  id: string;
  siswaId: string;
  nama: string;
  nis: string;
  kelas: string | null;
  peran: "ketua" | "anggota";
  isCurrent: boolean;
};

export type PengajuanDokumen = {
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

export type PengajuanSurat = {
  id: string;
  jenis: JenisSurat;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
};

export type PengajuanData = {
  id: string;
  status: StatusPengajuan;
  alasanPenolakan: string | null;
  catatan: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  createdAt: string;
  dibuatOleh: string;
  isOwner: boolean;
  peran: "ketua" | "anggota";
  perusahaan: { id: string; nama: string; kota: string | null } | null;
  periode: { id: string; nama: string; tahun_ajaran: string } | null;
  anggota: PengajuanMember[];
  dokumen: PengajuanDokumen[];
  surat: PengajuanSurat[];
};

export type PengajuanOptions = {
  perusahaan: Array<{ id: string; nama: string; kota: string | null }>;
  periode: Array<{
    id: string;
    nama: string;
    tahun_ajaran: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
  }>;
};

export type SiswaPengajuanData = {
  siswa: {
    id: string;
    nis: string;
    kelas: string | null;
    jurusan: { nama: string } | null;
  } | null;
  pengajuan: PengajuanData | null;
  options: PengajuanOptions;
};

async function getOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PengajuanOptions> {
  const [perusahaanRes, periodeRes] = await Promise.all([
    supabase
      .from("perusahaan")
      .select("id, nama, kota")
      .eq("aktif", true)
      .order("nama", { ascending: true }),
    supabase
      .from("periode_pkl")
      .select("id, nama, tahun_ajaran, tanggal_mulai, tanggal_selesai")
      .eq("aktif", true)
      .order("tanggal_mulai", { ascending: false }),
  ]);

  if (perusahaanRes.error || periodeRes.error) {
    throw new Error("Gagal memuat pilihan pengajuan.");
  }

  return {
    perusahaan: perusahaanRes.data ?? [],
    periode: periodeRes.data ?? [],
  };
}

export const getSiswaPengajuan = cache(
  async (penggunaId: string): Promise<SiswaPengajuanData> => {
    await connection();

    const supabase = await createClient();
    const options = await getOptions(supabase);

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
      return { siswa: null, pengajuan: null, options };
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan_id, peran, created_at")
      .eq("siswa_id", siswa.id)
      .order("created_at", { ascending: false });

    if (membershipError) {
      throw new Error("Gagal memuat pengajuan siswa.");
    }

    const membershipIds = Array.from(
      new Set((memberships ?? []).map((item) => item.pengajuan_id)),
    );

    if (!membershipIds.length) {
      return { siswa, pengajuan: null, options };
    }

    const { data: applications, error: applicationError } = await supabase
      .from("pengajuan_pkl")
      .select(
        "id, status, alasan_penolakan, catatan, tanggal_mulai, tanggal_selesai, created_at, dibuat_oleh, perusahaan:perusahaan_id(id, nama, kota), periode:periode_id(id, nama, tahun_ajaran)",
      )
      .in("id", membershipIds)
      .order("created_at", { ascending: false });

    if (applicationError) {
      throw new Error("Gagal memuat pengajuan PKL.");
    }

    const application =
      (applications ?? []).find(
        (item) => !FINAL_STATUSES.includes(item.status),
      ) ??
      applications?.[0] ??
      null;

    if (!application) {
      return { siswa, pengajuan: null, options };
    }

    const membership = (memberships ?? []).find(
      (item) => item.pengajuan_id === application.id,
    );
    const admin = createAdminClient();
    const { data: memberRows, error: memberError } = await admin
      .from("pengajuan_anggota")
      .select(
        "id, siswa_id, peran, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap))",
      )
      .eq("pengajuan_id", application.id)
      .order("created_at", { ascending: true });

    if (memberError) {
      throw new Error("Gagal memuat anggota pengajuan.");
    }

    const [documentRes, letterRes] = await Promise.all([
      supabase
        .from("dokumen")
        .select(
          "id, jenis, file_name, mime_type, ukuran, status, catatan, diunggah_pada, file_path",
        )
        .eq("pengajuan_id", application.id)
        .order("diunggah_pada", { ascending: false }),
      supabase
        .from("surat")
        .select("id, jenis, nomor, tanggal_terbit, status")
        .eq("pengajuan_id", application.id)
        .order("created_at", { ascending: false }),
    ]);

    if (documentRes.error || letterRes.error) {
      throw new Error("Gagal memuat dokumen pengajuan.");
    }

    const documents = await Promise.all(
      (documentRes.data ?? []).map(async (document) => {
        let fileUrl: string | null = null;

        if (document.file_path) {
          const { data } = await supabase.storage
            .from("dokumen")
            .createSignedUrl(document.file_path, 60 * 60);
          fileUrl = data?.signedUrl ?? null;
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

    const letters = (letterRes.data ?? []).map((letter) => ({
      id: letter.id,
      jenis: letter.jenis,
      nomor: letter.nomor,
      tanggalTerbit: letter.tanggal_terbit,
      status: letter.status,
    }));

    return {
      siswa,
      options,
      pengajuan: {
        id: application.id,
        status: application.status,
        alasanPenolakan: application.alasan_penolakan,
        catatan: application.catatan,
        tanggalMulai: application.tanggal_mulai,
        tanggalSelesai: application.tanggal_selesai,
        createdAt: application.created_at,
        dibuatOleh: application.dibuat_oleh,
        isOwner: application.dibuat_oleh === penggunaId,
        peran: membership?.peran ?? "anggota",
        perusahaan: application.perusahaan,
        periode: application.periode,
        anggota: (memberRows ?? []).map((member) => ({
          id: member.id,
          siswaId: member.siswa_id,
          nama: member.siswa?.pengguna?.nama_lengkap ?? "Tanpa nama",
          nis: member.siswa?.nis ?? "—",
          kelas: member.siswa?.kelas ?? null,
          peran: member.peran,
          isCurrent: member.siswa_id === siswa.id,
        })),
        dokumen: documents,
        surat: letters,
      },
    };
  },
);
