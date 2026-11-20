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
  perusahaanFormSchema,
  type PerusahaanFormInput,
} from "@/lib/validators/perusahaan";

export type PerusahaanActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data perusahaan tidak valid.");

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidatePerusahaan(id?: string) {
  revalidatePath("/admin/perusahaan");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/admin/perusahaan/${id}`);
  }
}

export async function createPerusahaanAction(
  input: unknown,
): Promise<PerusahaanActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = perusahaanFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data perusahaan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: PerusahaanFormInput = parsed.data;
  const admin = createAdminClient();
  const result = await admin
    .from("perusahaan")
    .insert({
      nama: data.nama,
      alamat: data.alamat,
      kota: nullable(data.kota),
      telepon: nullable(data.telepon),
      email: nullable(data.email)?.toLowerCase() ?? null,
      website: nullable(data.website),
      aktif: true,
    })
    .select("id")
    .single();

  if (result.error) {
    return {
      ok: false,
      message: "Data perusahaan belum dapat disimpan. Coba lagi.",
    };
  }

  revalidatePerusahaan(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function updatePerusahaanAction(
  perusahaanId: unknown,
  input: unknown,
): Promise<PerusahaanActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(perusahaanId);
  const parsed = perusahaanFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data perusahaan tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data perusahaan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: PerusahaanFormInput = parsed.data;
  const admin = createAdminClient();
  const result = await admin
    .from("perusahaan")
    .update({
      nama: data.nama,
      alamat: data.alamat,
      kota: nullable(data.kota),
      telepon: nullable(data.telepon),
      email: nullable(data.email)?.toLowerCase() ?? null,
      website: nullable(data.website),
    })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: "Data perusahaan belum dapat diperbarui." };
  }

  if (!result.data) {
    return { ok: false, message: "Perusahaan tidak ditemukan." };
  }

  revalidatePerusahaan(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function setPerusahaanAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<PerusahaanActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data perusahaan tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("perusahaan")
    .update({ aktif: input.aktif })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return {
      ok: false,
      message: "Status perusahaan belum dapat diperbarui. Coba lagi.",
    };
  }

  if (!result.data) {
    return { ok: false, message: "Perusahaan tidak ditemukan." };
  }

  revalidatePerusahaan(result.data.id);
  return { ok: true, id: result.data.id };
}
