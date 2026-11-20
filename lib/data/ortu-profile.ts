import { cache } from "react";
import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type OrtuProfileChild = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
  hubungan: "ayah" | "ibu" | "wali";
  aktif: boolean;
};

export type OrtuProfileData = {
  profile: {
    id: string;
    username: string;
    email: string;
    nama_lengkap: string;
    telepon: string | null;
    avatar_url: string | null;
    aktif: boolean;
  };
  children: OrtuProfileChild[];
};

export const getOrtuProfile = cache(
  async (penggunaId: string): Promise<OrtuProfileData> => {
    await connection();

    const supabase = await createClient();
    const admin = createAdminClient();

    const [linksRes, profileRes] = await Promise.all([
      supabase
        .from("orang_tua_siswa")
        .select("siswa_id, hubungan")
        .eq("pengguna_id", penggunaId)
        .order("created_at", { ascending: true }),
      admin
        .from("pengguna")
        .select("id, username, email, nama_lengkap, telepon, avatar_url, aktif")
        .eq("id", penggunaId)
        .maybeSingle(),
    ]);

    if (linksRes.error) {
      throw new Error("Gagal memuat data anak.");
    }

    if (profileRes.error || !profileRes.data) {
      throw new Error("Gagal memuat profil orang tua.");
    }

    const links = linksRes.data ?? [];
    const childIds = links.map((link) => link.siswa_id);
    let rows: Array<{
      id: string;
      nis: string;
      kelas: string | null;
      aktif: boolean;
      jurusan: { nama: string } | null;
      pengguna: { nama_lengkap: string } | null;
    }> = [];

    if (childIds.length) {
      const { data, error } = await supabase
        .from("siswa")
        .select(
          "id, nis, kelas, aktif, jurusan:jurusan_id(nama), pengguna:pengguna_id(nama_lengkap)",
        )
        .in("id", childIds);

      if (error) {
        throw new Error("Gagal memuat profil anak.");
      }

      rows = data ?? [];
    }

    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const children: OrtuProfileChild[] = links.flatMap((link) => {
      const row = rowsById.get(link.siswa_id);

      if (!row) {
        return [];
      }

      return [
        {
          id: row.id,
          nama: row.pengguna?.nama_lengkap ?? "Siswa",
          nis: row.nis,
          kelas: row.kelas,
          jurusan: row.jurusan,
          hubungan: link.hubungan,
          aktif: row.aktif,
        },
      ];
    });

    return { profile: profileRes.data, children };
  },
);
