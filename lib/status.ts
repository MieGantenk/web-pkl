export type StatusPengajuan =
  | "draft"
  | "diajukan"
  | "izin_ortu_terbit"
  | "izin_ortu_diunggah"
  | "pengajuan_terbit"
  | "balasan_diunggah"
  | "diterima"
  | "keberangkatan_terbit"
  | "berlangsung"
  | "penarikan_terbit"
  | "selesai"
  | "ditolak"
  | "dibatalkan";

export type StatusJurnal =
  | "menunggu"
  | "terverifikasi_guru"
  | "terverifikasi_instruktur"
  | "revisi";

export type StatusTugas = "belum" | "selesai" | "terlambat";
export type StatusVerifikasi = "menunggu" | "diterima" | "revisi" | "ditolak";

export type StatusTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger";

export const statusToneClass: Record<StatusTone, string> = {
  neutral: "border-neutral-border bg-neutral-bg text-neutral-text",
  info: "border-info-border bg-info-bg text-info",
  warning: "border-warning-border bg-warning-bg text-warning",
  success: "border-success-border bg-success-bg text-success",
  danger: "border-danger-border bg-danger-bg text-danger",
};

export const statusPengajuan: Record<
  StatusPengajuan,
  { label: string; tone: StatusTone }
> = {
  draft: { label: "Belum diajukan", tone: "neutral" },
  diajukan: { label: "Diajukan", tone: "info" },
  izin_ortu_terbit: { label: "Izin orang tua terbit", tone: "info" },
  izin_ortu_diunggah: { label: "Izin diunggah", tone: "warning" },
  pengajuan_terbit: { label: "Surat pengajuan terbit", tone: "info" },
  balasan_diunggah: { label: "Balasan diunggah", tone: "warning" },
  diterima: { label: "Diterima", tone: "success" },
  keberangkatan_terbit: {
    label: "Surat keberangkatan terbit",
    tone: "success",
  },
  berlangsung: { label: "Berlangsung", tone: "success" },
  penarikan_terbit: { label: "Surat penarikan terbit", tone: "info" },
  selesai: { label: "Selesai", tone: "success" },
  ditolak: { label: "Ditolak", tone: "danger" },
  dibatalkan: { label: "Dibatalkan", tone: "neutral" },
};

export const statusPengajuanNextStep: Record<StatusPengajuan, string> = {
  draft: "Kirim pengajuan agar sekolah dapat menerbitkan surat izin orang tua.",
  diajukan: "Sekolah sedang menerbitkan surat izin orang tua.",
  izin_ortu_terbit:
    "Unduh surat izin, minta tanda tangan orang tua, lalu unggah kembali.",
  izin_ortu_diunggah: "Admin sedang memeriksa scan izin orang tua.",
  pengajuan_terbit:
    "Serahkan surat pengajuan ke perusahaan, lalu unggah surat balasannya.",
  balasan_diunggah: "Admin sedang meninjau surat balasan perusahaan.",
  diterima: "Tunggu surat keberangkatan dari sekolah.",
  keberangkatan_terbit:
    "Unduh surat keberangkatan dan siapkan diri untuk mulai PKL.",
  berlangsung: "Isi jurnal setiap hari dan lengkapi mutaba'ah.",
  penarikan_terbit: "Serahkan surat penarikan ke perusahaan.",
  selesai: "PKL selesai. Data Anda tersimpan sebagai arsip.",
  ditolak: "Pengajuan ditolak. Ajukan tempat PKL baru.",
  dibatalkan: "Pengajuan dibatalkan.",
};

export const statusPengajuanStage: Record<StatusPengajuan, number> = {
  draft: 1,
  diajukan: 1,
  izin_ortu_terbit: 1,
  izin_ortu_diunggah: 1,
  pengajuan_terbit: 1,
  balasan_diunggah: 1,
  diterima: 2,
  keberangkatan_terbit: 2,
  berlangsung: 3,
  penarikan_terbit: 4,
  selesai: 5,
  ditolak: 0,
  dibatalkan: 0,
};

export const statusJurnal: Record<
  StatusJurnal,
  { label: string; tone: StatusTone }
> = {
  menunggu: { label: "Menunggu verifikasi", tone: "warning" },
  terverifikasi_guru: {
    label: "Terverifikasi pembimbing",
    tone: "info",
  },
  terverifikasi_instruktur: {
    label: "Terverifikasi instruktur",
    tone: "success",
  },
  revisi: { label: "Perlu revisi", tone: "danger" },
};

export const statusTugas: Record<
  StatusTugas,
  { label: string; tone: StatusTone }
> = {
  belum: { label: "Belum selesai", tone: "neutral" },
  selesai: { label: "Selesai", tone: "success" },
  terlambat: { label: "Terlambat", tone: "danger" },
};

export const statusVerifikasi: Record<
  StatusVerifikasi,
  { label: string; tone: StatusTone }
> = {
  menunggu: { label: "Menunggu", tone: "warning" },
  diterima: { label: "Diterima", tone: "success" },
  revisi: { label: "Perlu revisi", tone: "info" },
  ditolak: { label: "Ditolak", tone: "danger" },
};
