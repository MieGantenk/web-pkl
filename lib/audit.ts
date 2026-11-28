import {
  Archive,
  Building2,
  Check,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  KeyRound,
  Play,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StatusTone } from "@/lib/status";

export type AuditActionMeta = {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
};

const actions: Record<string, AuditActionMeta> = {
  approve_pengajuan: {
    label: "Menyetujui pengajuan",
    tone: "success",
    icon: Check,
  },
  reject_pengajuan: {
    label: "Menolak pengajuan",
    tone: "danger",
    icon: X,
  },
  verifikasi_dokumen: {
    label: "Verifikasi dokumen",
    tone: "info",
    icon: FileCheck,
  },
  verifikasi_jurnal: {
    label: "Verifikasi jurnal",
    tone: "success",
    icon: FileCheck,
  },
  revisi_jurnal: {
    label: "Revisi jurnal",
    tone: "warning",
    icon: FileText,
  },
  terbit_surat: {
    label: "Terbit surat",
    tone: "info",
    icon: FileText,
  },
  unggah_surat: {
    label: "Unggah surat",
    tone: "info",
    icon: Upload,
  },
  upload_dokumen: {
    label: "Unggah dokumen",
    tone: "info",
    icon: Upload,
  },
  update_pengaturan: {
    label: "Perbarui pengaturan",
    tone: "neutral",
    icon: Settings,
  },
  tambah_perusahaan: {
    label: "Tambah perusahaan",
    tone: "info",
    icon: Building2,
  },
  mulai_pkl: {
    label: "Mulai PKL",
    tone: "success",
    icon: Play,
  },
  naik_kelas_siswa: {
    label: "Naik kelas siswa",
    tone: "neutral",
    icon: GraduationCap,
  },
  atur_ulang_kata_sandi: {
    label: "Atur ulang kata sandi",
    tone: "warning",
    icon: KeyRound,
  },
  hapus_akun: {
    label: "Menghapus akun",
    tone: "danger",
    icon: Trash2,
  },
  ekspor_akun_pdf: {
    label: "Mengunduh PDF akun",
    tone: "info",
    icon: Download,
  },
  reset_sandi_mandiri: {
    label: "Reset sandi mandiri",
    tone: "warning",
    icon: KeyRound,
  },
  arsip_pengajuan: {
    label: "Arsip pengajuan",
    tone: "neutral",
    icon: Archive,
  },
};

const entities: Record<string, string> = {
  pengajuan_pkl: "Pengajuan PKL",
  jurnal: "Jurnal",
  surat: "Surat",
  siswa: "Siswa",
  pengguna: "Pengguna",
  perusahaan: "Perusahaan",
  pengaturan_sekolah: "Pengaturan sekolah",
};

const detailLabels: Record<string, string> = {
  status: "Status",
  peran: "Peran",
  jenis: "Jenis",
  nomor: "Nomor",
  action: "Tindakan",
  catatan: "Catatan",
  status_sebelum: "Status sebelum",
  status_sesudah: "Status sesudah",
};

const passwordActions = new Set([
  "atur_ulang_kata_sandi",
  "reset_sandi_mandiri",
  "ganti_kata_sandi",
]);

export function isPasswordAuditAction(action: string) {
  return passwordActions.has(action);
}

export function getAuditActionMeta(action: string): AuditActionMeta {
  return (
    actions[action] ?? {
      label: action.replaceAll("_", " "),
      tone: "neutral",
      icon: History,
    }
  );
}

export function getAuditEntityLabel(entity: string) {
  return entities[entity] ?? entity.replaceAll("_", " ");
}

export function getAuditDetailLabel(key: string) {
  return (
    detailLabels[key] ??
    key.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase())
  );
}
