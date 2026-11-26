import { cache } from "react";
import { connection } from "next/server";

import {
  getGuruStudents,
  type GuruContext,
} from "@/lib/data/guru";
import {
  getMutabaahReview,
  type MutabaahReviewData,
} from "@/lib/data/siswa-mutabaah";

export type GuruMutabaahStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  pengajuanId: string;
  periodeId: string | null;
};

export type GuruMutabaahData = {
  context: GuruContext | null;
  students: GuruMutabaahStudent[];
  activeStudent: GuruMutabaahStudent | null;
  review: MutabaahReviewData | null;
};

export const getGuruMutabaah = cache(
  async (
    penggunaId: string,
    selectedStudentId?: string,
    selectedFormId?: string,
  ): Promise<GuruMutabaahData> => {
    await connection();

    const { context, students } = await getGuruStudents(penggunaId);

    if (!context) {
      return {
        context: null,
        students: [],
        activeStudent: null,
        review: null,
      };
    }

    const list: GuruMutabaahStudent[] = students.map((student) => ({
      id: student.id,
      nama: student.nama,
      nis: student.nis,
      kelas: student.kelas,
      pengajuanId: student.pengajuanId,
      periodeId: student.periodeId,
    }));

    const activeStudent =
      list.find((student) => student.id === selectedStudentId) ??
      list[0] ??
      null;

    if (!activeStudent) {
      return {
        context,
        students: list,
        activeStudent: null,
        review: null,
      };
    }

    const review = await getMutabaahReview(
      activeStudent.id,
      selectedFormId,
      activeStudent.periodeId ?? undefined,
    );

    return { context, students: list, activeStudent, review };
  },
);
