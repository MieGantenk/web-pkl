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

export const metadata: Metadata = {
  title: "Ringkasan",
};

// Sama seperti /siswa: rute memblokir, tanpa loading.tsx/Suspense.
export const instant = false;

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
    <div className="mx-auto w-full max-w-[1120px]">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">
            {format(parseISO(data.today), "EEEE, d MMMM yyyy", {
              locale: localeId,
            })}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink sm:text-[28px] sm:leading-9">
            Halo, {firstName}.
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-soft">
            {totalTasks > 0
              ? `${totalTasks} hal menunggu tindakan hari ini.`
              : "Tidak ada antrean hari ini."}
          </p>
        </div>

        {data.period ? (
          <div className="flex w-fit flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs">
            <span
              className="size-1.5 rounded-full bg-brand-500"
              aria-hidden
            />
            <span className="font-medium text-ink-soft">
              {data.period.nama}
            </span>
            <span className="text-border-strong" aria-hidden>
              /
            </span>
            <span className="text-muted tabular-nums">
              {format(parseISO(data.period.tanggal_mulai), "d MMM yyyy", {
                locale: localeId,
              })}{" "}
              –{" "}
              {format(parseISO(data.period.tanggal_selesai), "d MMM yyyy", {
                locale: localeId,
              })}
            </span>
          </div>
        ) : null}
      </header>

      <section className="mt-6" aria-labelledby="antrean-title">
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2
                id="antrean-title"
                className="text-sm font-semibold text-ink"
              >
                Antrean hari ini
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Perlu tindakan admin
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
              Hari ini
            </span>
          </div>

          <ul className="divide-y divide-border">
            {queueCards.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--m-fast)] hover:bg-surface-muted sm:px-5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-canvas text-muted">
                    <item.icon
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {item.action}
                    </span>
                  </span>

                  <span className="text-lg font-semibold tabular-nums text-ink">
                    {item.count}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted transition-transform duration-[var(--m-fast)] group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4" aria-labelledby="statistik-title">
        <h2 id="statistik-title" className="sr-only">
          Statistik
        </h2>

        <div className="overflow-hidden rounded-md border border-border bg-border">
          <div className="grid grid-cols-2 gap-px lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.key}
                className="bg-surface px-4 py-4 sm:px-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted">
                    {item.label}
                  </p>
                  <item.icon
                    className="size-4 shrink-0 text-muted"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <p className="mt-1 text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
                  <CountUp value={item.value} storageKey={item.key} />
                </p>
                <p className="mt-0.5 text-xs text-muted">{item.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid items-start gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Pengajuan per bulan
              </h2>
              <p className="mt-0.5 text-xs text-muted">6 bulan terakhir</p>
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
              {chartTotal} total
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <p className="sr-only">
              6 bulan terakhir:{" "}
              {data.chart
                .map((item) => `${item.label} ${item.total} pengajuan`)
                .join(", ")}
              .
            </p>

            {chartTotal > 0 ? (
              <div className="h-[220px] sm:h-[240px]">
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

        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">
              Aktivitas terbaru
            </h2>
            <p className="mt-0.5 text-xs text-muted">5 aksi terakhir</p>
          </div>

          {data.activities.length ? (
            <ul className="divide-y divide-border">
              {data.activities.map((activity) => {
                const Icon = activityIcons[activity.aksi] ?? History;

                return (
                  <li
                    key={activity.id}
                    className="flex gap-3 px-4 py-3 sm:px-5"
                  >
                    <Icon
                      className="mt-0.5 size-4 shrink-0 text-muted"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-ink-soft">
                        <span className="font-medium text-ink">
                          {activity.nama}
                        </span>{" "}
                        {activityLabel(activity.aksi)}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted">
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
            <div className="px-4 py-5 sm:px-5">
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
