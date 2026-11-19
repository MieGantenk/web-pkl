import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function assertAdminAction(): Promise<{
  ok: false;
  message: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.aktif || profile.peran !== "admin") {
    return { ok: false, message: "Anda tidak berwenang." };
  }

  return null;
}
