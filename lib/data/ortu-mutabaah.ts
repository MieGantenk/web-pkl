import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import {
  getMutabaahReview,
  type MutabaahData,
  type MutabaahFormSummary,
} from "@/lib/data/siswa-mutabaah";
import { createClient } from "@/lib/supabase/server";

export type OrtuMutabaahChild = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
  hubungan: "ayah" | "ibu" | "wali";
};

export type OrtuMutabaahData = MutabaahData & {
  children: OrtuMutabaahChild[];
  activeChild: OrtuMutabaahChild | null;
  forms: MutabaahFormSummary[];
  selectedFormId: string | null;
};

export const getOrtuMutabaah = cache(
  async (
    penggunaId: string,
    selectedChildId?: string,
    selectedFormId?: string,
  ): Promise<OrtuMutabaahData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const empty: MutabaahData = {
      today,
      form: null,
      questions: [],
      todayEntry: null,
      week: { filled: 0, total: 7 },
      history: [],
    };

    const { data: links, error: linksError } = await supabase
      .from("orang_tua_siswa")
      .select("siswa_id, hubungan")
      .eq("pengguna_id", penggunaId)
      .order("created_at", { ascending: true });

    if (linksError) {
      throw new Error("Gagal memuat data anak.");
    }

    const linksData = links ?? [];
    const childIds = linksData.map((link) => link.siswa_id);
    const hubunganByChild = new Map(
      linksData.map((link) => [link.siswa_id, link.hubungan]),
    );

    let rows: Array<{
      id: string;
      nis: string;
      kelas: string | null;
      jurusan: { nama: string } | null;
      pengguna: { nama_lengkap: string } | null;
    }> = [];

    if (childIds.length) {
      const { data, error } = await supabase
        .from("siswa")
        .select(
          "id, nis, kelas, jurusan:jurusan_id(nama), pengguna:pengguna_id(nama_lengkap)",
        )
        .in("id", childIds)
        .eq("aktif", true);

      if (error) {
        throw new Error("Gagal memuat profil anak.");
      }

      rows = data ?? [];
    }

    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const children: OrtuMutabaahChild[] = childIds.flatMap((id) => {
      const row = rowsById.get(id);

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
          hubungan: hubunganByChild.get(id) ?? "wali",
        },
      ];
    });

    const activeChild =
      children.find((child) => child.id === selectedChildId) ??
      children[0] ??
      null;

    if (!activeChild) {
      return {
        children,
        activeChild: null,
        forms: [],
        selectedFormId: null,
        ...empty,
      };
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan:pengajuan_id(status, periode_id)")
      .eq("siswa_id", activeChild.id)
      .order("created_at", { ascending: false });

    if (membershipError) {
      throw new Error("Gagal memuat penempatan PKL anak.");
    }

    const activePlacement = (memberships ?? [])
      .map((membership) => membership.pengajuan)
      .find((pengajuan) => pengajuan?.status === "berlangsung");

    const review = await getMutabaahReview(
      activeChild.id,
      selectedFormId,
      activePlacement?.periode_id ?? undefined,
    );

    return {
      children,
      activeChild,
      forms: review.forms,
      selectedFormId: review.selectedFormId,
      ...review.data,
    };
  },
);
