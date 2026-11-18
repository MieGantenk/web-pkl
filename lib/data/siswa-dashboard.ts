import { cache } from "react";
import { connection } from "next/server";

import type { StatusJurnal, StatusPengajuan } from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export type SiswaDashboardData = {
  today: string;
  siswa: {
    id: string;
    nis: string;
    kelas: string | null;
    jurusan: { nama: string } | null;
  } | null;
  pengajuan: {
    id: string;
    status: StatusPengajuan;
    alasan_penolakan: string | null;
    perusahaan: { nama: string; kota: string | null } | null;
    periode: { nama: string } | null;
  } | null;
  jurnalHariIni: {
    id: string;
    kegiatan: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    status: StatusJurnal;
  } | null;
  jurnalTerakhir: Array<{
    id: string;
    tanggal: string;
    kegiatan: string;
    status: StatusJurnal;
  }>;
  mutabaah: {
    formNama: string | null;
    terisi: number;
    totalHari: number;
    hariIniTerisi: boolean;
  };
};

function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

export const getSiswaDashboard = cache(
  async (penggunaId: string): Promise<SiswaDashboardData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();

    const { data: siswa, error: siswaError } = await supabase
      .from("siswa")
      .select("id, nis, kelas, jurusan:jurusan_id(nama)")
      .eq("pengguna_id", penggunaId)
      .eq("aktif", true)
      .maybeSingle();

    if (siswaError) {
      throw new Error("Gagal memuat profil siswa.");
    }

    if (!siswa) {
      return {
        today,
        siswa: null,
        pengajuan: null,
        jurnalHariIni: null,
        jurnalTerakhir: [],
        mutabaah: {
          formNama: null,
          terisi: 0,
          totalHari: 7,
          hariIniTerisi: false,
        },
      };
    }

    const { data: anggota, error: anggotaError } = await supabase
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .eq("siswa_id", siswa.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anggotaError) {
      throw new Error("Gagal memuat pengajuan PKL.");
    }

    let pengajuan: SiswaDashboardData["pengajuan"] = null;

    if (anggota) {
      const { data, error } = await supabase
        .from("pengajuan_pkl")
        .select(
          "id, status, alasan_penolakan, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
        )
        .eq("id", anggota.pengajuan_id)
        .maybeSingle();

      if (error) {
        throw new Error("Gagal memuat pengajuan PKL.");
      }

      pengajuan = data;
    }

    const { data: jurnal, error: jurnalError } = await supabase
      .from("jurnal")
      .select("id, tanggal, kegiatan, waktu_mulai, waktu_selesai, status")
      .eq("siswa_id", siswa.id)
      .order("tanggal", { ascending: false })
      .limit(3);

    if (jurnalError) {
      throw new Error("Gagal memuat jurnal.");
    }

    const jurnalHariIni =
      jurnal?.find((entry) => entry.tanggal === today) ?? null;

    const { data: form, error: formError } = await supabase
      .from("mutabaah_form")
      .select("id, nama")
      .eq("status", "aktif")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError) {
      throw new Error("Gagal memuat form mutaba'ah.");
    }

    let mutabaahEntries: Array<{ tanggal: string }> = [];

    if (form) {
      const { data, error } = await supabase
        .from("mutabaah_harian")
        .select("tanggal")
        .eq("siswa_id", siswa.id)
        .gte("tanggal", startOfWeek(today))
        .lte("tanggal", today);

      if (error) {
        throw new Error("Gagal memuat mutaba'ah.");
      }

      mutabaahEntries = data ?? [];
    }

    return {
      today,
      siswa,
      pengajuan,
      jurnalHariIni,
      jurnalTerakhir: (jurnal ?? []).map((entry) => ({
        id: entry.id,
        tanggal: entry.tanggal,
        kegiatan: entry.kegiatan,
        status: entry.status,
      })),
      mutabaah: {
        formNama: form?.nama ?? null,
        terisi: new Set(mutabaahEntries.map((entry) => entry.tanggal)).size,
        totalHari: 7,
        hariIniTerisi: mutabaahEntries.some(
          (entry) => entry.tanggal === today,
        ),
      },
    };
  },
);
