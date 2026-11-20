import { cache } from "react";
import { connection } from "next/server";

import { getGuruContext, type GuruContext } from "@/lib/data/guru";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuruProfileData = {
  profile: {
    id: string;
    username: string;
    email: string;
    nama_lengkap: string;
    telepon: string | null;
    avatar_url: string | null;
    aktif: boolean;
  };
  guru: GuruContext;
};

export const getGuruProfile = cache(
  async (penggunaId: string): Promise<GuruProfileData | null> => {
    await connection();

    const guru = await getGuruContext(penggunaId);

    if (!guru) {
      return null;
    }

    // Kolom email/telepon/username tidak dibuka untuk select client (column grant),
    // jadi profil milik sendiri dibaca di server dengan service role.
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pengguna")
      .select(
        "id, username, email, nama_lengkap, telepon, avatar_url, aktif",
      )
      .eq("id", penggunaId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Gagal memuat profil guru.");
    }

    return { profile: data, guru };
  },
);
