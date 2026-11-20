"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createGuruSchema,
  guruFormSchema,
  type GuruFormInput,
} from "@/lib/validators/guru";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";

export type GuruActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data guru tidak valid.");

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidateGuru(id?: string) {
  revalidatePath("/admin/guru");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/admin/guru/${id}`);
  }
}

async function checkUnique(input: {
  username: string;
  email: string;
  nip: string;
  nuptk: string;
  penggunaId?: string;
  guruId?: string;
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
  const nipQuery = input.nip
    ? admin.from("guru").select("id").eq("nip", input.nip)
    : null;
  const nuptkQuery = input.nuptk
    ? admin.from("guru").select("id").eq("nuptk", input.nuptk)
    : null;

  if (input.penggunaId) {
    usernameQuery.neq("id", input.penggunaId);
    emailQuery.neq("id", input.penggunaId);
  }

  if (input.guruId) {
    nipQuery?.neq("id", input.guruId);
    nuptkQuery?.neq("id", input.guruId);
  }

  const [usernameResult, emailResult, nipResult, nuptkResult] =
    await Promise.all([
      usernameQuery.maybeSingle(),
      emailQuery.maybeSingle(),
      nipQuery?.maybeSingle() ?? Promise.resolve({ data: null, error: null }),
      nuptkQuery?.maybeSingle() ?? Promise.resolve({ data: null, error: null }),
    ]);

  if (
    usernameResult.error ||
    emailResult.error ||
    nipResult.error ||
    nuptkResult.error
  ) {
    return { fields, failed: true };
  }

  if (usernameResult.data) {
    fields.username = "Username sudah dipakai.";
  }

  if (emailResult.data) {
    fields.email = "Email sudah dipakai.";
  }

  if (nipResult.data) {
    fields.nip = "NIP sudah dipakai.";
  }

  if (nuptkResult.data) {
    fields.nuptk = "NUPTK sudah dipakai.";
  }

  return { fields, failed: false };
}

export async function createGuruAction(
  input: unknown,
): Promise<GuruActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = createGuruSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data guru.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: GuruFormInput = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
    nip: data.nip,
    nuptk: data.nuptk,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data guru.",
      fieldErrors: unique.fields,
    };
  }

  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password: data.password ?? "",
    email_confirm: true,
    user_metadata: {
      username: data.username,
      nama_lengkap: data.nama_lengkap,
    },
    app_metadata: { peran: "guru" },
  });

  if (created.error || !created.data.user) {
    const emailTaken = created.error?.message
      .toLowerCase()
      .includes("already");

    return {
      ok: false,
      message: emailTaken
        ? "Email sudah dipakai."
        : "Akun guru belum dapat dibuat. Coba lagi.",
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
      peran: "guru",
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

  const guruResult = await admin
    .from("guru")
    .insert({
      pengguna_id: userId,
      nip: nullable(data.nip),
      nuptk: nullable(data.nuptk),
      jabatan: nullable(data.jabatan),
      jurusan_id: data.jurusan_id || null,
    })
    .select("id")
    .single();

  if (guruResult.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Data guru belum dapat disimpan. Periksa NIP/NUPTK.",
    };
  }

  revalidateGuru(guruResult.data.id);
  return { ok: true, id: guruResult.data.id };
}

export async function updateGuruAction(
  guruId: unknown,
  input: unknown,
): Promise<GuruActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(guruId);
  const parsed = guruFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data guru tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data guru.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("guru")
    .select("id, pengguna_id, pengguna:pengguna_id(email, peran)")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (currentError || !current || current.pengguna?.peran !== "guru") {
    return { ok: false, message: "Guru tidak ditemukan." };
  }

  const data: GuruFormInput = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
    nip: data.nip,
    nuptk: data.nuptk,
    penggunaId: current.pengguna_id,
    guruId: current.id,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data guru.",
      fieldErrors: unique.fields,
    };
  }

  if (current.pengguna.email !== email) {
    const authResult = await admin.auth.admin.updateUserById(
      current.pengguna_id,
      {
        email,
        email_confirm: true,
        user_metadata: {
          username: data.username,
          nama_lengkap: data.nama_lengkap,
        },
      },
    );

    if (authResult.error) {
      const emailTaken = authResult.error.message
        .toLowerCase()
        .includes("already");

      return {
        ok: false,
        message: emailTaken
          ? "Email sudah dipakai."
          : "Akun guru belum dapat diperbarui. Coba lagi.",
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
    .eq("id", current.pengguna_id);

  if (penggunaResult.error) {
    return { ok: false, message: "Profil akun belum dapat diperbarui." };
  }

  const guruResult = await admin
    .from("guru")
    .update({
      nip: nullable(data.nip),
      nuptk: nullable(data.nuptk),
      jabatan: nullable(data.jabatan),
      jurusan_id: data.jurusan_id || null,
    })
    .eq("id", current.id);

  if (guruResult.error) {
    return { ok: false, message: "Data guru belum dapat diperbarui." };
  }

  revalidateGuru(current.id);
  return { ok: true, id: current.id };
}

export async function setGuruAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<GuruActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data guru tidak valid." };
  }

  const admin = createAdminClient();
  const { data: current, error } = await admin
    .from("guru")
    .select("id, pengguna_id, pengguna:pengguna_id(peran)")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.pengguna?.peran !== "guru") {
    return { ok: false, message: "Guru tidak ditemukan." };
  }

  const { error: penggunaError } = await admin
    .from("pengguna")
    .update({ aktif: input.aktif })
    .eq("id", current.pengguna_id);

  if (penggunaError) {
    return {
      ok: false,
      message: "Status akun belum dapat diperbarui. Coba lagi.",
    };
  }

  revalidateGuru(current.id);
  return { ok: true, id: current.id };
}
