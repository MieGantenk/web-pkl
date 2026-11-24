import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TipePertanyaan } from "@/lib/data/siswa-mutabaah";
import { postgresUuidPattern } from "@/lib/validators/common";

export type StatusForm = "draft" | "aktif" | "arsip";

export type AdminMutabaahOption = {
  id: string;
  label: string;
  urutan: number;
};

export type AdminMutabaahQuestion = {
  id: string;
  pertanyaan: string;
  deskripsi: string | null;
  tipe: TipePertanyaan;
  wajib: boolean;
  urutan: number;
  minAngka: number | null;
  maxAngka: number | null;
  satuan: string | null;
  options: AdminMutabaahOption[];
};

export type AdminMutabaahFormSummary = {
  id: string;
  nama: string;
  deskripsi: string | null;
  versi: number;
  status: StatusForm;
  periode: { id: string; nama: string } | null;
  questionCount: number;
  hasAnswers: boolean;
  updatedAt: string;
};

export type AdminMutabaahFormDetail = AdminMutabaahFormSummary & {
  questions: AdminMutabaahQuestion[];
};

export type AdminMutabaahPeriod = {
  id: string;
  nama: string;
  aktif: boolean;
};

export type AdminMutabaahData = {
  forms: AdminMutabaahFormSummary[];
  selected: AdminMutabaahFormDetail | null;
  periods: AdminMutabaahPeriod[];
  activePeriodId: string | null;
};

export const getAdminMutabaah = cache(
  async (selectedFormId?: string): Promise<AdminMutabaahData> => {
    await connection();

    const admin = createAdminClient();
    const [formsRes, periodsRes] = await Promise.all([
      admin
        .from("mutabaah_form")
        .select(
          "id, nama, deskripsi, versi, status, updated_at, periode:periode_id(id, nama)",
        )
        .order("created_at", { ascending: false }),
      admin
        .from("periode_pkl")
        .select("id, nama, aktif")
        .order("tanggal_mulai", { ascending: false }),
    ]);

    if (formsRes.error || periodsRes.error) {
      throw new Error("Gagal memuat form mutaba'ah.");
    }

    const forms = formsRes.data ?? [];
    const periods = periodsRes.data ?? [];
    const formIds = forms.map((form) => form.id);

    let questionRows: Array<{ form_id: string }> = [];

    if (formIds.length) {
      const { data, error } = await admin
        .from("mutabaah_pertanyaan")
        .select("form_id")
        .in("form_id", formIds);

      if (error) {
        throw new Error("Gagal memuat jumlah pertanyaan.");
      }

      questionRows = data ?? [];
    }

    const questionCountByForm = new Map<string, number>();

    for (const row of questionRows) {
      questionCountByForm.set(
        row.form_id,
        (questionCountByForm.get(row.form_id) ?? 0) + 1,
      );
    }

    const answerChecks = await Promise.all(
      formIds.map(async (formId) => {
        const { count, error } = await admin
          .from("mutabaah_harian")
          .select("id", { count: "exact", head: true })
          .eq("form_id", formId);

        if (error) {
          throw new Error("Gagal memeriksa jawaban mutaba'ah.");
        }

        return [formId, (count ?? 0) > 0] as const;
      }),
    );
    const hasAnswersByForm = new Map(answerChecks);

    const summaries: AdminMutabaahFormSummary[] = forms.map((form) => ({
      id: form.id,
      nama: form.nama,
      deskripsi: form.deskripsi,
      versi: form.versi,
      status: form.status,
      periode: form.periode,
      questionCount: questionCountByForm.get(form.id) ?? 0,
      hasAnswers: hasAnswersByForm.get(form.id) ?? false,
      updatedAt: form.updated_at,
    }));

    const validSelectedId =
      selectedFormId && postgresUuidPattern.test(selectedFormId)
        ? selectedFormId
        : undefined;
    const selectedSummary =
      summaries.find((form) => form.id === validSelectedId) ??
      summaries[0] ??
      null;

    let selected: AdminMutabaahFormDetail | null = null;

    if (selectedSummary) {
      const { data: questions, error } = await admin
        .from("mutabaah_pertanyaan")
        .select(
          "id, pertanyaan, deskripsi, tipe, wajib, urutan, min_angka, max_angka, satuan",
        )
        .eq("form_id", selectedSummary.id)
        .eq("aktif", true)
        .order("urutan", { ascending: true });

      if (error) {
        throw new Error("Gagal memuat pertanyaan mutaba'ah.");
      }

      const questionData = questions ?? [];
      const questionIds = questionData.map((question) => question.id);

      let optionRows: Array<{
        id: string;
        pertanyaan_id: string;
        label: string;
        urutan: number;
      }> = [];

      if (questionIds.length) {
        const { data, error: optionError } = await admin
          .from("mutabaah_opsi")
          .select("id, pertanyaan_id, label, urutan")
          .in("pertanyaan_id", questionIds)
          .eq("aktif", true)
          .order("urutan", { ascending: true });

        if (optionError) {
          throw new Error("Gagal memuat opsi mutaba'ah.");
        }

        optionRows = data ?? [];
      }

      const optionsByQuestion = new Map<string, AdminMutabaahOption[]>();

      for (const option of optionRows) {
        const list = optionsByQuestion.get(option.pertanyaan_id) ?? [];
        list.push({
          id: option.id,
          label: option.label,
          urutan: option.urutan,
        });
        optionsByQuestion.set(option.pertanyaan_id, list);
      }

      selected = {
        ...selectedSummary,
        questions: questionData.map((question) => ({
          id: question.id,
          pertanyaan: question.pertanyaan,
          deskripsi: question.deskripsi,
          tipe: question.tipe,
          wajib: question.wajib,
          urutan: question.urutan,
          minAngka: question.min_angka,
          maxAngka: question.max_angka,
          satuan: question.satuan,
          options: optionsByQuestion.get(question.id) ?? [],
        })),
      };
    }

    return {
      forms: summaries,
      selected,
      periods,
      activePeriodId: periods.find((period) => period.aktif)?.id ?? null,
    };
  },
);
