import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SiswaProfileData = {
  profile: {
    id: string;
    username: string;
    email: string;
    nama_lengkap: string;
    avatar_url: string | null;
    aktif: boolean;
  };
  siswa: {
    id: string;
    nis: string;
    nisn: string | null;
    kelas: string | null;
    telepon: string | null;
    alamat: string | null;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    aktif: boolean;
    jurusan: { nama: string } | null;
  };
};

export const getSiswaProfile = cache(
  async (penggunaId: string): Promise<SiswaProfileData | null> => {
    await connection();

    const supabase = await createClient();
    const { data: siswa, error } = await supabase
      .from("siswa")
      .select(
        "id, nis, nisn, kelas, telepon, alamat, tempat_lahir, tanggal_lahir, aktif, jurusan:jurusan_id(nama)",
      )
      .eq("pengguna_id", penggunaId)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data siswa.");
    }

    if (!siswa) {
      return null;
    }

    // Username dan email tidak dibuka untuk select client (column grant),
    // jadi profil milik sendiri dibaca di server dengan service role.
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("pengguna")
      .select("id, username, email, nama_lengkap, avatar_url, aktif")
      .eq("id", penggunaId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error("Gagal memuat akun siswa.");
    }

    return { profile, siswa };
  },
);
