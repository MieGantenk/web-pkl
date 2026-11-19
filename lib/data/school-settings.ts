import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import { jenisSuratList, type JenisSurat } from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export type SchoolSettings = {
  id: number;
  nama_sekolah: string;
  alamat: string;
  telepon: string | null;
  email: string | null;
  website: string | null;
  kepala_sekolah: string | null;
  nip_kepala: string | null;
  akreditasi: string | null;
  logo_path: string | null;
  kop_path: string | null;
  footer_path: string | null;
  format_nomor_surat: string;
  updated_at: string;
};

export type SchoolSettingsData = {
  settings: SchoolSettings;
  assets: {
    logoUrl: string | null;
    kopUrl: string | null;
    footerUrl: string | null;
  };
  penomoran: Array<{ jenis: JenisSurat; urutan_terakhir: number }>;
  currentYear: number;
  mutabaah: {
    formNama: string | null;
    jumlahPertanyaan: number;
    periodeNama: string | null;
  };
};

const DEFAULT_SETTINGS: SchoolSettings = {
  id: 1,
  nama_sekolah: "SMK-IT As-Syifa Boarding School",
  alamat: "KP. Kumpay, Kecamatan Jalancagak, Kabupaten Subang, Jawa Barat",
  telepon: "081122223934",
  email: "smkit@assyifa.sch.id",
  website: "https://smkit.assyifa.sch.id",
  kepala_sekolah: "H. Agus Nur Purwanto, S.T.",
  nip_kepala: null,
  akreditasi: null,
  logo_path: null,
  kop_path: null,
  footer_path: null,
  format_nomor_surat: "{nomor}/{kode}/{tahun}",
  updated_at: new Date(0).toISOString(),
};

export const getSchoolSettings = cache(
  async (): Promise<SchoolSettingsData> => {
    await connection();

    const supabase = await createClient();
    const currentYear = Number(jakartaToday().slice(0, 4));

    const [settingsRes, countersRes, periodRes] = await Promise.all([
      supabase
        .from("pengaturan_sekolah")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("penomoran_surat")
        .select("jenis, urutan_terakhir")
        .eq("tahun", currentYear),
      supabase
        .from("periode_pkl")
        .select("id, nama")
        .eq("aktif", true)
        .maybeSingle(),
    ]);

    if (settingsRes.error || countersRes.error || periodRes.error) {
      throw new Error("Gagal memuat pengaturan sekolah.");
    }

    const row = settingsRes.data;
    const settings: SchoolSettings = row
      ? {
          ...row,
          format_nomor_surat:
            row.format_nomor_surat ?? DEFAULT_SETTINGS.format_nomor_surat,
        }
      : DEFAULT_SETTINGS;

    const counters = countersRes.data ?? [];
    const counterByJenis = new Map(
      counters.map((item) => [item.jenis, item.urutan_terakhir]),
    );
    const penomoran = jenisSuratList.map((jenis) => ({
      jenis,
      urutan_terakhir: counterByJenis.get(jenis) ?? 0,
    }));

    const period = periodRes.data;

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
      throw new Error("Gagal memuat ringkasan mutaba'ah.");
    }

    let jumlahPertanyaan = 0;

    if (form) {
      const { count, error } = await supabase
        .from("mutabaah_pertanyaan")
        .select("id", { count: "exact", head: true })
        .eq("form_id", form.id);

      if (error) {
        throw new Error("Gagal memuat ringkasan mutaba'ah.");
      }

      jumlahPertanyaan = count ?? 0;
    }

    const assetUrl = (path: string | null) =>
      path
        ? supabase.storage.from("sekolah").getPublicUrl(path).data.publicUrl
        : null;

    return {
      settings,
      assets: {
        logoUrl: assetUrl(settings.logo_path),
        kopUrl: assetUrl(settings.kop_path),
        footerUrl: assetUrl(settings.footer_path),
      },
      penomoran,
      currentYear,
      mutabaah: {
        formNama: form?.nama ?? null,
        jumlahPertanyaan,
        periodeNama: period?.nama ?? null,
      },
    };
  },
);
