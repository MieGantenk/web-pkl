"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MutabaahFormDraftInput } from "@/lib/validators/mutabaah-form";
import {
  createMutabaahFormSchema,
  mutabaahFormDraftSchema,
} from "@/lib/validators/mutabaah-form";
import { postgresUuidPattern } from "@/lib/validators/common";

export type AdminMutabaahActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data form tidak valid.");

const choiceTypes = new Set(["pilih_satu", "pilih_banyak"]);

function revalidateMutabaahAdmin() {
  revalidatePath("/admin/mutabaah");
  revalidatePath("/admin/mutabaah/pertanyaan");
  revalidatePath("/admin/pengaturan");
  revalidatePath("/siswa/mutabaah");
  revalidatePath("/ortu/mutabaah");
  revalidatePath("/guru/mutabaah");
  revalidatePath("/guru/siswa");
  revalidatePath("/instruktur/siswa");
}

async function nextVersion(admin: SupabaseClient, nama: string) {
  const { data, error } = await admin
    .from("mutabaah_form")
    .select("versi")
    .eq("nama", nama)
    .order("versi", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memeriksa versi form.");
  }

  return (data?.versi ?? 0) + 1;
}

async function insertQuestions(
  admin: SupabaseClient,
  formId: string,
  questions: MutabaahFormDraftInput["questions"],
) {
  const insertedIds: string[] = [];

  for (const [index, question] of questions.entries()) {
    const numeric = question.tipe === "isian_angka";

    const { data, error } = await admin
      .from("mutabaah_pertanyaan")
      .insert({
        form_id: formId,
        pertanyaan: question.pertanyaan,
        deskripsi: question.deskripsi?.trim() || null,
        tipe: question.tipe,
        wajib: question.wajib,
        urutan: index + 1,
        min_angka: numeric ? (question.min_angka ?? null) : null,
        max_angka: numeric ? (question.max_angka ?? null) : null,
        satuan: numeric ? question.satuan?.trim() || null : null,
        aktif: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (insertedIds.length) {
        await admin.from("mutabaah_pertanyaan").delete().in("id", insertedIds);
      }

      return {
        ok: false as const,
        message: "Pertanyaan belum dapat disimpan. Coba lagi.",
      };
    }

    insertedIds.push(data.id);

    if (choiceTypes.has(question.tipe) && question.options.length) {
      const { error: optionError } = await admin
        .from("mutabaah_opsi")
        .insert(
          question.options.map((option, optionIndex) => ({
            pertanyaan_id: data.id,
            label: option.label,
            urutan: optionIndex + 1,
            aktif: true,
          })),
        );

      if (optionError) {
        await admin.from("mutabaah_pertanyaan").delete().in("id", insertedIds);
        return {
          ok: false as const,
          message: "Opsi pertanyaan belum dapat disimpan. Coba lagi.",
        };
      }
    }
  }

  return { ok: true as const, ids: insertedIds };
}

export async function createFormAction(
  input: unknown,
): Promise<AdminMutabaahActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = createMutabaahFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Periksa kembali data form.",
    };
  }

  const admin = createAdminClient();

  try {
    const version = await nextVersion(admin, parsed.data.nama);
    const { data, error } = await admin
      .from("mutabaah_form")
      .insert({
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi || null,
        periode_id: parsed.data.periode_id,
        versi: version,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        message: "Form mutaba'ah belum dapat dibuat. Coba lagi.",
      };
    }

    revalidateMutabaahAdmin();
    return { ok: true, id: data.id };
  } catch {
    return {
      ok: false,
      message: "Form mutaba'ah belum dapat dibuat. Coba lagi.",
    };
  }
}

export async function updateFormDraftAction(
  formId: unknown,
  input: unknown,
): Promise<AdminMutabaahActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(formId);
  const parsed = mutabaahFormDraftSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data form tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Periksa kembali data form.",
    };
  }

  const admin = createAdminClient();
  const { data: form, error: formError } = await admin
    .from("mutabaah_form")
    .select("id, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (formError) {
    return { ok: false, message: "Form belum dapat diperiksa. Coba lagi." };
  }

  if (!form) {
    return { ok: false, message: "Form tidak ditemukan." };
  }

  if (form.status !== "draft") {
    return {
      ok: false,
      message: "Hanya form berstatus draft yang bisa diubah.",
    };
  }

  const { count, error: answerError } = await admin
    .from("mutabaah_harian")
    .select("id", { count: "exact", head: true })
    .eq("form_id", parsedId.data);

  if (answerError) {
    return { ok: false, message: "Jawaban form belum dapat diperiksa." };
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message:
        "Form ini sudah punya jawaban. Buat versi baru untuk mengubah pertanyaan.",
    };
  }

  const { data: oldQuestions, error: oldError } = await admin
    .from("mutabaah_pertanyaan")
    .select("id")
    .eq("form_id", parsedId.data);

  if (oldError) {
    return { ok: false, message: "Pertanyaan lama belum dapat diperiksa." };
  }

  const oldIds = (oldQuestions ?? []).map((question) => question.id);

  const update = await admin
    .from("mutabaah_form")
    .update({
      nama: parsed.data.nama,
      deskripsi: parsed.data.deskripsi || null,
      periode_id: parsed.data.periode_id,
    })
    .eq("id", parsedId.data);

  if (update.error) {
    return { ok: false, message: "Form belum dapat diperbarui. Coba lagi." };
  }

  const inserted = await insertQuestions(
    admin,
    parsedId.data,
    parsed.data.questions,
  );

  if (!inserted.ok) {
    return inserted;
  }

  if (oldIds.length) {
    const { error: deleteError } = await admin
      .from("mutabaah_pertanyaan")
      .delete()
      .in("id", oldIds);

    if (deleteError) {
      await admin
        .from("mutabaah_pertanyaan")
        .delete()
        .in("id", inserted.ids);
      return {
        ok: false,
        message: "Pertanyaan lama belum dapat diganti. Coba lagi.",
      };
    }
  }

  revalidateMutabaahAdmin();
  return { ok: true, message: "Draft mutaba'ah disimpan." };
}

export async function publishFormAction(
  formId: unknown,
): Promise<AdminMutabaahActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(formId);

  if (!parsedId.success) {
    return { ok: false, message: "Data form tidak valid." };
  }

  const admin = createAdminClient();
  const { data: form, error: formError } = await admin
    .from("mutabaah_form")
    .select("id, status, periode_id")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (formError) {
    return { ok: false, message: "Form belum dapat diperiksa. Coba lagi." };
  }

  if (!form) {
    return { ok: false, message: "Form tidak ditemukan." };
  }

  if (form.status !== "draft") {
    return { ok: false, message: "Form ini bukan draft." };
  }

  if (!form.periode_id) {
    return { ok: false, message: "Pilih periode PKL untuk form ini." };
  }

  const { count, error: questionError } = await admin
    .from("mutabaah_pertanyaan")
    .select("id", { count: "exact", head: true })
    .eq("form_id", parsedId.data)
    .eq("aktif", true);

  if (questionError) {
    return { ok: false, message: "Pertanyaan form belum dapat diperiksa." };
  }

  if ((count ?? 0) === 0) {
    return {
      ok: false,
      message: "Tambahkan minimal satu pertanyaan sebelum publikasi.",
    };
  }

  const { data: published, error } = await admin
    .from("mutabaah_form")
    .update({ status: "aktif" })
    .eq("id", parsedId.data)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !published) {
    return {
      ok: false,
      message: "Form belum dapat dipublikasikan. Coba lagi.",
    };
  }

  revalidateMutabaahAdmin();
  return { ok: true, message: "Form mutaba'ah dipublikasikan." };
}

export async function createFormVersionAction(
  formId: unknown,
): Promise<AdminMutabaahActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(formId);

  if (!parsedId.success) {
    return { ok: false, message: "Data form tidak valid." };
  }

  const admin = createAdminClient();
  const { data: source, error: sourceError } = await admin
    .from("mutabaah_form")
    .select("id, nama, deskripsi, periode_id")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (sourceError || !source) {
    return { ok: false, message: "Form sumber tidak ditemukan." };
  }

  try {
    const version = await nextVersion(admin, source.nama);
    const { data: created, error } = await admin
      .from("mutabaah_form")
      .insert({
        nama: source.nama,
        deskripsi: source.deskripsi,
        periode_id: source.periode_id,
        versi: version,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !created) {
      return { ok: false, message: "Versi baru belum dapat dibuat." };
    }

    const { data: questions, error: questionError } = await admin
      .from("mutabaah_pertanyaan")
      .select(
        "id, pertanyaan, deskripsi, tipe, wajib, urutan, min_angka, max_angka, satuan",
      )
      .eq("form_id", parsedId.data)
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (questionError) {
      await admin.from("mutabaah_form").delete().eq("id", created.id);
      return { ok: false, message: "Pertanyaan sumber belum dapat dimuat." };
    }

    const questionRows = questions ?? [];
    const questionIds = questionRows.map((question) => question.id);

    let optionRows: Array<{
      pertanyaan_id: string;
      label: string;
      urutan: number;
    }> = [];

    if (questionIds.length) {
      const { data, error: optionError } = await admin
        .from("mutabaah_opsi")
        .select("pertanyaan_id, label, urutan")
        .in("pertanyaan_id", questionIds)
        .eq("aktif", true)
        .order("urutan", { ascending: true });

      if (optionError) {
        await admin.from("mutabaah_form").delete().eq("id", created.id);
        return { ok: false, message: "Opsi sumber belum dapat dimuat." };
      }

      optionRows = data ?? [];
    }

    const optionsByQuestion = new Map<string, typeof optionRows>();

    for (const option of optionRows) {
      const list = optionsByQuestion.get(option.pertanyaan_id) ?? [];
      list.push(option);
      optionsByQuestion.set(option.pertanyaan_id, list);
    }

    for (const [index, question] of questionRows.entries()) {
      const { data: newQuestion, error: insertError } = await admin
        .from("mutabaah_pertanyaan")
        .insert({
          form_id: created.id,
          pertanyaan: question.pertanyaan,
          deskripsi: question.deskripsi,
          tipe: question.tipe,
          wajib: question.wajib,
          urutan: index + 1,
          min_angka: question.min_angka,
          max_angka: question.max_angka,
          satuan: question.satuan,
          aktif: true,
        })
        .select("id")
        .single();

      if (insertError || !newQuestion) {
        await admin.from("mutabaah_form").delete().eq("id", created.id);
        return { ok: false, message: "Versi baru belum dapat disalin." };
      }

      const options = optionsByQuestion.get(question.id) ?? [];

      if (options.length) {
        const { error: copyOptionError } = await admin
          .from("mutabaah_opsi")
          .insert(
            options.map((option, optionIndex) => ({
              pertanyaan_id: newQuestion.id,
              label: option.label,
              urutan: optionIndex + 1,
              aktif: true,
            })),
          );

        if (copyOptionError) {
          await admin.from("mutabaah_form").delete().eq("id", created.id);
          return { ok: false, message: "Opsi versi baru belum dapat disalin." };
        }
      }
    }

    revalidateMutabaahAdmin();
    return { ok: true, id: created.id, message: "Versi baru dibuat." };
  } catch {
    return { ok: false, message: "Versi baru belum dapat dibuat." };
  }
}

export async function archiveFormAction(
  formId: unknown,
): Promise<AdminMutabaahActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(formId);

  if (!parsedId.success) {
    return { ok: false, message: "Data form tidak valid." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mutabaah_form")
    .update({ status: "arsip" })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Form belum dapat diarsipkan. Coba lagi." };
  }

  revalidateMutabaahAdmin();
  return { ok: true, message: "Form diarsipkan." };
}
