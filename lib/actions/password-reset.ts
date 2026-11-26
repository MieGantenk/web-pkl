"use server";

import { z } from "zod";

import { generateSecurePassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

export type PasswordResetResult =
  | { ok: true; password: string }
  | { ok: false; message: string };

const resetSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Masukkan username atau email.")
    .max(255, "Username atau email terlalu panjang."),
  email: z
    .string()
    .trim()
    .min(1, "Masukkan email akun.")
    .email("Format email tidak valid.")
    .max(255, "Email terlalu panjang."),
});

const RATE_LIMIT = 3;

export async function resetPasswordFromLoginAction(
  input: unknown,
): Promise<PasswordResetResult> {
  const parsed = resetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data akun tidak valid.",
    };
  }

  const admin = createAdminClient();
  const identifier = parsed.data.identifier.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const [byUsername, byEmail] = await Promise.all([
    admin
      .from("pengguna")
      .select("id, email, aktif")
      .eq("username", identifier)
      .maybeSingle(),
    admin
      .from("pengguna")
      .select("id, email, aktif")
      .eq("email", identifier.toLowerCase())
      .maybeSingle(),
  ]);
  const account = byUsername.data ?? byEmail.data;
  const error = byUsername.error ?? byEmail.error;

  if (
    error ||
    !account ||
    !account.aktif ||
    account.email.toLowerCase() !== email
  ) {
    return {
      ok: false,
      message: "Username dan email tidak cocok dengan akun aktif.",
    };
  }

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("log_aktivitas")
    .select("id", { count: "exact", head: true })
    .eq("aksi", "reset_sandi_mandiri")
    .eq("entitas_id", account.id)
    .gte("created_at", since);

  if (countError) {
    return {
      ok: false,
      message: "Permintaan kata sandi belum dapat diperiksa.",
    };
  }

  if ((count ?? 0) >= RATE_LIMIT) {
    return {
      ok: false,
      message:
        "Terlalu banyak permintaan. Coba lagi dalam 15 menit atau hubungi admin sekolah.",
    };
  }

  const password = generateSecurePassword(16);
  const result = await admin.auth.admin.updateUserById(account.id, {
    password,
  });

  if (result.error) {
    return {
      ok: false,
      message:
        "Kata sandi belum dapat dibuat ulang. Coba lagi atau hubungi admin sekolah.",
    };
  }

  try {
    await admin.from("log_aktivitas").insert({
      pengguna_id: account.id,
      aksi: "reset_sandi_mandiri",
      entitas: "pengguna",
      entitas_id: account.id,
      detail: { sumber: "halaman_login" },
    });
  } catch {
    // Audit log tidak boleh menggagalkan reset.
  }

  return { ok: true, password };
}
