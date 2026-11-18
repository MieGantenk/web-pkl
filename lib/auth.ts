import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { roleHome, type Role } from "@/lib/navigation";
import type { Profile } from "@/lib/profile";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("pengguna")
    .select("id, nama_lengkap, peran, avatar_url, aktif")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile || !profile.aktif) {
    redirect("/login");
  }

  return profile;
}

export async function requireRole(role: Role) {
  const profile = await requireProfile();

  if (profile.peran !== role) {
    redirect(roleHome[profile.peran]);
  }

  return profile;
}
