import { cache } from "react";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

export type NotifikasiItem = {
  id: string;
  judul: string;
  pesan: string;
  tautan: string | null;
  dibaca: boolean;
  created_at: string;
};

export type NotifikasiData = {
  items: NotifikasiItem[];
  unreadCount: number;
};

export const getNotifikasi = cache(
  async (penggunaId: string, limit = 12): Promise<NotifikasiData> => {
    await connection();

    const supabase = await createClient();
    const [itemsRes, unreadRes] = await Promise.all([
      supabase
        .from("notifikasi")
        .select("id, judul, pesan, tautan, dibaca, created_at")
        .eq("pengguna_id", penggunaId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("notifikasi")
        .select("id", { count: "exact", head: true })
        .eq("pengguna_id", penggunaId)
        .eq("dibaca", false),
    ]);

    if (itemsRes.error || unreadRes.error) {
      throw new Error("Gagal memuat notifikasi.");
    }

    return {
      items: itemsRes.data ?? [],
      unreadCount: unreadRes.count ?? 0,
    };
  },
);
