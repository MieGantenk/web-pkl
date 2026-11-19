"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSiswaSchema,
  fieldErrorsFrom,
  postgresUuidPattern,
  siswaFormSchema,
} from "@/lib/validators/siswa";

export type SiswaActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data siswa tidak valid.");

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function revalidateSiswa(id?: string) {
  revalidatePath("/admin/siswa");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/admin/siswa/${id}`);
  }
}

async function checkUnique(input: {
  username: string;
  email: string;
  nis: string;
  nisn: string;
  penggunaId?: string;
  siswaId?: string;
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
  const nisQuery = admin.from("siswa").select("id").eq("nis", input.nis);
  const nisnQuery = input.nisn
    ? admin.from("siswa").select("id").eq("nisn", input.nisn)
    : null;

  if (input.penggunaId) {
    usernameQuery.neq("id", input.penggunaId);
    emailQuery.neq("id", input.penggunaId);
  }

  if (input.siswaId) {
    nisQuery.neq("id", input.siswaId);
    nisnQuery?.neq("id", input.siswaId);
  }

  const [usernameResult, emailResult, nisResult, nisnResult] =
    await Promise.all([
      usernameQuery.maybeSingle(),
      emailQuery.maybeSingle(),
      nisQuery.maybeSingle(),
      nisnQuery?.maybeSingle() ?? Promise.resolve({ data: null, error: null }),
    ]);

  if (usernameResult.error || emailResult.error || nisResult.error) {
    return { fields, failed: true };
  }

  if (usernameResult.data) {
    fields.username = "Username sudah dipakai.";
  }

  if (emailResult.data) {
    fields.email = "Email sudah dipakai.";
  }

  if (nisResult.data) {
    fields.nis = "NIS sudah dipakai.";
  }

  if (nisnResult.data) {
    fields.nisn = "NISN sudah dipakai.";
  }

  return { fields, failed: false };
}

export async function createSiswaAction(
  input: unknown,
): Promise<SiswaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = createSiswaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data siswa.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
    nis: data.nis,
    nisn: data.nisn,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data siswa.",
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
    app_metadata: { peran: "siswa" },
  });

  if (created.error || !created.data.user) {
    const emailTaken = created.error?.message
      .toLowerCase()
      .includes("already");

    return {
      ok: false,
      message: emailTaken
        ? "Email sudah dipakai."
        : "Akun siswa belum dapat dibuat. Coba lagi.",
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
      peran: "siswa",
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

  const siswaResult = await admin
    .from("siswa")
    .insert({
      pengguna_id: userId,
      nis: data.nis,
      nisn: nullable(data.nisn),
      kelas: nullable(data.kelas),
      jurusan_id: data.jurusan_id || null,
      telepon: nullable(data.telepon),
      alamat: nullable(data.alamat),
      nama_orangtua: nullable(data.nama_orangtua),
      telepon_orangtua: nullable(data.telepon_orangtua),
      aktif: true,
    })
    .select("id")
    .single();

  if (siswaResult.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Data siswa belum dapat disimpan. Periksa NIS/NISN.",
    };
  }

  revalidateSiswa(siswaResult.data.id);
  return { ok: true, id: siswaResult.data.id };
}

export async function updateSiswaAction(
  siswaId: unknown,
  input: unknown,
): Promise<SiswaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(siswaId);
  const parsed = siswaFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data siswa tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data siswa.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("siswa")
    .select(
      "id, pengguna_id, pengguna:pengguna_id(email, peran)",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (currentError || !current || current.pengguna?.peran !== "siswa") {
    return { ok: false, message: "Siswa tidak ditemukan." };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const unique = await checkUnique({
    username: data.username,
    email,
    nis: data.nis,
    nisn: data.nisn,
    penggunaId: current.pengguna_id,
    siswaId: current.id,
  });

  if (unique.failed) {
    return { ok: false, message: "Data belum dapat diperiksa. Coba lagi." };
  }

  if (Object.keys(unique.fields).length) {
    return {
      ok: false,
      message: "Periksa kembali data siswa.",
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
          : "Akun siswa belum dapat diperbarui. Coba lagi.",
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
    })
    .eq("id", current.pengguna_id);

  if (penggunaResult.error) {
    return { ok: false, message: "Profil akun belum dapat diperbarui." };
  }

  const siswaResult = await admin
    .from("siswa")
    .update({
      nis: data.nis,
      nisn: nullable(data.nisn),
      kelas: nullable(data.kelas),
      jurusan_id: data.jurusan_id || null,
      telepon: nullable(data.telepon),
      alamat: nullable(data.alamat),
      nama_orangtua: nullable(data.nama_orangtua),
      telepon_orangtua: nullable(data.telepon_orangtua),
    })
    .eq("id", current.id);

  if (siswaResult.error) {
    return { ok: false, message: "Data siswa belum dapat diperbarui." };
  }

  revalidateSiswa(current.id);
  return { ok: true, id: current.id };
}

export async function setSiswaAktifAction(input: {
  id: string;
  aktif: boolean;
}): Promise<SiswaActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(input.id);

  if (!parsedId.success || typeof input.aktif !== "boolean") {
    return { ok: false, message: "Data siswa tidak valid." };
  }

  const admin = createAdminClient();
  const { data: current, error } = await admin
    .from("siswa")
    .select("id, pengguna_id, pengguna:pengguna_id(peran)")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.pengguna?.peran !== "siswa") {
    return { ok: false, message: "Siswa tidak ditemukan." };
  }

  const [penggunaResult, siswaResult] = await Promise.all([
    admin
      .from("pengguna")
      .update({ aktif: input.aktif })
      .eq("id", current.pengguna_id),
    admin
      .from("siswa")
      .update({ aktif: input.aktif })
      .eq("id", current.id),
  ]);

  if (penggunaResult.error || siswaResult.error) {
    return {
      ok: false,
      message: "Status akun belum dapat diperbarui. Coba lagi.",
    };
  }

  revalidateSiswa(current.id);
  return { ok: true, id: current.id };
}
