"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";
import {
  periodeFormSchema,
  type PeriodeFormInput,
} from "@/lib/validators/periode";

export type PeriodeActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data periode tidak valid.");

function revalidatePeriode(id?: string) {
  revalidatePath("/admin/periode");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/admin/periode/${id}`);
  }
}

async function checkDuplicate(input: {
  nama: string;
  tahun_ajaran: string;
  id?: string;
}) {
  const admin = createAdminClient();
  const query = admin
    .from("periode_pkl")
    .select("id")
    .eq("nama", input.nama)
    .eq("tahun_ajaran", input.tahun_ajaran);

  if (input.id) {
    query.neq("id", input.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { duplicate: false, failed: true };
  }

  return { duplicate: Boolean(data), failed: false };
}

export async function createPeriodeAction(
  input: unknown,
): Promise<PeriodeActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = periodeFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data periode.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: PeriodeFormInput = parsed.data;
  const duplicate = await checkDuplicate({
    nama: data.nama,
    tahun_ajaran: data.tahun_ajaran,
  });

  if (duplicate.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (duplicate.duplicate) {
    return {
      ok: false,
      message: "Periksa kembali data periode.",
      fieldErrors: {
        nama: "Nama periode sudah dipakai pada tahun ajaran ini.",
      },
    };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("periode_pkl")
    .insert({
      nama: data.nama,
      tahun_ajaran: data.tahun_ajaran,
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai,
      aktif: false,
    })
    .select("id")
    .single();

  if (result.error) {
    return {
      ok: false,
      message:
        "Periode belum dapat disimpan. Periksa nama, tahun ajaran, dan tanggal.",
    };
  }

  revalidatePeriode(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function updatePeriodeAction(
  periodeId: unknown,
  input: unknown,
): Promise<PeriodeActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(periodeId);
  const parsed = periodeFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data periode tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data periode.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("periode_pkl")
    .select("id")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (currentError || !current) {
    return { ok: false, message: "Periode tidak ditemukan." };
  }

  const data: PeriodeFormInput = parsed.data;
  const duplicate = await checkDuplicate({
    nama: data.nama,
    tahun_ajaran: data.tahun_ajaran,
    id: current.id,
  });

  if (duplicate.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (duplicate.duplicate) {
    return {
      ok: false,
      message: "Periksa kembali data periode.",
      fieldErrors: {
        nama: "Nama periode sudah dipakai pada tahun ajaran ini.",
      },
    };
  }

  const result = await admin
    .from("periode_pkl")
    .update({
      nama: data.nama,
      tahun_ajaran: data.tahun_ajaran,
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai,
    })
    .eq("id", current.id)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: "Data periode belum dapat diperbarui." };
  }

  if (!result.data) {
    return { ok: false, message: "Periode tidak ditemukan." };
  }

  revalidatePeriode(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function setPeriodeAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<PeriodeActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data periode tidak valid." };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("periode_pkl")
    .select("id, aktif")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (currentError || !current) {
    return { ok: false, message: "Periode tidak ditemukan." };
  }

  if (!input.aktif) {
    const result = await admin
      .from("periode_pkl")
      .update({ aktif: false })
      .eq("id", current.id)
      .select("id")
      .maybeSingle();

    if (result.error || !result.data) {
      return {
        ok: false,
        message: "Status periode belum dapat diperbarui. Coba lagi.",
      };
    }

    revalidatePeriode(current.id);
    return { ok: true, id: current.id };
  }

  const { data: previous, error: previousError } = await admin
    .from("periode_pkl")
    .select("id")
    .eq("aktif", true)
    .neq("id", current.id)
    .maybeSingle();

  if (previousError) {
    return { ok: false, message: "Status periode belum dapat diperiksa." };
  }

  if (previous) {
    const deactivateResult = await admin
      .from("periode_pkl")
      .update({ aktif: false })
      .eq("id", previous.id);

    if (deactivateResult.error) {
      return {
        ok: false,
        message: "Periode aktif sebelumnya belum dapat dinonaktifkan.",
      };
    }
  }

  const result = await admin
    .from("periode_pkl")
    .update({ aktif: true })
    .eq("id", current.id)
    .select("id")
    .maybeSingle();

  if (result.error || !result.data) {
    if (previous) {
      await admin
        .from("periode_pkl")
        .update({ aktif: true })
        .eq("id", previous.id);
    }

    return {
      ok: false,
      message: "Status periode belum dapat diperbarui. Coba lagi.",
    };
  }

  revalidatePeriode(current.id);
  if (previous) {
    revalidatePeriode(previous.id);
  }

  return { ok: true, id: current.id };
}
