import {
  BadgeCheck,
  Ban,
  Check,
  CircleDashed,
  Clock,
  FileCheck,
  FileText,
  Play,
  Send,
  UserCog,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  statusJurnal,
  statusPengajuan,
  statusToneClass,
  type StatusJurnal,
  type StatusPengajuan,
  type StatusTone,
} from "@/lib/status";
import { cn } from "@/lib/utils";

const pengajuanIcons: Record<StatusPengajuan, LucideIcon> = {
  draft: CircleDashed,
  diajukan: Send,
  izin_ortu_terbit: FileText,
  izin_ortu_diunggah: Clock,
  pengajuan_terbit: FileText,
  balasan_diunggah: Clock,
  diterima: Check,
  keberangkatan_terbit: FileCheck,
  berlangsung: Play,
  penarikan_terbit: FileText,
  selesai: BadgeCheck,
  ditolak: X,
  dibatalkan: Ban,
};

const jurnalIcons: Record<StatusJurnal, LucideIcon> = {
  menunggu: Clock,
  terverifikasi_guru: FileCheck,
  terverifikasi_instruktur: BadgeCheck,
  revisi: X,
};

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
  className?: string;
};

export function StatusBadge({
  label,
  tone,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold leading-none",
        statusToneClass[tone],
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

export function PengajuanBadge({ status }: { status: StatusPengajuan }) {
  const meta = statusPengajuan[status];

  return (
    <StatusBadge label={meta.label} tone={meta.tone} icon={pengajuanIcons[status]} />
  );
}

export function JurnalBadge({ status }: { status: StatusJurnal }) {
  const meta = statusJurnal[status];

  return (
    <StatusBadge label={meta.label} tone={meta.tone} icon={jurnalIcons[status]} />
  );
}

export function AktifBadge({ aktif }: { aktif: boolean }) {
  return (
    <StatusBadge
      label={aktif ? "Aktif" : "Nonaktif"}
      tone={aktif ? "success" : "neutral"}
      icon={aktif ? Check : Ban}
    />
  );
}

export function AkunBadge({ aktif }: { aktif: boolean }) {
  return <AktifBadge aktif={aktif} />;
}

export function PeranInstrukturBadge({
  peran,
}: {
  peran: "instruktur" | "pembimbing";
}) {
  const isInstruktur = peran === "instruktur";

  return (
    <StatusBadge
      label={isInstruktur ? "Instruktur" : "Pembimbing"}
      tone="neutral"
      icon={isInstruktur ? UserCog : UserRound}
    />
  );
}

export function HubunganBadge({
  hubungan,
}: {
  hubungan: "ayah" | "ibu" | "wali";
}) {
  const label = {
    ayah: "Ayah",
    ibu: "Ibu",
    wali: "Wali",
  }[hubungan];

  return <StatusBadge label={label} tone="neutral" icon={UserRound} />;
}
