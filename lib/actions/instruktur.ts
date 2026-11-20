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
  createInstrukturSchema,
  instrukturFormSchema,
  penugasanSchema,
  type InstrukturFormInput,
} from "@/lib/validators/instruktur";

export type InstrukturActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data instruktur tidak valid.");

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidateInstruktur(penggunaId?: string) {
  revalidatePath("/admin/instruktur");
  revalidatePath("/admin");

  if (penggunaId) {
    revalidatePath(`/admin/instruktur/${penggunaId}`);
  }
}

async function checkUnique(input: {
  username: string;
  email: string;
  penggunaId?: string;
}) {
  const admin = createAdminClient();
  const fields: Record<string, string> = {};

  const usernameQuery = admin
    .from("pengguna")
    .select("id")
    .eq("username", input.username);
  const emailQuery = admin
    .from("pengguna")
    .select("id")
    .eq("email", input.email);

  if (input.penggunaId) {
    usernameQuery.neq("id", input.penggunaId);
    emailQuery.neq("id", input.penggunaId);
  }

  const [usernameResult, emailResult] = await Promise.all([
    usernameQuery.maybeSingle(),
    emailQuery.maybeSingle(),
  ]);

  if (usernameResult.error || emailResult.error) {
    return { fields, failed: true };
  }

  if (usernameResult.data) {
    fields.username = "Username sudah dipakai.";
  }

  if (emailResult.data) {
    fields.email = "Email sudah dipakai.";
  }

  return { fields, failed: false };
}

export async function createInstrukturAction(
  input: unknown,
): Promise<InstrukturActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = createInstrukturSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data instruktur.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data instruktur.",
      fieldErrors: unique.fields,
    };
  }

  const admin = createAdminClient();
  const { data: perusahaan, error: perusahaanError } = await admin
    .from("perusahaan")
    .select("id, aktif")
    .eq("id", data.perusahaan_id)
    .maybeSingle();

  if (perusahaanError) {
    return { ok: false, message: "Perusahaan belum dapat diperiksa." };
  }

  if (!perusahaan || !perusahaan.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data instruktur.",
      fieldErrors: {
        perusahaan_id: "Perusahaan tidak ditemukan atau sedang nonaktif.",
      },
    };
  }

  const created = await admin.auth.admin.createUser({
    email,
    password: data.password ?? "",
    email_confirm: true,
    user_metadata: {
      username: data.username,
      nama_lengkap: data.nama_lengkap,
    },
    app_metadata: { peran: "instruktur" },
  });

  if (created.error || !created.data.user) {
    const emailTaken = created.error?.message
      .toLowerCase()
      .includes("already");

    return {
      ok: false,
      message: emailTaken
        ? "Email sudah dipakai."
        : "Akun instruktur belum dapat dibuat. Coba lagi.",
      fieldErrors: emailTaken ? { email: "Email sudah dipakai." } : undefined,
    };
  }

  const userId = created.data.user.id;

  const penggunaResult = await admin.from("pengguna").upsert(
    {
      id: userId,
      username: data.username,
      email,
      nama_lengkap: data.nama_lengkap,
      peran: "instruktur",
      telepon: nullable(data.telepon),
      aktif: true,
    },
    { onConflict: "id" },
  );

  if (penggunaResult.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Profil akun belum dapat disimpan. Coba lagi.",
    };
  }

  const penugasanResult = await admin
    .from("instruktur")
    .insert({
      pengguna_id: userId,
      perusahaan_id: data.perusahaan_id,
      peran: data.peran,
      jabatan: nullable(data.jabatan),
      telepon: nullable(data.telepon_instruktur),
      aktif: true,
    })
    .select("id")
    .single();

  if (penugasanResult.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Penugasan pertama belum dapat disimpan. Coba lagi.",
    };
  }

  revalidateInstruktur(userId);
  revalidatePath("/admin/perusahaan");
  revalidatePath(`/admin/perusahaan/${data.perusahaan_id}`);

  return { ok: true, id: userId };
}

export async function updateInstrukturAction(
  penggunaId: unknown,
  input: unknown,
): Promise<InstrukturActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(penggunaId);
  const parsed = instrukturFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data instruktur tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data instruktur.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("pengguna")
    .select("id, username, email, peran")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (
    currentError ||
    !current ||
    current.peran !== "instruktur"
  ) {
    return { ok: false, message: "Instruktur tidak ditemukan." };
  }

  const data: InstrukturFormInput = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
    penggunaId: current.id,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data instruktur.",
      fieldErrors: unique.fields,
    };
  }

  if (current.email !== email) {
    const authResult = await admin.auth.admin.updateUserById(current.id, {
      email,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        nama_lengkap: data.nama_lengkap,
      },
    });

    if (authResult.error) {
      const emailTaken = authResult.error.message
        .toLowerCase()
        .includes("already");

      return {
        ok: false,
        message: emailTaken
          ? "Email sudah dipakai."
          : "Akun instruktur belum dapat diperbarui. Coba lagi.",
        fieldErrors: emailTaken ? { email: "Email sudah dipakai." } : undefined,
      };
    }
  }

  const penggunaResult = await admin
    .from("pengguna")
    .update({
      username: data.username,
      email,
      nama_lengkap: data.nama_lengkap,
      telepon: nullable(data.telepon),
    })
    .eq("id", current.id);

  if (penggunaResult.error) {
    return { ok: false, message: "Profil akun belum dapat diperbarui." };
  }

  revalidateInstruktur(current.id);
  revalidatePath("/admin/perusahaan");

  return { ok: true, id: current.id };
}

export async function setInstrukturAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<InstrukturActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data instruktur tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("pengguna")
    .update({ aktif: input.aktif })
    .eq("id", parsedId.data)
    .eq("peran", "instruktur")
    .select("id")
    .maybeSingle();

  if (result.error) {
    return {
      ok: false,
      message: "Status akun belum dapat diperbarui. Coba lagi.",
    };
  }

  if (!result.data) {
    return { ok: false, message: "Instruktur tidak ditemukan." };
  }

  revalidateInstruktur(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function savePenugasanAction(
  penggunaId: unknown,
  penugasanId: unknown,
  input: unknown,
): Promise<InstrukturActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedPengguna = idSchema.safeParse(penggunaId);
  const parsedPenugasan =
    penugasanId === null || penugasanId === ""
      ? null
      : idSchema.safeParse(penugasanId);
  const parsed = penugasanSchema.safeParse(input);

  if (
    !parsedPengguna.success ||
    (parsedPenugasan && !parsedPenugasan.success)
  ) {
    return { ok: false, message: "Data penugasan tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data penugasan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: pengguna, error: penggunaError } = await admin
    .from("pengguna")
    .select("id, peran")
    .eq("id", parsedPengguna.data)
    .maybeSingle();

  if (
    penggunaError ||
    !pengguna ||
    pengguna.peran !== "instruktur"
  ) {
    return { ok: false, message: "Instruktur tidak ditemukan." };
  }

  const data = parsed.data;

  if (parsedPenugasan) {
    const { data: current, error: currentError } = await admin
      .from("instruktur")
      .select("id, pengguna_id, perusahaan_id")
      .eq("id", parsedPenugasan.data)
      .eq("pengguna_id", pengguna.id)
      .maybeSingle();

    if (currentError || !current) {
      return { ok: false, message: "Penugasan tidak ditemukan." };
    }

    const result = await admin
      .from("instruktur")
      .update({
        peran: data.peran,
        jabatan: nullable(data.jabatan),
        telepon: nullable(data.telepon),
      })
      .eq("id", current.id)
      .select("id, perusahaan_id")
      .maybeSingle();

    if (result.error) {
      return { ok: false, message: "Penugasan belum dapat diperbarui." };
    }

    if (!result.data) {
      return { ok: false, message: "Penugasan tidak ditemukan." };
    }

    revalidateInstruktur(pengguna.id);
    revalidatePath("/admin/perusahaan");
    revalidatePath(`/admin/perusahaan/${result.data.perusahaan_id}`);

    return { ok: true, id: result.data.id };
  }

  const { data: perusahaan, error: perusahaanError } = await admin
    .from("perusahaan")
    .select("id, aktif")
    .eq("id", data.perusahaan_id)
    .maybeSingle();

  if (perusahaanError || !perusahaan) {
    return {
      ok: false,
      message: "Periksa kembali data penugasan.",
      fieldErrors: { perusahaan_id: "Perusahaan tidak ditemukan." },
    };
  }

  if (!perusahaan.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data penugasan.",
      fieldErrors: {
        perusahaan_id: "Perusahaan sedang nonaktif. Aktifkan perusahaan dulu.",
      },
    };
  }

  const { data: duplicate, error: duplicateError } = await admin
    .from("instruktur")
    .select("id, aktif")
    .eq("pengguna_id", pengguna.id)
    .eq("perusahaan_id", data.perusahaan_id)
    .maybeSingle();

  if (duplicateError) {
    return { ok: false, message: "Penugasan belum dapat diperiksa." };
  }

  if (duplicate) {
    return {
      ok: false,
      message: "Periksa kembali data penugasan.",
      fieldErrors: {
        perusahaan_id: duplicate.aktif
          ? "Perusahaan ini sudah terhubung."
          : "Perusahaan ini sudah terhubung tetapi nonaktif. Aktifkan penugasan yang ada.",
      },
    };
  }

  const result = await admin
    .from("instruktur")
    .insert({
      pengguna_id: pengguna.id,
      perusahaan_id: data.perusahaan_id,
      peran: data.peran,
      jabatan: nullable(data.jabatan),
      telepon: nullable(data.telepon),
      aktif: true,
    })
    .select("id")
    .single();

  if (result.error) {
    return { ok: false, message: "Penugasan belum dapat disimpan. Coba lagi." };
  }

  revalidateInstruktur(pengguna.id);
  revalidatePath("/admin/perusahaan");
  revalidatePath(`/admin/perusahaan/${data.perusahaan_id}`);

  return { ok: true, id: result.data.id };
}

export async function setPenugasanAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<InstrukturActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data penugasan tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("instruktur")
    .update({ aktif: input.aktif })
    .eq("id", parsedId.data)
    .select("id, pengguna_id, perusahaan_id")
    .maybeSingle();

  if (result.error) {
    return {
      ok: false,
      message: "Status penugasan belum dapat diperbarui. Coba lagi.",
    };
  }

  if (!result.data) {
    return { ok: false, message: "Penugasan tidak ditemukan." };
  }

  revalidateInstruktur(result.data.pengguna_id);
  revalidatePath("/admin/perusahaan");
  revalidatePath(`/admin/perusahaan/${result.data.perusahaan_id}`);

  return { ok: true, id: result.data.id };
}
