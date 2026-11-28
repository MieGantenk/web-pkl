import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import type {
  MutabaahAnswer,
  MutabaahQuestion,
} from "@/lib/data/siswa-mutabaah";
import { createAdminClient } from "@/lib/supabase/admin";
import { postgresUuidPattern } from "@/lib/validators/common";

export type AdminMutabaahHistoryFilters = {
  dari: string;
  sampai: string;
  kelas: string;
  q: string;
  form: string;
  lengkap: "semua" | "lengkap" | "belum";
};

export type AdminMutabaahHistoryRow = {
  id: string;
  tanggal: string;
  siswa: {
    id: string;
    nama: string;
    nis: string;
    kelas: string | null;
  };
  form: {
    id: string;
    nama: string;
    versi: number;
  } | null;
  answered: number;
  total: number;
  catatan: string | null;
};

export type AdminMutabaahEntryDetail = {
  id: string;
  tanggal: string;
  catatan: string | null;
  siswa: {
    nama: string;
    nis: string;
    kelas: string | null;
  };
  form: {
    nama: string;
    versi: number;
    deskripsi: string | null;
  };
  questions: MutabaahQuestion[];
  answers: MutabaahAnswer[];
};

export type AdminMutabaahHistoryData = {
  today: string;
  range: {
    dari: string;
    sampai: string;
  };
  stats: {
    totalStudents: number;
    todayFilled: number;
    weekPercent: number;
    missingToday: number;
    formName: string | null;
  };
  rows: AdminMutabaahHistoryRow[];
  kelasOptions: string[];
  forms: Array<{
    id: string;
    nama: string;
    versi: number;
    status: string;
  }>;
};

export function normalizeDateFilter(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export const getAdminMutabaahHistory = cache(
  async (
    filters: AdminMutabaahHistoryFilters,
  ): Promise<AdminMutabaahHistoryData> => {
    await connection();

    const admin = createAdminClient();
    const today = jakartaToday();
    const weekStart = startOfWeek(today);
    const dari =
      normalizeDateFilter(filters.dari) || shiftDate(today, -6);
    const sampai = normalizeDateFilter(filters.sampai) || today;
    const rangeDari = dari <= sampai ? dari : sampai;
    const rangeSampai = dari <= sampai ? sampai : dari;

    const [
      studentCountRes,
      todayEntriesRes,
      weekEntriesRes,
      activeFormsRes,
      classesRes,
      formsRes,
    ] = await Promise.all([
      admin
        .from("siswa")
        .select("id", { count: "exact", head: true })
        .eq("aktif", true),
      admin
        .from("mutabaah_harian")
        .select("siswa_id, form_id")
        .eq("tanggal", today),
      admin
        .from("mutabaah_harian")
        .select("id", { count: "exact", head: true })
        .gte("tanggal", weekStart)
        .lte("tanggal", today),
      admin
        .from("mutabaah_form")
        .select("id, nama")
        .eq("status", "aktif")
        .order("created_at", { ascending: false }),
      admin.from("siswa").select("kelas").eq("aktif", true),
      admin
        .from("mutabaah_form")
        .select("id, nama, versi, status")
        .order("created_at", { ascending: false }),
    ]);

    if (
      studentCountRes.error ||
      todayEntriesRes.error ||
      weekEntriesRes.error ||
      activeFormsRes.error ||
      classesRes.error ||
      formsRes.error
    ) {
      throw new Error("Gagal memuat ringkasan mutaba'ah.");
    }

    const totalStudents = studentCountRes.count ?? 0;
    const activeForms = activeFormsRes.data ?? [];
    const activeFormIds = activeForms.map((form) => form.id);
    const filledByStudent = new Map<string, Set<string>>();

    for (const entry of todayEntriesRes.data ?? []) {
      const current = filledByStudent.get(entry.siswa_id) ?? new Set();
      current.add(entry.form_id);
      filledByStudent.set(entry.siswa_id, current);
    }

    const todayFilled =
      activeFormIds.length === 0
        ? 0
        : Array.from(filledByStudent.values()).filter((filled) =>
            activeFormIds.every((formId) => filled.has(formId)),
          ).length;
    const weekFilled = weekEntriesRes.count ?? 0;
    const weekPercent =
      totalStudents > 0 && activeFormIds.length > 0
        ? Math.min(
            100,
            Math.round(
              (weekFilled /
                (totalStudents * 7 * activeFormIds.length)) *
                100,
            ),
          )
        : 0;
    const kelasOptions = Array.from(
      new Set(
        (classesRes.data ?? [])
          .map((row) => row.kelas)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const forms = formsRes.data ?? [];
    const validForm = forms.some((form) => form.id === filters.form)
      ? filters.form
      : "";

    const { data: entries, error: entryError } = await admin
      .from("mutabaah_harian")
      .select(
        "id, tanggal, catatan, siswa:siswa_id(id, nis, kelas, pengguna:pengguna_id(nama_lengkap)), form:form_id(id, nama, versi)",
      )
      .gte("tanggal", rangeDari)
      .lte("tanggal", rangeSampai)
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);

    if (entryError) {
      throw new Error("Gagal memuat riwayat mutaba'ah.");
    }

    const entryRows = entries ?? [];
    const entryIds = entryRows.map((entry) => entry.id);
    const formIds = Array.from(
      new Set(
        entryRows
          .map((entry) => entry.form?.id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const [answerRes, questionRes] = await Promise.all([
      entryIds.length
        ? admin
            .from("mutabaah_jawaban")
            .select("harian_id")
            .in("harian_id", entryIds)
        : Promise.resolve({ data: [], error: null }),
      formIds.length
        ? admin
            .from("mutabaah_pertanyaan")
            .select("form_id")
            .in("form_id", formIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (answerRes.error || questionRes.error) {
      throw new Error("Gagal memuat kelengkapan mutaba'ah.");
    }

    const answeredByEntry = new Map<string, number>();

    for (const answer of answerRes.data ?? []) {
      answeredByEntry.set(
        answer.harian_id,
        (answeredByEntry.get(answer.harian_id) ?? 0) + 1,
      );
    }

    const totalByForm = new Map<string, number>();

    for (const question of questionRes.data ?? []) {
      totalByForm.set(
        question.form_id,
        (totalByForm.get(question.form_id) ?? 0) + 1,
      );
    }

    const term = cleanSearch(filters.q).toLowerCase();
    const rows: AdminMutabaahHistoryRow[] = [];

    for (const entry of entryRows) {
      const siswa = entry.siswa;

      if (!siswa) continue;

      const nama = siswa.pengguna?.nama_lengkap ?? "Siswa";
      const answered = answeredByEntry.get(entry.id) ?? 0;
      const total = entry.form ? (totalByForm.get(entry.form.id) ?? 0) : 0;

      if (term && !`${nama} ${siswa.nis}`.toLowerCase().includes(term)) {
        continue;
      }

      if (filters.kelas && siswa.kelas !== filters.kelas) {
        continue;
      }

      if (validForm && entry.form?.id !== validForm) {
        continue;
      }

      if (
        filters.lengkap === "lengkap" &&
        (total === 0 || answered < total)
      ) {
        continue;
      }

      if (
        filters.lengkap === "belum" &&
        (total === 0 || answered >= total)
      ) {
        continue;
      }

      rows.push({
        id: entry.id,
        tanggal: entry.tanggal,
        siswa: {
          id: siswa.id,
          nama,
          nis: siswa.nis,
          kelas: siswa.kelas,
        },
        form: entry.form,
        answered,
        total,
        catatan: entry.catatan,
      });
    }

    return {
      today,
      range: {
        dari: rangeDari,
        sampai: rangeSampai,
      },
      stats: {
        totalStudents,
        todayFilled,
        weekPercent,
        missingToday: Math.max(0, totalStudents - todayFilled),
        formName:
          activeForms.length === 0
            ? null
            : activeForms.length === 1
              ? activeForms[0].nama
              : `${activeForms.length} form aktif`,
      },
      rows,
      kelasOptions,
      forms,
    };
  },
);

export const getAdminMutabaahEntryDetail = cache(
  async (entryId: string): Promise<AdminMutabaahEntryDetail | null> => {
    await connection();

    if (!postgresUuidPattern.test(entryId)) {
      return null;
    }

    const admin = createAdminClient();
    const { data: entry, error: entryError } = await admin
      .from("mutabaah_harian")
      .select(
        "id, tanggal, catatan, siswa:siswa_id(nis, kelas, pengguna:pengguna_id(nama_lengkap)), form:form_id(id, nama, versi, deskripsi)",
      )
      .eq("id", entryId)
      .maybeSingle();

    if (entryError) {
      throw new Error("Gagal memuat detail pengisian mutaba'ah.");
    }

    if (!entry?.siswa || !entry.form) {
      return null;
    }

    const [questionsResult, answersResult] = await Promise.all([
      admin
        .from("mutabaah_pertanyaan")
        .select(
          "id, pertanyaan, deskripsi, tipe, wajib, urutan, min_angka, max_angka, satuan",
        )
        .eq("form_id", entry.form.id)
        .order("urutan", { ascending: true }),
      admin
        .from("mutabaah_jawaban")
        .select(
          "id, pertanyaan_id, jawaban_teks, jawaban_angka, jawaban_boolean",
        )
        .eq("harian_id", entry.id),
    ]);

    if (questionsResult.error || answersResult.error) {
      throw new Error("Gagal memuat pertanyaan dan jawaban mutaba'ah.");
    }

    const questionRows = questionsResult.data ?? [];
    const answerRows = answersResult.data ?? [];
    const questionIds = questionRows.map((question) => question.id);
    const answerIds = answerRows.map((answer) => answer.id);

    const [optionsResult, selectedOptionsResult] = await Promise.all([
      questionIds.length
        ? admin
            .from("mutabaah_opsi")
            .select("id, pertanyaan_id, label, urutan")
            .in("pertanyaan_id", questionIds)
            .order("urutan", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      answerIds.length
        ? admin
            .from("mutabaah_jawaban_opsi")
            .select("jawaban_id, opsi_id, opsi:opsi_id(label, urutan)")
            .in("jawaban_id", answerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (optionsResult.error || selectedOptionsResult.error) {
      throw new Error("Gagal memuat pilihan jawaban mutaba'ah.");
    }

    const optionsByQuestion = new Map<string, MutabaahQuestion["options"]>();

    for (const option of optionsResult.data ?? []) {
      const list = optionsByQuestion.get(option.pertanyaan_id) ?? [];
      list.push({ id: option.id, label: option.label });
      optionsByQuestion.set(option.pertanyaan_id, list);
    }

    const questions: MutabaahQuestion[] = questionRows.map((question) => ({
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
    }));
    const questionsById = new Map(
      questions.map((question) => [question.id, question]),
    );
    const selectedOptionsByAnswer = new Map<
      string,
      { ids: string[]; labels: string[] }
    >();

    const selectedOptionRows = [...(selectedOptionsResult.data ?? [])].sort(
      (a, b) => (a.opsi?.urutan ?? 0) - (b.opsi?.urutan ?? 0),
    );

    for (const row of selectedOptionRows) {
      const selected = selectedOptionsByAnswer.get(row.jawaban_id) ?? {
        ids: [],
        labels: [],
      };
      selected.ids.push(row.opsi_id);

      if (row.opsi?.label) {
        selected.labels.push(row.opsi.label);
      }

      selectedOptionsByAnswer.set(row.jawaban_id, selected);
    }

    const answers: MutabaahAnswer[] = answerRows.flatMap((answer) => {
      const question = questionsById.get(answer.pertanyaan_id);

      if (!question) {
        return [];
      }

      const selected = selectedOptionsByAnswer.get(answer.id);

      return [
        {
          pertanyaanId: answer.pertanyaan_id,
          label: question.pertanyaan,
          tipe: question.tipe,
          satuan: question.satuan,
          jawabanTeks: answer.jawaban_teks,
          jawabanAngka: answer.jawaban_angka,
          jawabanBoolean: answer.jawaban_boolean,
          opsiIds: selected?.ids ?? [],
          opsiLabels: selected?.labels ?? [],
        },
      ];
    });

    return {
      id: entry.id,
      tanggal: entry.tanggal,
      catatan: entry.catatan,
      siswa: {
        nama: entry.siswa.pengguna?.nama_lengkap ?? "Siswa",
        nis: entry.siswa.nis,
        kelas: entry.siswa.kelas,
      },
      form: {
        nama: entry.form.nama,
        versi: entry.form.versi,
        deskripsi: entry.form.deskripsi,
      },
      questions,
      answers,
    };
  },
);
