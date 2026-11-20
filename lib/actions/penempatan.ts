"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, postgresUuidPattern } from "@/lib/validators/common";
import {
  penempatanFormSchema,
  type PenempatanFormInput,
} from "@/lib/validators/penempatan";
import { isPenempatanStatus } from "@/lib/data/admin-penempatan";

export type PenempatanActionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data penempatan tidak valid.");

function revalidatePenempatan() {
  revalidatePath("/admin/penempatan");
  revalidatePath("/admin");
  revalidatePath("/guru");
  revalidatePath("/guru/siswa");
  revalidatePath("/instruktur");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/siswa");
}

export async function updatePenempatanAction(
  input: unknown,
): Promise<PenempatanActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = penempatanFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data penempatan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: PenempatanFormInput = parsed.data;
  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("pengajuan_pkl")
    .select("id, status, perusahaan_id")
    .eq("id", data.pengajuan_id)
    .maybeSingle();

  if (applicationError) {
    return { ok: false, message: "Data penempatan belum dapat diperiksa." };
  }

  if (!application || !isPenempatanStatus(application.status)) {
    return { ok: false, message: "Penempatan tidak ditemukan atau sudah selesai." };
  }

  const fieldErrors: Record<string, string> = {};

  if (data.guru_pembimbing_id) {
    const { data: guru, error } = await admin
      .from("guru")
      .select("id, pengguna:pengguna_id(aktif)")
      .eq("id", data.guru_pembimbing_id)
      .maybeSingle();

    if (error || !guru || !guru.pengguna?.aktif) {
      fieldErrors.guru_pembimbing_id =
        "Guru pembimbing tidak ditemukan atau tidak aktif.";
    }
  }

  const assignmentIds = Array.from(
    new Set(
      [data.instruktur_id, data.pembimbing_id].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  if (assignmentIds.length) {
    const { data: assignments, error } = await admin
      .from("instruktur")
      .select("id, perusahaan_id, aktif, pengguna:pengguna_id(aktif)")
      .in("id", assignmentIds);

    if (error) {
      return { ok: false, message: "Data instruktur belum dapat diperiksa." };
    }

    const assignmentById = new Map(
      (assignments ?? []).map((assignment) => [assignment.id, assignment]),
    );

    for (const [field, assignmentId] of [
      ["instruktur_id", data.instruktur_id],
      ["pembimbing_id", data.pembimbing_id],
    ] as const) {
      if (!assignmentId) continue;

      const assignment = assignmentById.get(assignmentId);

      if (
        !assignment ||
        !assignment.aktif ||
        !assignment.pengguna?.aktif ||
        assignment.perusahaan_id !== application.perusahaan_id
      ) {
        fieldErrors[field] =
          "Pilihan harus instruktur aktif di perusahaan yang sama.";
      }
    }
  }

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Periksa kembali data penempatan.",
      fieldErrors,
    };
  }

  const { error: updateError } = await admin
    .from("pengajuan_pkl")
    .update({
      guru_pembimbing_id: data.guru_pembimbing_id || null,
      instruktur_id: data.instruktur_id || null,
      pembimbing_id: data.pembimbing_id || null,
      tanggal_mulai: data.tanggal_mulai || null,
      tanggal_selesai: data.tanggal_selesai || null,
    })
    .eq("id", application.id);

  if (updateError) {
    return { ok: false, message: "Penempatan belum dapat disimpan. Coba lagi." };
  }

  revalidatePenempatan();
  return { ok: true, message: "Data penempatan diperbarui." };
}

export async function startPklAction(
  pengajuanId: unknown,
): Promise<PenempatanActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(pengajuanId);

  if (!parsedId.success) {
    return { ok: false, message: "Data penempatan tidak valid." };
  }

  const admin = createAdminClient();
  const { data: application, error } = await admin
    .from("pengajuan_pkl")
    .select(
      "id, status, guru_pembimbing_id, instruktur_id, tanggal_mulai, tanggal_selesai",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Data penempatan belum dapat diperiksa." };
  }

  if (!application || !isPenempatanStatus(application.status)) {
    return { ok: false, message: "Penempatan tidak ditemukan atau sudah selesai." };
  }

  if (
    application.status !== "diterima" &&
    application.status !== "keberangkatan_terbit"
  ) {
    return {
      ok: false,
      message: "PKL sudah dimulai atau status tidak dapat dilanjutkan.",
    };
  }

  const fieldErrors: Record<string, string> = {};

  if (!application.guru_pembimbing_id) {
    fieldErrors.guru_pembimbing_id = "Tetapkan guru pembimbing terlebih dahulu.";
  }

  if (!application.instruktur_id) {
    fieldErrors.instruktur_id = "Tetapkan instruktur perusahaan terlebih dahulu.";
  }

  if (!application.tanggal_mulai) {
    fieldErrors.tanggal_mulai = "Isi tanggal mulai PKL.";
  }

  if (!application.tanggal_selesai) {
    fieldErrors.tanggal_selesai = "Isi tanggal selesai PKL.";
  }

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Lengkapi data penempatan sebelum memulai PKL.",
      fieldErrors,
    };
  }

  const { error: updateError } = await admin
    .from("pengajuan_pkl")
    .update({ status: "berlangsung" })
    .eq("id", application.id);

  if (updateError) {
    return { ok: false, message: "PKL belum dapat dimulai. Coba lagi." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await admin.from("log_aktivitas").insert({
        pengguna_id: user.id,
        aksi: "mulai_pkl",
        entitas: "pengajuan_pkl",
        entitas_id: application.id,
        detail: { status: "berlangsung" },
      });
    }
  } catch {
    // Audit log tidak boleh menggagalkan proses utama.
  }

  revalidatePenempatan();
  return { ok: true, message: "PKL dimulai. Jurnal siswa sudah aktif." };
}
