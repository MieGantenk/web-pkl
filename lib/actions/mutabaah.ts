"use server";

import { revalidatePath } from "next/cache";

import { jakartaToday } from "@/lib/date";
import { notifyUsers } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom } from "@/lib/validators/common";
import { saveMutabaahSchema } from "@/lib/validators/mutabaah";

export type MutabaahActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireSiswa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      message: "Sesi tidak valid. Silakan masuk lagi.",
    };
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("id, peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.peran !== "siswa" || !profile.aktif) {
    return { ok: false as const, message: "Anda tidak berwenang." };
  }

  const { data: siswa } = await supabase
    .from("siswa")
    .select("id, aktif")
    .eq("pengguna_id", user.id)
    .maybeSingle();

  if (!siswa || !siswa.aktif) {
    return { ok: false as const, message: "Profil siswa tidak aktif." };
  }

  return { ok: true as const, supabase, siswaId: siswa.id };
}

type ResolvedAnswer = {
  isEmpty: boolean;
  jawabanTeks: string | null;
  jawabanAngka: number | null;
  jawabanBoolean: boolean | null;
  opsiIds: string[];
};

function revalidateMutabaah() {
  revalidatePath("/siswa/mutabaah");
  revalidatePath("/siswa");
  revalidatePath("/guru/siswa");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/ortu");
}

export async function saveMutabaahAction(
  input: unknown,
): Promise<MutabaahActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsed = saveMutabaahSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali jawaban mutaba'ah Anda.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const supabase = session.supabase;
  const today = jakartaToday();

  const { data: form, error: formError } = await supabase
    .from("mutabaah_form")
    .select("id, nama")
    .eq("status", "aktif")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (formError) {
    return { ok: false, message: "Form mutaba'ah belum dapat diperiksa." };
  }

  if (!form) {
    return { ok: false, message: "Form mutaba'ah belum aktif." };
  }

  const { data: questionRows, error: questionError } = await supabase
    .from("mutabaah_pertanyaan")
    .select("id, pertanyaan, tipe, wajib, min_angka, max_angka, satuan")
    .eq("form_id", form.id)
    .eq("aktif", true)
    .order("urutan", { ascending: true });

  if (questionError || !questionRows?.length) {
    return { ok: false, message: "Pertanyaan mutaba'ah belum tersedia." };
  }

  const questionIds = questionRows.map((question) => question.id);
  const { data: optionRows, error: optionError } = await supabase
    .from("mutabaah_opsi")
    .select("id, pertanyaan_id")
    .in("pertanyaan_id", questionIds)
    .eq("aktif", true);

  if (optionError) {
    return { ok: false, message: "Pilihan mutaba'ah belum dapat diperiksa." };
  }

  const optionIdsByQuestion = new Map<string, Set<string>>();

  for (const option of optionRows ?? []) {
    const current = optionIdsByQuestion.get(option.pertanyaan_id) ?? new Set();
    current.add(option.id);
    optionIdsByQuestion.set(option.pertanyaan_id, current);
  }

  const answerByQuestion = new Map(
    parsed.data.answers.map((answer) => [answer.pertanyaan_id, answer]),
  );
  const resolvedByQuestion = new Map<string, ResolvedAnswer>();
  const fieldErrors: Record<string, string> = {};

  for (const question of questionRows) {
    const answer = answerByQuestion.get(question.id);
    const rawOpsi = answer?.opsi_ids ?? [];
    const validOptions = optionIdsByQuestion.get(question.id) ?? new Set();
    const selected = rawOpsi.filter((id) => validOptions.has(id));

    if (selected.length !== rawOpsi.length) {
      fieldErrors[question.id] = "Pilihan jawaban tidak valid.";
      continue;
    }

    const teks = (answer?.jawaban_teks ?? "").trim();
    const angka = answer?.jawaban_angka ?? null;
    const bool = answer?.jawaban_boolean ?? null;
    let empty = false;

    if (question.tipe === "ya_tidak") {
      empty = bool === null;
    } else if (question.tipe === "pilih_satu") {
      if (selected.length > 1) {
        fieldErrors[question.id] = "Pilih satu jawaban.";
        continue;
      }

      empty = selected.length === 0;
    } else if (question.tipe === "pilih_banyak") {
      empty = selected.length === 0;
    } else if (question.tipe === "isian_angka") {
      if (angka === null) {
        empty = true;
      } else {
        if (!Number.isFinite(angka)) {
          fieldErrors[question.id] = "Isi angka yang valid.";
          continue;
        }

        if (question.min_angka !== null && angka < question.min_angka) {
          fieldErrors[question.id] = `Minimal ${question.min_angka}${
            question.satuan ? ` ${question.satuan}` : ""
          }.`;
          continue;
        }

        if (question.max_angka !== null && angka > question.max_angka) {
          fieldErrors[question.id] = `Maksimal ${question.max_angka}${
            question.satuan ? ` ${question.satuan}` : ""
          }.`;
          continue;
        }
      }
    } else {
      empty = !teks;
      const max = question.tipe === "essay" ? 4000 : 500;

      if (teks.length > max) {
        fieldErrors[question.id] = `Jawaban maksimal ${max} karakter.`;
        continue;
      }
    }

    if (empty && question.wajib) {
      fieldErrors[question.id] = "Pertanyaan ini wajib diisi.";
      continue;
    }

    resolvedByQuestion.set(question.id, {
      isEmpty: empty,
      jawabanTeks:
        question.tipe === "isian_singkat" || question.tipe === "essay"
          ? teks || null
          : null,
      jawabanAngka:
        question.tipe === "isian_angka" && !empty ? angka : null,
      jawabanBoolean:
        question.tipe === "ya_tidak" && !empty ? bool : null,
      opsiIds:
        question.tipe === "pilih_satu" || question.tipe === "pilih_banyak"
          ? selected
          : [],
    });
  }

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Lengkapi jawaban wajib terlebih dahulu.",
      fieldErrors,
    };
  }

  const { data: existingEntry, error: entryError } = await supabase
    .from("mutabaah_harian")
    .select("id, form_id")
    .eq("siswa_id", session.siswaId)
    .eq("tanggal", today)
    .maybeSingle();

  if (entryError) {
    return { ok: false, message: "Mutaba'ah hari ini belum dapat diperiksa." };
  }

  if (existingEntry && existingEntry.form_id !== form.id) {
    return {
      ok: false,
      message: "Form mutaba'ah sudah diperbarui. Muat ulang halaman.",
    };
  }

  let entryId = existingEntry?.id ?? null;

  if (!entryId) {
    const { data: inserted, error: insertError } = await supabase
      .from("mutabaah_harian")
      .insert({
        siswa_id: session.siswaId,
        form_id: form.id,
        tanggal: today,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return {
        ok: false,
        message: "Mutaba'ah hari ini belum dapat disimpan. Coba lagi.",
      };
    }

    entryId = inserted.id;
  }

  const { data: existingAnswers, error: answerError } = await supabase
    .from("mutabaah_jawaban")
    .select("id, pertanyaan_id")
    .eq("harian_id", entryId);

  if (answerError) {
    return { ok: false, message: "Jawaban mutaba'ah belum dapat diperiksa." };
  }

  const existingByQuestion = new Map(
    (existingAnswers ?? []).map((answer) => [answer.pertanyaan_id, answer.id]),
  );

  for (const question of questionRows) {
    const value = resolvedByQuestion.get(question.id);
    const existingAnswerId = existingByQuestion.get(question.id);

    if (!value) continue;

    if (value.isEmpty) {
      if (!existingAnswerId) continue;

      const { error: clearError } = await supabase
        .from("mutabaah_jawaban")
        .update({
          jawaban_teks: null,
          jawaban_angka: null,
          jawaban_boolean: null,
        })
        .eq("id", existingAnswerId);

      if (clearError) {
        return {
          ok: false,
          message: "Jawaban mutaba'ah belum dapat diperbarui. Coba lagi.",
        };
      }

      await supabase
        .from("mutabaah_jawaban_opsi")
        .delete()
        .eq("jawaban_id", existingAnswerId);
      continue;
    }

    const payload = {
      jawaban_teks: value.jawabanTeks,
      jawaban_angka: value.jawabanAngka,
      jawaban_boolean: value.jawabanBoolean,
    };
    let answerId = existingAnswerId ?? null;

    if (answerId) {
      const { error: updateError } = await supabase
        .from("mutabaah_jawaban")
        .update(payload)
        .eq("id", answerId);

      if (updateError) {
        return {
          ok: false,
          message: "Jawaban mutaba'ah belum dapat disimpan. Coba lagi.",
        };
      }
    } else {
      const { data: inserted, error: insertAnswerError } = await supabase
        .from("mutabaah_jawaban")
        .insert({
          harian_id: entryId,
          pertanyaan_id: question.id,
          ...payload,
        })
        .select("id")
        .single();

      if (insertAnswerError || !inserted) {
        return {
          ok: false,
          message: "Jawaban mutaba'ah belum dapat disimpan. Coba lagi.",
        };
      }

      answerId = inserted.id;
    }

    if (question.tipe === "pilih_satu" || question.tipe === "pilih_banyak") {
      const { error: deleteOptionError } = await supabase
        .from("mutabaah_jawaban_opsi")
        .delete()
        .eq("jawaban_id", answerId);

      if (deleteOptionError) {
        return {
          ok: false,
          message: "Pilihan jawaban belum dapat diperbarui. Coba lagi.",
        };
      }

      if (value.opsiIds.length) {
        const { error: insertOptionError } = await supabase
          .from("mutabaah_jawaban_opsi")
          .insert(
            value.opsiIds.map((opsiId) => ({
              jawaban_id: answerId,
              opsi_id: opsiId,
            })),
          );

        if (insertOptionError) {
          return {
            ok: false,
            message: "Pilihan jawaban belum dapat disimpan. Coba lagi.",
          };
        }
      }
    }
  }

  if (!existingEntry) {
    try {
      const admin = createAdminClient();
      const { data: parents } = await admin
        .from("orang_tua_siswa")
        .select("pengguna_id")
        .eq("siswa_id", session.siswaId);

      await notifyUsers(
        (parents ?? []).map((parent) => parent.pengguna_id),
        {
          judul: "Mutaba'ah hari ini terisi",
          pesan: "Anak Anda sudah mengisi mutaba'ah hari ini.",
        },
        "/ortu/mutabaah",
      );
    } catch {
      // Notifikasi tidak boleh menggagalkan penyimpanan mutaba'ah.
    }
  }

  revalidateMutabaah();
  return { ok: true };
}
