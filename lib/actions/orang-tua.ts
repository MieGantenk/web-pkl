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
  createOrangTuaSchema,
  hubunganSchema,
  orangTuaFormSchema,
  relasiSchema,
  type OrangTuaFormInput,
} from "@/lib/validators/orang-tua";

export type OrangTuaActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data orang tua tidak valid.");

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidateOrangTua(penggunaId?: string) {
  revalidatePath("/admin/orang-tua");
  revalidatePath("/admin");

  if (penggunaId) {
    revalidatePath(`/admin/orang-tua/${penggunaId}`);
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

export async function createOrangTuaAction(
  input: unknown,
): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = createOrangTuaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data orang tua.",
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
      message: "Periksa kembali data orang tua.",
      fieldErrors: unique.fields,
    };
  }

  const admin = createAdminClient();
  const { data: siswa, error: siswaError } = await admin
    .from("siswa")
    .select("id, aktif")
    .eq("id", data.siswa_id)
    .maybeSingle();

  if (siswaError) {
    return { ok: false, message: "Siswa belum dapat diperiksa." };
  }

  if (!siswa || !siswa.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data orang tua.",
      fieldErrors: {
        siswa_id: "Siswa tidak ditemukan atau sedang nonaktif.",
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
    app_metadata: { peran: "ortu" },
  });

  if (created.error || !created.data.user) {
    const emailTaken = created.error?.message
      .toLowerCase()
      .includes("already");

    return {
      ok: false,
      message: emailTaken
        ? "Email sudah dipakai."
        : "Akun orang tua belum dapat dibuat. Coba lagi.",
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
      peran: "ortu",
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

  const relasiResult = await admin.from("orang_tua_siswa").insert({
    pengguna_id: userId,
    siswa_id: data.siswa_id,
    hubungan: data.hubungan,
  });

  if (relasiResult.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Relasi anak belum dapat disimpan. Coba lagi.",
    };
  }

  revalidateOrangTua(userId);
  return { ok: true, id: userId };
}

export async function updateOrangTuaAction(
  penggunaId: unknown,
  input: unknown,
): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(penggunaId);
  const parsed = orangTuaFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data orang tua tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data orang tua.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("pengguna")
    .select("id, username, email, peran")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (currentError || !current || current.peran !== "ortu") {
    return { ok: false, message: "Orang tua tidak ditemukan." };
  }

  const data: OrangTuaFormInput = parsed.data;
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
      message: "Periksa kembali data orang tua.",
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
          : "Akun orang tua belum dapat diperbarui. Coba lagi.",
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

  revalidateOrangTua(current.id);
  return { ok: true, id: current.id };
}

export async function setOrangTuaAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data orang tua tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("pengguna")
    .update({ aktif: input.aktif })
    .eq("id", parsedId.data)
    .eq("peran", "ortu")
    .select("id")
    .maybeSingle();

  if (result.error) {
    return {
      ok: false,
      message: "Status akun belum dapat diperbarui. Coba lagi.",
    };
  }

  if (!result.data) {
    return { ok: false, message: "Orang tua tidak ditemukan." };
  }

  revalidateOrangTua(result.data.id);
  return { ok: true, id: result.data.id };
}

export async function linkOrangTuaAction(
  penggunaId: unknown,
  input: unknown,
): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedPengguna = idSchema.safeParse(penggunaId);
  const parsed = relasiSchema.safeParse(input);

  if (!parsedPengguna.success) {
    return { ok: false, message: "Data orang tua tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data relasi.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: pengguna, error: penggunaError } = await admin
    .from("pengguna")
    .select("id, peran")
    .eq("id", parsedPengguna.data)
    .maybeSingle();

  if (penggunaError || !pengguna || pengguna.peran !== "ortu") {
    return { ok: false, message: "Orang tua tidak ditemukan." };
  }

  const data = parsed.data;
  const { data: siswa, error: siswaError } = await admin
    .from("siswa")
    .select("id, aktif")
    .eq("id", data.siswa_id)
    .maybeSingle();

  if (siswaError || !siswa) {
    return {
      ok: false,
      message: "Periksa kembali data relasi.",
      fieldErrors: { siswa_id: "Siswa tidak ditemukan." },
    };
  }

  if (!siswa.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data relasi.",
      fieldErrors: { siswa_id: "Siswa sedang nonaktif." },
    };
  }

  const { data: duplicate, error: duplicateError } = await admin
    .from("orang_tua_siswa")
    .select("id")
    .eq("pengguna_id", pengguna.id)
    .eq("siswa_id", data.siswa_id)
    .maybeSingle();

  if (duplicateError) {
    return { ok: false, message: "Relasi belum dapat diperiksa." };
  }

  if (duplicate) {
    return {
      ok: false,
      message: "Periksa kembali data relasi.",
      fieldErrors: { siswa_id: "Siswa ini sudah terhubung." },
    };
  }

  const result = await admin
    .from("orang_tua_siswa")
    .insert({
      pengguna_id: pengguna.id,
      siswa_id: data.siswa_id,
      hubungan: data.hubungan,
    })
    .select("id")
    .single();

  if (result.error) {
    return { ok: false, message: "Relasi belum dapat disimpan. Coba lagi." };
  }

  revalidateOrangTua(pengguna.id);
  return { ok: true, id: result.data.id };
}

export async function updateHubunganOrangTuaAction(
  relasiId: unknown,
  penggunaId: unknown,
  hubungan: unknown,
): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedRelasi = idSchema.safeParse(relasiId);
  const parsedPengguna = idSchema.safeParse(penggunaId);
  const parsedHubungan = hubunganSchema.safeParse(hubungan);

  if (
    !parsedRelasi.success ||
    !parsedPengguna.success ||
    !parsedHubungan.success
  ) {
    return { ok: false, message: "Data hubungan tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("orang_tua_siswa")
    .update({ hubungan: parsedHubungan.data })
    .eq("id", parsedRelasi.data)
    .eq("pengguna_id", parsedPengguna.data)
    .select("id, pengguna_id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: "Hubungan belum dapat diperbarui. Coba lagi." };
  }

  if (!result.data) {
    return { ok: false, message: "Hubungan tidak ditemukan." };
  }

  revalidateOrangTua(result.data.pengguna_id);
  return { ok: true, id: result.data.id };
}

export async function unlinkOrangTuaAction(
  relasiId: unknown,
  penggunaId: unknown,
): Promise<OrangTuaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedRelasi = idSchema.safeParse(relasiId);
  const parsedPengguna = idSchema.safeParse(penggunaId);

  if (!parsedRelasi.success || !parsedPengguna.success) {
    return { ok: false, message: "Data relasi tidak valid." };
  }

  const admin = createAdminClient();
  const result = await admin
    .from("orang_tua_siswa")
    .delete()
    .eq("id", parsedRelasi.data)
    .eq("pengguna_id", parsedPengguna.data)
    .select("id, pengguna_id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: "Relasi belum dapat dihapus. Coba lagi." };
  }

  if (!result.data) {
    return { ok: false, message: "Relasi tidak ditemukan." };
  }

  revalidateOrangTua(result.data.pengguna_id);
  return { ok: true, id: result.data.id };
}
