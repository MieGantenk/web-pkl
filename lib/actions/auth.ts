"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/auth";
import { roleHome, type Role } from "@/lib/navigation";

export type LoginResult = { ok: true } | { ok: false; message: string };

const LOGIN_ERROR = "ID atau kata sandi tidak cocok.";

export async function loginAction(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: LOGIN_ERROR };
  }

  const identifier = parsed.data.identifier.trim();
  let email = identifier.includes("@") ? identifier.toLowerCase() : "";

  // Username dicari di server. Email tidak pernah dikirim ke browser.
  if (!email) {
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("pengguna")
      .select("email, aktif")
      .eq("username", identifier)
      .maybeSingle();

    if (!account || !account.aktif) {
      return { ok: false, message: LOGIN_ERROR };
    }

    email = account.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, message: LOGIN_ERROR };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.aktif) {
    await supabase.auth.signOut();
    return { ok: false, message: LOGIN_ERROR };
  }

  redirect(roleHome[profile.peran as Role]);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
