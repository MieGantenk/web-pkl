import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";

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
