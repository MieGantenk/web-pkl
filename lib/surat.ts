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
  keberangkatan: "keberangkatan_terbit",
  penarikan: "penarikan_terbit",
};

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
