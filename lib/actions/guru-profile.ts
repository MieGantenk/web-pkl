"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { guruProfileSchema } from "@/lib/validators/guru-profile";
import { passwordSchema } from "@/lib/validators/password";

export type GuruProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type GuruPasswordResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      field?: "currentPassword" | "newPassword";
    };

export async function updateGuruProfileAction(
  input: unknown,
): Promise<GuruProfileResult> {
  const parsed = guruProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data profil tidak valid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesi Anda berakhir. Silakan masuk lagi." };
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.aktif || profile.peran !== "guru") {
    return { ok: false, message: "Anda tidak berwenang mengubah profil ini." };
  }

  const { error } = await supabase
    .from("pengguna")
    .update({
      nama_lengkap: parsed.data.nama_lengkap,
      telepon: parsed.data.telepon || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Gagal menyimpan profil. Coba lagi." };
  }

  revalidatePath("/guru/profil");
  revalidatePath("/guru");

  return { ok: true, message: "Profil diperbarui." };
}

export async function changeGuruPasswordAction(
  input: unknown,
): Promise<GuruPasswordResult> {
  const parsed = passwordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data kata sandi tidak valid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesi Anda berakhir. Silakan masuk lagi." };
  }

  if (!user.email) {
    return {
      ok: false,
      message: "Email akun tidak ditemukan. Hubungi admin sekolah.",
    };
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.aktif || profile.peran !== "guru") {
    return { ok: false, message: "Anda tidak berwenang mengubah kata sandi." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError) {
    return {
      ok: false,
      message: "Kata sandi saat ini tidak cocok.",
      field: "currentPassword",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      ok: false,
      message:
        updateError.code === "weak_password"
          ? "Kata sandi baru terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol."
          : "Gagal memperbarui kata sandi. Coba lagi.",
      field: "newPassword",
    };
  }

  return { ok: true, message: "Kata sandi diperbarui." };
}
