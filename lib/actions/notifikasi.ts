"use server";

import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { postgresUuidPattern } from "@/lib/validators/common";

export type NotifikasiActionResult =
  | { ok: true }
  | { ok: false; message: string };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Notifikasi tidak valid.");

export async function markNotificationReadAction(
  id: unknown,
): Promise<NotifikasiActionResult> {
  const profile = await getCurrentProfile();

  if (!profile?.aktif) {
    return { ok: false, message: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    return { ok: false, message: "Notifikasi tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifikasi")
    .update({ dibaca: true })
    .eq("id", parsed.data)
    .eq("pengguna_id", profile.id);

  if (error) {
    return { ok: false, message: "Notifikasi belum dapat diperbarui." };
  }

  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotifikasiActionResult> {
  const profile = await getCurrentProfile();

  if (!profile?.aktif) {
    return { ok: false, message: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifikasi")
    .update({ dibaca: true })
    .eq("pengguna_id", profile.id)
    .eq("dibaca", false);

  if (error) {
    return { ok: false, message: "Notifikasi belum dapat diperbarui." };
  }

  return { ok: true };
}
