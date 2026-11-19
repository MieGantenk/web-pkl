import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ClipboardCheck,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  Play,
  Settings,
  Upload,
  UserSearch,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CountUp } from "@/components/motion/CountUp";
import { ApplicationsChart } from "@/components/pkl/ApplicationsChart";
import { EmptyState } from "@/components/pkl/EmptyState";
import { requireRole } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data/admin-dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ringkasan",
};

// Sama seperti /siswa: rute memblokir, tanpa loading.tsx/Suspense.
export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const activityLabels: Record<string, string> = {
  approve_pengajuan: "menyetujui pengajuan",
  reject_pengajuan: "menolak pengajuan",
  verifikasi_jurnal: "memverifikasi jurnal",
  revisi_jurnal: "meminta revisi jurnal",
  upload_dokumen: "mengunggah dokumen",
  terbit_surat: "menerbitkan surat",
  mulai_pkl: "memulai PKL",
  arsip_pengajuan: "mengarsipkan pengajuan",
  update_pengaturan: "memperbarui pengaturan sekolah",
};

const activityIcons: Record<string, LucideIcon> = {
  approve_pengajuan: Check,
  reject_pengajuan: X,
  verifikasi_jurnal: FileCheck,
  revisi_jurnal: FileText,
  upload_dokumen: Upload,
  terbit_surat: FileText,
  mulai_pkl: Play,
  update_pengaturan: Settings,
};

function activityLabel(action: string) {
  return activityLabels[action] ?? action.replaceAll("_", " ");
}

export default async function AdminHomePage() {
  const profile = await requireRole("admin");
  const data = await getAdminDashboard();

  const firstName = profile.nama_lengkap.trim().split(" ")[0] || "Admin";
  const totalTasks =
    data.queues.persetujuan +
    data.queues.jurnal +
    data.queues.belumDitempatkan;
  const chartTotal = data.chart.reduce((total, item) => total + item.total, 0);

  const queueCards = [
    {
      label: "Perlu disetujui",
      count: data.queues.persetujuan,
      href: "/admin/pengajuan",
      action: "Lihat antrean",
      icon: ClipboardCheck,
    },
    {
      label: "Jurnal belum diverifikasi",
      count: data.queues.jurnal,
      href: "/admin/jurnal",
      action: "Buka jurnal",
      icon: BookOpen,
    },
    {
      label: "Siswa belum dapat tempat",
      count: data.queues.belumDitempatkan,
      href: "/admin/siswa",
      action: "Lihat siswa",
      icon: UserSearch,
    },
  ];

  const stats = [
    {
      label: "Siswa",
      value: data.stats.siswa,
      sublabel: "aktif",
      icon: Users,
      key: "siswa",
    },
    {
      label: "Guru",
      value: data.stats.guru,
      sublabel: "pembimbing",
      icon: GraduationCap,
      key: "guru",
    },
    {
      label: "Perusahaan",
      value: data.stats.perusahaan,
      sublabel: "mitra aktif",
      icon: Building2,
      key: "perusahaan",
    },
    {
      label: "Jurnal",
      value: data.stats.jurnal,
      sublabel: "entri tercatat",
      icon: BookOpen,
      key: "jurnal",
    },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            {format(parseISO(data.today), "EEEE, d MMMM yyyy", {
              locale: localeId,
            })}
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Halo, {firstName}.
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            {totalTasks > 0
              ? `Hari ini ${totalTasks} hal menunggu tindakan.`
              : "Tidak ada antrean hari ini."}
          </p>
        </div>

        {data.period ? (
          <div className="text-sm lg:text-right">
            <p className="font-medium text-ink-soft">{data.period.nama}</p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
              {format(parseISO(data.period.tanggal_mulai), "d MMM yyyy", {
                locale: localeId,
              })}{" "}
              –{" "}
              {format(parseISO(data.period.tanggal_selesai), "d MMM yyyy", {
                locale: localeId,
              })}
            </p>
          </div>
        ) : null}
      </header>

      <section aria-labelledby="antrean-title">
        <h2 id="antrean-title" className="sr-only">
          Antrean hari ini
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {queueCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="group flex flex-col justify-between rounded-md border border-border bg-surface p-5 shadow-xs transition-[border-color,transform] duration-[var(--m-base)] ease-[var(--ease-out)] hover:border-border-strong motion-safe:hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                    <item.icon
                      className="size-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <ArrowRight
                    className="size-4 text-muted transition-transform duration-[var(--m-base)] group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>

                <p className="mt-5 text-[13px] font-medium leading-[18px] text-muted">
                  {item.label}
                </p>
                <p className="mt-1 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.02em] text-ink tabular-nums">
                  {item.count}
                </p>
              </div>

              <p className="mt-4 text-sm font-semibold text-brand-700">
                {item.action}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 sm:mt-8" aria-labelledby="statistik-title">
        <h2 id="statistik-title" className="sr-only">
          Statistik
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.key}
              className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium leading-[18px] text-muted">
                  {item.label}
                </p>
                <item.icon
                  className="size-5 shrink-0 text-brand-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <p className="mt-2 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.02em] text-ink">
                <CountUp value={item.value} storageKey={item.key} />
              </p>
              <p className="mt-1 text-[13px] leading-[18px] text-muted">
                {item.sublabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid items-start gap-4 sm:mt-8 xl:grid-cols-[1.5fr_1fr]">
        <div className={cn(card, "min-w-0")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                Pengajuan per bulan
              </h2>
              <p className="mt-1 text-sm text-muted">6 bulan terakhir</p>
            </div>
            <BarChart3
              className="size-5 shrink-0 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>

          <p className="sr-only">
            6 bulan terakhir:{" "}
            {data.chart
              .map((item) => `${item.label} ${item.total} pengajuan`)
              .join(", ")}
            .
          </p>

          <div className="mt-5">
            {chartTotal > 0 ? (
              <div className="h-[260px]">
                <ApplicationsChart data={data.chart} />
              </div>
            ) : (
              <div className="py-6">
                <EmptyState
                  icon={BarChart3}
                  title="Belum ada pengajuan"
                  description="Grafik akan terisi setelah siswa membuat pengajuan."
                />
              </div>
            )}
          </div>
        </div>

        <div className={cn(card, "min-w-0")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                Aktivitas terbaru
              </h2>
              <p className="mt-1 text-sm text-muted">5 aksi terakhir</p>
            </div>
            <History
              className="size-5 shrink-0 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>

          {data.activities.length ? (
            <ul className="mt-4 divide-y divide-border">
              {data.activities.map((activity) => {
                const Icon = activityIcons[activity.aksi] ?? History;

                return (
                  <li
                    key={activity.id}
                    className="flex gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-soft">
                      <Icon
                        className="size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-[22px] text-ink-soft">
                        <span className="font-semibold text-ink">
                          {activity.nama}
                        </span>{" "}
                        {activityLabel(activity.aksi)}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-4 text-muted">
                        {formatDistanceToNow(parseISO(activity.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={History}
                title="Belum ada aktivitas"
                description="Aktivitas persetujuan dan verifikasi akan muncul di sini."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
