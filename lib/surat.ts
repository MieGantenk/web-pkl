import type {
  JenisSurat,
  StatusPengajuan,
} from "@/lib/status";

export const suratEligibleStatuses: Record<
  JenisSurat,
  StatusPengajuan[]
> = {
  izin_orang_tua: ["diajukan"],
  pengajuan: ["izin_ortu_diunggah"],
  keberangkatan: ["diterima"],
  tugas_monitoring: ["diterima", "keberangkatan_terbit", "berlangsung"],
  pernyataan: [
    "pengajuan_terbit",
    "diterima",
    "keberangkatan_terbit",
    "berlangsung",
  ],
  perjanjian: ["diterima", "keberangkatan_terbit", "berlangsung"],
  penarikan: ["berlangsung"],
};

export const suratNextStatus: Partial<
  Record<JenisSurat, StatusPengajuan>
> = {
  izin_orang_tua: "izin_ortu_terbit",
  pengajuan: "pengajuan_terbit",
  keberangkatan: "berlangsung",
  penarikan: "penarikan_terbit",
};

export type SuratRequirementState = {
  izinVerified: boolean;
  balasanVerified: boolean;
};

export type SuratSchedule = {
  tanggalSelesai: string | null;
  today: string;
};

export const emptySuratRequirementState: SuratRequirementState = {
  izinVerified: false,
  balasanVerified: false,
};

export function suratRequirementMet(
  jenis: JenisSurat,
  state: SuratRequirementState,
) {
  if (jenis === "pengajuan") {
    return state.izinVerified;
  }

  if (jenis === "keberangkatan") {
    return state.balasanVerified;
  }

  return true;
}

/**
 * Surat alur hanya boleh terbit setelah dokumen pendukungnya diverifikasi.
 * Surat pengajuan menunggu izin orang tua bertanda tangan; surat keberangkatan
 * menunggu surat balasan perusahaan.
 */
export function suratScheduleMet(
  jenis: JenisSurat,
  schedule?: SuratSchedule,
) {
  if (jenis !== "penarikan") {
    return true;
  }

  return Boolean(
    schedule?.tanggalSelesai &&
      schedule.tanggalSelesai <= schedule.today,
  );
}

export function canIssueSuratForApplication(
  jenis: JenisSurat,
  status: StatusPengajuan,
  state: SuratRequirementState,
  schedule?: SuratSchedule,
) {
  return (
    suratEligibleStatuses[jenis].includes(status) &&
    suratRequirementMet(jenis, state) &&
    suratScheduleMet(jenis, schedule)
  );
}

export const studentSuratTypes: readonly JenisSurat[] = [
  "izin_orang_tua",
  "pengajuan",
  "keberangkatan",
  "penarikan",
];

/** Surat utama sesuai alur PKL. */
export const alurSuratTypes: readonly JenisSurat[] = [
  "izin_orang_tua",
  "pengajuan",
  "keberangkatan",
  "tugas_monitoring",
  "penarikan",
];

/** Surat tambahan di luar alur utama. */
export const suratTambahanTypes: readonly JenisSurat[] = [
  "pernyataan",
  "perjanjian",
];

export const suratKode: Record<JenisSurat, string> = {
  izin_orang_tua: "IZIN",
  pernyataan: "PERNYATAAN",
  pengajuan: "PENGAJUAN",
  keberangkatan: "KEBERANGKATAN",
  tugas_monitoring: "TUGAS",
  perjanjian: "PERJANJIAN",
  penarikan: "PENARIKAN",
};

export function canIssueSurat(
  jenis: JenisSurat,
  status: StatusPengajuan,
) {
  return suratEligibleStatuses[jenis].includes(status);
}

export function suratFileName(
  jenis: JenisSurat,
  nomor: string | null,
) {
  const safe = (nomor ?? jenis).replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `${jenis}-${safe}.pdf`;
}
