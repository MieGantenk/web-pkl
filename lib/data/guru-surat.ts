import { cache } from "react";
import { connection } from "next/server";

import {
  getGuruStudents,
  type GuruContext,
} from "@/lib/data/guru";
import type {
  JenisSurat,
  StatusPengajuan,
  StatusSurat,
} from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export type GuruSuratStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
};

export type GuruSuratLetter = {
  id: string;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
};

export type GuruSuratPlacement = {
  pengajuanId: string;
  status: StatusPengajuan;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  students: GuruSuratStudent[];
  letter: GuruSuratLetter | null;
};

export type GuruSuratData = {
  context: GuruContext | null;
  placements: GuruSuratPlacement[];
  issuedCount: number;
};

const PENARIKAN_STATUSES: readonly StatusPengajuan[] = [
  "berlangsung",
  "penarikan_terbit",
];

async function getGuruLetters(
  penggunaId: string,
  jenis: JenisSurat,
  statuses: readonly StatusPengajuan[] | null,
  errorMessage: string,
): Promise<GuruSuratData> {
  await connection();

  const { context, students } = await getGuruStudents(penggunaId);

  if (!context || !students.length) {
    return { context, placements: [], issuedCount: 0 };
  }

  const byApplication = new Map<string, GuruSuratPlacement>();

  for (const student of students) {
    let placement = byApplication.get(student.pengajuanId);

    if (!placement) {
      placement = {
        pengajuanId: student.pengajuanId,
        status: student.pengajuanStatus,
        perusahaan: student.perusahaan,
        periode: student.periode,
        tanggalMulai: student.tanggalMulai,
        tanggalSelesai: student.tanggalSelesai,
        students: [],
        letter: null,
      };
      byApplication.set(student.pengajuanId, placement);
    }

    placement.students.push({
      id: student.id,
      nama: student.nama,
      nis: student.nis,
      kelas: student.kelas,
      jurusan: student.jurusan,
    });
  }

  const placements = Array.from(byApplication.values()).filter(
    (placement) => !statuses || statuses.includes(placement.status),
  );

  if (!placements.length) {
    return { context, placements: [], issuedCount: 0 };
  }

  const supabase = await createClient();
  const { data: letters, error } = await supabase
    .from("surat")
    .select("id, pengajuan_id, nomor, tanggal_terbit")
    .in(
      "pengajuan_id",
      placements.map((placement) => placement.pengajuanId),
    )
    .eq("jenis", jenis)
    .eq("status", "terbit")
    .order("tanggal_terbit", { ascending: false });

  if (error) {
    throw new Error(errorMessage);
  }

  const placementById = new Map(
    placements.map((placement) => [placement.pengajuanId, placement]),
  );

  for (const letter of letters ?? []) {
    const placement = placementById.get(letter.pengajuan_id);

    if (placement && !placement.letter) {
      placement.letter = {
        id: letter.id,
        nomor: letter.nomor,
        tanggalTerbit: letter.tanggal_terbit,
        status: "terbit",
      };
    }
  }

  return {
    context,
    placements,
    issuedCount: placements.filter((placement) => placement.letter).length,
  };
}

export const getGuruSuratTugas = cache((penggunaId: string) =>
  getGuruLetters(
    penggunaId,
    "tugas_monitoring",
    null,
    "Gagal memuat surat tugas monitoring.",
  ),
);

export const getGuruPenarikan = cache((penggunaId: string) =>
  getGuruLetters(
    penggunaId,
    "penarikan",
    PENARIKAN_STATUSES,
    "Gagal memuat surat penarikan.",
  ),
);
