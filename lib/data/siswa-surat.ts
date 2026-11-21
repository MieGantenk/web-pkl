import { cache } from "react";
import { connection } from "next/server";

import type { JenisSurat, StatusPengajuan, StatusSurat } from "@/lib/status";
import { studentSuratTypes } from "@/lib/surat";
import { createClient } from "@/lib/supabase/server";

export type SiswaSuratItem = {
  id: string;
  jenis: JenisSurat;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
};

export type SiswaSuratData = {
  student: {
    id: string;
    nis: string;
    kelas: string | null;
    jurusan: { nama: string } | null;
  } | null;
  application: {
    id: string;
    status: StatusPengajuan;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
    perusahaan: { nama: string; kota: string | null } | null;
    periode: { nama: string } | null;
  } | null;
  letters: SiswaSuratItem[];
};

export const getSiswaSurat = cache(
  async (penggunaId: string): Promise<SiswaSuratData> => {
    await connection();

    const supabase = await createClient();
    const { data: student, error: studentError } = await supabase
      .from("siswa")
      .select("id, nis, kelas, jurusan:jurusan_id(nama)")
      .eq("pengguna_id", penggunaId)
      .maybeSingle();

    if (studentError) {
      throw new Error("Gagal memuat data siswa.");
    }

    if (!student) {
      return { student: null, application: null, letters: [] };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .eq("siswa_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new Error("Gagal memuat pengajuan siswa.");
    }

    if (!membership) {
      return { student, application: null, letters: [] };
    }

    const [applicationRes, lettersRes] = await Promise.all([
      supabase
        .from("pengajuan_pkl")
        .select(
          "id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
        )
        .eq("id", membership.pengajuan_id)
        .maybeSingle(),
      supabase
        .from("surat")
        .select("id, jenis, nomor, tanggal_terbit, status")
        .eq("pengajuan_id", membership.pengajuan_id)
        .in("jenis", [...studentSuratTypes])
        .eq("status", "terbit")
        .order("tanggal_terbit", { ascending: false }),
    ]);

    if (applicationRes.error || lettersRes.error) {
      throw new Error("Gagal memuat surat siswa.");
    }

    const application = applicationRes.data;

    if (!application) {
      return { student, application: null, letters: [] };
    }

    return {
      student,
      application: {
        id: application.id,
        status: application.status,
        tanggalMulai: application.tanggal_mulai,
        tanggalSelesai: application.tanggal_selesai,
        perusahaan: application.perusahaan,
        periode: application.periode,
      },
      letters: (lettersRes.data ?? []).map((letter) => ({
        id: letter.id,
        jenis: letter.jenis,
        nomor: letter.nomor,
        tanggalTerbit: letter.tanggal_terbit,
        status: letter.status,
      })),
    };
  },
);
