import { cache } from "react";
import { connection } from "next/server";

import type {
  JenisSurat,
  StatusPengajuan,
  StatusSurat,
} from "@/lib/status";
import { studentSuratTypes } from "@/lib/surat";
import { createClient } from "@/lib/supabase/server";

export type OrtuSuratChild = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
  hubungan: "ayah" | "ibu" | "wali";
};

export type OrtuSuratLetter = {
  id: string;
  jenis: JenisSurat;
  nomor: string | null;
  tanggalTerbit: string | null;
  status: StatusSurat;
};

export type OrtuSuratData = {
  children: OrtuSuratChild[];
  activeChild: OrtuSuratChild | null;
  application: {
    id: string;
    status: StatusPengajuan;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
    perusahaan: { nama: string; kota: string | null } | null;
    periode: { nama: string } | null;
  } | null;
  letters: OrtuSuratLetter[];
};

export const getOrtuSurat = cache(
  async (
    penggunaId: string,
    selectedChildId?: string,
  ): Promise<OrtuSuratData> => {
    await connection();

    const supabase = await createClient();
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
    const children: OrtuSuratChild[] = childIds.flatMap((id) => {
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
        application: null,
        letters: [],
      };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .eq("siswa_id", activeChild.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new Error("Gagal memuat pengajuan anak.");
    }

    if (!membership) {
      return {
        children,
        activeChild,
        application: null,
        letters: [],
      };
    }

    const [applicationRes, lettersRes] = await Promise.all([
      supabase
        .from("pengajuan_pkl")
        .select(
          "id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
        )
        .eq("id", membership.pengajuan_id)
        .maybeSingle(),
      supabase
        .from("surat")
        .select("id, jenis, nomor, tanggal_terbit, status")
        .eq("pengajuan_id", membership.pengajuan_id)
        .in("jenis", [...studentSuratTypes])
        .eq("status", "terbit")
        .order("tanggal_terbit", { ascending: false }),
    ]);

    if (applicationRes.error || lettersRes.error) {
      throw new Error("Gagal memuat surat anak.");
    }

    const application = applicationRes.data;

    if (!application) {
      return {
        children,
        activeChild,
        application: null,
        letters: [],
      };
    }

    return {
      children,
      activeChild,
      application: {
        id: application.id,
        status: application.status,
        tanggalMulai: application.tanggal_mulai,
        tanggalSelesai: application.tanggal_selesai,
        perusahaan: application.perusahaan,
        periode: application.periode,
      },
      letters: (lettersRes.data ?? []).map((letter) => ({
        id: letter.id,
        jenis: letter.jenis,
        nomor: letter.nomor,
        tanggalTerbit: letter.tanggal_terbit,
        status: letter.status,
      })),
    };
  },
);
