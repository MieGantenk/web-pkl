"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  passwordSchema,
  type PasswordResult,
} from "@/lib/validators/password";
import { siswaProfileSchema } from "@/lib/validators/siswa-profile";

export type SiswaProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function updateSiswaProfileAction(
  input: unknown,
): Promise<SiswaProfileResult> {
  const parsed = siswaProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data kontak tidak valid.",
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

  if (!profile?.aktif || profile.peran !== "siswa") {
    return { ok: false, message: "Anda tidak berwenang mengubah kontak ini." };
  }

  const { data: siswa } = await supabase
    .from("siswa")
    .select("id")
    .eq("pengguna_id", user.id)
    .maybeSingle();

  if (!siswa) {
    return {
      ok: false,
      message: "Data siswa tidak ditemukan. Hubungi admin sekolah.",
    };
  }

  const { error } = await supabase
    .from("siswa")
    .update({
      telepon: parsed.data.telepon || null,
      alamat: parsed.data.alamat || null,
    })
    .eq("id", siswa.id)
    .eq("pengguna_id", user.id);

  if (error) {
    return { ok: false, message: "Gagal menyimpan kontak. Coba lagi." };
  }

  revalidatePath("/siswa/profil");
  revalidatePath("/siswa");

  return { ok: true, message: "Kontak diperbarui." };
}

export async function changeSiswaPasswordAction(
  input: unknown,
): Promise<PasswordResult> {
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

  if (!profile?.aktif || profile.peran !== "siswa") {
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
