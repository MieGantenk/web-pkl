"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";
import { resetAccountPasswordSchema } from "@/lib/validators/password";

export type AccountPasswordResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data akun tidak valid.");

export async function resetAccountPasswordAction(
  penggunaId: unknown,
  input: unknown,
): Promise<AccountPasswordResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(penggunaId);
  const parsed = resetAccountPasswordSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data akun tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali kata sandi.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("pengguna")
    .select("id, peran")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !account) {
    return { ok: false, message: "Akun tidak ditemukan." };
  }

  const result = await admin.auth.admin.updateUserById(account.id, {
    password: parsed.data.password,
  });

  if (result.error) {
    return {
      ok: false,
      message: result.error.message.toLowerCase().includes("weak")
        ? "Kata sandi terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol."
        : "Kata sandi belum dapat diperbarui. Coba lagi.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await admin.from("log_aktivitas").insert({
        pengguna_id: user.id,
        aksi: "atur_ulang_kata_sandi",
        entitas: "pengguna",
        entitas_id: account.id,
        detail: { peran: account.peran },
      });
    }
  } catch {
    // Audit log tidak boleh menggagalkan perubahan kata sandi.
  }

  revalidatePath("/admin/siswa");
  revalidatePath("/admin/guru");
  revalidatePath("/admin/instruktur");
  revalidatePath("/admin/orang-tua");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");

  return { ok: true, id: account.id };
}
