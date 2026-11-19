import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import type {
  JenisSurat,
  StatusJurnal,
  StatusPengajuan,
  StatusSurat,
} from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export type OrtuChild = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  jurusan: { nama: string } | null;
  hubungan: "ayah" | "ibu" | "wali";
};

export type OrtuDashboardData = {
  today: string;
  children: OrtuChild[];
  activeChild: OrtuChild | null;
  pengajuan: {
    id: string;
    status: StatusPengajuan;
    alasan_penolakan: string | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    perusahaan: { nama: string; kota: string | null } | null;
    periode: {
      nama: string;
      tanggal_mulai: string;
      tanggal_selesai: string;
    } | null;
  } | null;
  jurnal: Array<{
    id: string;
    tanggal: string;
    kegiatan: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    status: StatusJurnal;
  }>;
  mutabaah: {
    formNama: string | null;
    terisi: number;
    totalHari: number;
    hariIniTerisi: boolean;
  };
  surat: Array<{
    id: string;
    jenis: JenisSurat;
    nomor: string | null;
    tanggal_terbit: string | null;
    status: StatusSurat;
  }>;
};

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

export const getOrtuDashboard = cache(
  async (
    penggunaId: string,
    selectedChildId?: string,
  ): Promise<OrtuDashboardData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();

    const [linksRes, periodRes] = await Promise.all([
      supabase
        .from("orang_tua_siswa")
        .select("siswa_id, hubungan")
        .eq("pengguna_id", penggunaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("periode_pkl")
        .select("id, nama, tanggal_mulai, tanggal_selesai")
        .eq("aktif", true)
        .order("tanggal_mulai", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (linksRes.error || periodRes.error) {
      throw new Error("Gagal memuat data anak.");
    }

    const links = linksRes.data ?? [];
    const period = periodRes.data;
    const childIds = links.map((link) => link.siswa_id);
    const hubunganByChild = new Map(
      links.map((link) => [link.siswa_id, link.hubungan]),
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
    const children: OrtuChild[] = childIds.flatMap((id) => {
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
        today,
        children,
        activeChild: null,
        pengajuan: null,
        jurnal: [],
        mutabaah: {
          formNama: null,
          terisi: 0,
          totalHari: 7,
          hariIniTerisi: false,
        },
        surat: [],
      };
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .eq("siswa_id", activeChild.id);

    if (membershipsError) {
      throw new Error("Gagal memuat pengajuan anak.");
    }

    const applicationIds = (memberships ?? []).map(
      (membership) => membership.pengajuan_id,
    );

    let pengajuan: OrtuDashboardData["pengajuan"] = null;

    if (applicationIds.length) {
      let pengajuanQuery = supabase
        .from("pengajuan_pkl")
        .select(
          "id, status, alasan_penolakan, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama, tanggal_mulai, tanggal_selesai)",
        )
        .in("id", applicationIds)
        .order("created_at", { ascending: false })
        .limit(1);

      if (period) {
        pengajuanQuery = pengajuanQuery.eq("periode_id", period.id);
      }

      const { data, error } = await pengajuanQuery.maybeSingle();

      if (error) {
        throw new Error("Gagal memuat pengajuan anak.");
      }

      pengajuan = data;
    }

    let formQuery = supabase
      .from("mutabaah_form")
      .select("id, nama")
      .eq("status", "aktif");

    if (period) {
      formQuery = formQuery.eq("periode_id", period.id);
    }

    const { data: form, error: formError } = await formQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError) {
      throw new Error("Gagal memuat form mutaba'ah.");
    }

    let jurnal: OrtuDashboardData["jurnal"] = [];

    if (pengajuan) {
      const { data, error } = await supabase
        .from("jurnal")
        .select(
          "id, tanggal, kegiatan, waktu_mulai, waktu_selesai, status",
        )
        .eq("siswa_id", activeChild.id)
        .eq("pengajuan_id", pengajuan.id)
        .order("tanggal", { ascending: false })
        .limit(3);

      if (error) {
        throw new Error("Gagal memuat jurnal anak.");
      }

      jurnal = data ?? [];
    }

    let mutabaah: OrtuDashboardData["mutabaah"] = {
      formNama: null,
      terisi: 0,
      totalHari: 7,
      hariIniTerisi: false,
    };

    if (form) {
      const { data: entries, error } = await supabase
        .from("mutabaah_harian")
        .select("tanggal")
        .eq("siswa_id", activeChild.id)
        .eq("form_id", form.id)
        .gte("tanggal", startOfWeek(today))
        .lte("tanggal", today);

      if (error) {
        throw new Error("Gagal memuat mutaba'ah anak.");
      }

      const dates = new Set((entries ?? []).map((entry) => entry.tanggal));

      mutabaah = {
        formNama: form.nama,
        terisi: dates.size,
        totalHari: 7,
        hariIniTerisi: dates.has(today),
      };
    }

    let surat: OrtuDashboardData["surat"] = [];

    if (pengajuan) {
      const { data, error } = await supabase
        .from("surat")
        .select("id, jenis, nomor, tanggal_terbit, status")
        .eq("pengajuan_id", pengajuan.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        throw new Error("Gagal memuat surat anak.");
      }

      surat = data ?? [];
    }

    return {
      today,
      children,
      activeChild,
      pengajuan,
      jurnal,
      mutabaah,
      surat,
    };
  },
);
