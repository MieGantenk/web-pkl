import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export type TipePertanyaan =
  | "ya_tidak"
  | "pilih_satu"
  | "pilih_banyak"
  | "isian_singkat"
  | "isian_angka"
  | "essay";

export type MutabaahOption = {
  id: string;
  label: string;
};

export type MutabaahQuestion = {
  id: string;
  pertanyaan: string;
  deskripsi: string | null;
  tipe: TipePertanyaan;
  wajib: boolean;
  urutan: number;
  minAngka: number | null;
  maxAngka: number | null;
  satuan: string | null;
  options: MutabaahOption[];
};

export type MutabaahAnswer = {
  pertanyaanId: string;
  label: string;
  tipe: TipePertanyaan;
  satuan: string | null;
  jawabanTeks: string | null;
  jawabanAngka: number | null;
  jawabanBoolean: boolean | null;
  opsiIds: string[];
  opsiLabels: string[];
};

export type MutabaahEntry = {
  id: string;
  tanggal: string;
  catatan: string | null;
  answers: MutabaahAnswer[];
};

export type MutabaahHistoryDay = {
  tanggal: string;
  entry: MutabaahEntry | null;
};

export type MutabaahData = {
  today: string;
  form: {
    id: string;
    nama: string;
    deskripsi: string | null;
  } | null;
  questions: MutabaahQuestion[];
  todayEntry: MutabaahEntry | null;
  week: {
    filled: number;
    total: number;
  };
  history: MutabaahHistoryDay[];
};

export type SiswaMutabaahData = MutabaahData & {
  student: {
    id: string;
    nis: string;
    kelas: string | null;
    jurusan: { nama: string } | null;
  } | null;
  pklAktif: boolean;
};

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loadMutabaahData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siswaId: string,
  today: string,
): Promise<MutabaahData> {
  const { data: form, error: formError } = await supabase
    .from("mutabaah_form")
    .select("id, nama, deskripsi")
    .eq("status", "aktif")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (formError) {
    throw new Error("Gagal memuat form mutaba'ah.");
  }

  if (!form) {
    return {
      today,
      form: null,
      questions: [],
      todayEntry: null,
      week: { filled: 0, total: 7 },
      history: [],
    };
  }

  const { data: questionRows, error: questionError } = await supabase
    .from("mutabaah_pertanyaan")
    .select(
      "id, pertanyaan, deskripsi, tipe, wajib, urutan, min_angka, max_angka, satuan",
    )
    .eq("form_id", form.id)
    .eq("aktif", true)
    .order("urutan", { ascending: true });

  if (questionError) {
    throw new Error("Gagal memuat pertanyaan mutaba'ah.");
  }

  const questionsData = questionRows ?? [];
  const questionIds = questionsData.map((question) => question.id);

  let optionRows: Array<{
    id: string;
    pertanyaan_id: string;
    label: string;
  }> = [];

  if (questionIds.length) {
    const { data, error } = await supabase
      .from("mutabaah_opsi")
      .select("id, pertanyaan_id, label")
      .in("pertanyaan_id", questionIds)
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (error) {
      throw new Error("Gagal memuat pilihan mutaba'ah.");
    }

    optionRows = data ?? [];
  }

  const optionsByQuestion = new Map<string, MutabaahOption[]>();

  for (const option of optionRows) {
    const list = optionsByQuestion.get(option.pertanyaan_id) ?? [];
    list.push({ id: option.id, label: option.label });
    optionsByQuestion.set(option.pertanyaan_id, list);
  }

  const questions: MutabaahQuestion[] = questionsData.map((question) => ({
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

  const weekStart = startOfWeek(today);
  const historyStart = shiftDate(today, -6);
  const rangeStart = weekStart < historyStart ? weekStart : historyStart;

  const { data: entryRows, error: entryError } = await supabase
    .from("mutabaah_harian")
    .select("id, tanggal, catatan")
    .eq("siswa_id", siswaId)
    .gte("tanggal", rangeStart)
    .lte("tanggal", today)
    .order("tanggal", { ascending: false });

  if (entryError) {
    throw new Error("Gagal memuat riwayat mutaba'ah.");
  }

  const entries = entryRows ?? [];
  const entryIds = entries.map((entry) => entry.id);

  let answerRows: Array<{
    id: string;
    harian_id: string;
    pertanyaan_id: string;
    jawaban_teks: string | null;
    jawaban_angka: number | null;
    jawaban_boolean: boolean | null;
    pertanyaan: {
      pertanyaan: string;
      tipe: TipePertanyaan;
      satuan: string | null;
      urutan: number;
    } | null;
  }> = [];

  if (entryIds.length) {
    const { data, error } = await supabase
      .from("mutabaah_jawaban")
      .select(
        "id, harian_id, pertanyaan_id, jawaban_teks, jawaban_angka, jawaban_boolean, pertanyaan:pertanyaan_id(pertanyaan, tipe, satuan, urutan)",
      )
      .in("harian_id", entryIds)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("Gagal memuat jawaban mutaba'ah.");
    }

    answerRows = (data ?? []).sort(
      (a, b) => (a.pertanyaan?.urutan ?? 0) - (b.pertanyaan?.urutan ?? 0),
    );
  }

  const answerIds = answerRows.map((answer) => answer.id);

  let optionAnswerRows: Array<{
    jawaban_id: string;
    opsi_id: string;
    opsi: { label: string; urutan: number } | null;
  }> = [];

  if (answerIds.length) {
    const { data, error } = await supabase
      .from("mutabaah_jawaban_opsi")
      .select("jawaban_id, opsi_id, opsi:opsi_id(label, urutan)")
      .in("jawaban_id", answerIds);

    if (error) {
      throw new Error("Gagal memuat pilihan jawaban mutaba'ah.");
    }

    optionAnswerRows = (data ?? []).sort(
      (a, b) => (a.opsi?.urutan ?? 0) - (b.opsi?.urutan ?? 0),
    );
  }

  const optionsByAnswer = new Map<
    string,
    { ids: string[]; labels: string[] }
  >();

  for (const row of optionAnswerRows) {
    const current = optionsByAnswer.get(row.jawaban_id) ?? {
      ids: [],
      labels: [],
    };
    current.ids.push(row.opsi_id);

    if (row.opsi?.label) {
      current.labels.push(row.opsi.label);
    }

    optionsByAnswer.set(row.jawaban_id, current);
  }

  const answersByEntry = new Map<string, MutabaahAnswer[]>();

  for (const answer of answerRows) {
    if (!answer.pertanyaan) continue;

    const selected = optionsByAnswer.get(answer.id);
    const teks = answer.jawaban_teks?.trim() || null;
    const hasValue =
      answer.jawaban_boolean !== null ||
      answer.jawaban_angka !== null ||
      Boolean(teks) ||
      Boolean(selected?.ids.length);

    if (!hasValue) continue;

    const list = answersByEntry.get(answer.harian_id) ?? [];
    list.push({
      pertanyaanId: answer.pertanyaan_id,
      label: answer.pertanyaan.pertanyaan,
      tipe: answer.pertanyaan.tipe,
      satuan: answer.pertanyaan.satuan,
      jawabanTeks: teks,
      jawabanAngka: answer.jawaban_angka,
      jawabanBoolean: answer.jawaban_boolean,
      opsiIds: selected?.ids ?? [],
      opsiLabels: selected?.labels ?? [],
    });
    answersByEntry.set(answer.harian_id, list);
  }

  const entryByDate = new Map(
    entries.map((entry) => [
      entry.tanggal,
      {
        id: entry.id,
        tanggal: entry.tanggal,
        catatan: entry.catatan,
        answers: answersByEntry.get(entry.id) ?? [],
      } satisfies MutabaahEntry,
    ]),
  );

  const weekDates = new Set(
    entries
      .filter(
        (entry) => entry.tanggal >= weekStart && entry.tanggal <= today,
      )
      .map((entry) => entry.tanggal),
  );

  const history = Array.from({ length: 7 }, (_, index) => {
    const tanggal = shiftDate(today, -index);

    return {
      tanggal,
      entry: entryByDate.get(tanggal) ?? null,
    };
  });

  return {
    today,
    form,
    questions,
    todayEntry: entryByDate.get(today) ?? null,
    week: { filled: weekDates.size, total: 7 },
    history,
  };
}

export const getMutabaahBySiswaId = cache(
  async (siswaId: string): Promise<MutabaahData> => {
    await connection();

    const supabase = await createClient();
    return loadMutabaahData(supabase, siswaId, jakartaToday());
  },
);

export const getSiswaMutabaah = cache(
  async (penggunaId: string): Promise<SiswaMutabaahData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();

    const { data: student, error: studentError } = await supabase
      .from("siswa")
      .select("id, nis, kelas, jurusan:jurusan_id(nama)")
      .eq("pengguna_id", penggunaId)
      .eq("aktif", true)
      .maybeSingle();

    if (studentError) {
      throw new Error("Gagal memuat profil siswa.");
    }

    if (!student) {
      return {
        today,
        student: null,
        pklAktif: false,
        form: null,
        questions: [],
        todayEntry: null,
        week: { filled: 0, total: 7 },
        history: [],
      };
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan:pengajuan_id(status)")
      .eq("siswa_id", student.id)
      .order("created_at", { ascending: false });

    if (membershipError) {
      throw new Error("Gagal memuat status PKL siswa.");
    }

    const pklAktif = (memberships ?? []).some(
      (membership) => membership.pengajuan?.status === "berlangsung",
    );

    if (!pklAktif) {
      return {
        today,
        student,
        pklAktif: false,
        form: null,
        questions: [],
        todayEntry: null,
        week: { filled: 0, total: 7 },
        history: [],
      };
    }

    const data = await loadMutabaahData(supabase, student.id, today);

    return { student, pklAktif: true, ...data };
  },
);
