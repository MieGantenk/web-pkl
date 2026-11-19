import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export type JurusanOption = { id: string; nama: string };

export const getJurusanOptions = cache(async (): Promise<JurusanOption[]> => {
  await connection();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jurusan")
    .select("id, nama")
    .order("nama", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat data jurusan.");
  }

  return data ?? [];
});
