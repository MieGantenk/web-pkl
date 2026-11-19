import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  HeartHandshake,
  ListChecks,
} from "lucide-react";

import { SchoolSettingsForm } from "@/components/pkl/SchoolSettingsForm";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/data/school-settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

export default async function AdminSettingsPage() {
  await requireRole("admin");

  const data = await getSchoolSettings();
  const settings = data.settings;

  const checklist = [
    {
      label: "Nama & alamat sekolah",
      ok: Boolean(settings.nama_sekolah && settings.alamat),
    },
    { label: "Akreditasi", ok: Boolean(settings.akreditasi) },
    { label: "Kepala sekolah", ok: Boolean(settings.kepala_sekolah) },
    { label: "Logo", ok: Boolean(settings.logo_path) },
    { label: "Kop surat", ok: Boolean(settings.kop_path) },
    { label: "Footer surat", ok: Boolean(settings.footer_path) },
    {
      label: "Format nomor surat",
      ok: Boolean(settings.format_nomor_surat),
    },
  ];
  const completed = checklist.filter((item) => item.ok).length;
  const akreditasiMissing = !settings.akreditasi;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Admin Sekolah
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Pengaturan
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Profil sekolah, identitas surat, dan penomoran resmi.
          </p>
        </div>
      </header>

      {akreditasiMissing ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-sm leading-[22px] text-warning"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <p>
            Akreditasi belum diisi. Surat belum bisa diterbitkan sampai
            akreditasi sekolah dilengkapi.
          </p>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SchoolSettingsForm
          key={settings.updated_at}
          initial={settings}
          penomoran={data.penomoran}
          assets={data.assets}
          year={data.currentYear}
        />

        <aside className="space-y-4">
          <section className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">Kelengkapan</h2>
                <p className="mt-1 text-sm text-muted">
                  {completed} dari {checklist.length} terisi
                </p>
              </div>
              <ListChecks
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            <ul className="mt-4 space-y-2.5">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 text-sm"
                >
                  {item.ok ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-success"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : (
                    <CircleAlert
                      className="size-4 shrink-0 text-warning"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  )}
                  <span className={item.ok ? "text-ink-soft" : "text-muted"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  Mutaba&apos;ah
                </h2>
                <p className="mt-1 text-sm text-muted">Form aktif</p>
              </div>
              <HeartHandshake
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            {data.mutabaah.formNama ? (
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Form</dt>
                  <dd className="text-right font-medium text-ink">
                    {data.mutabaah.formNama}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Pertanyaan</dt>
                  <dd className="text-right font-medium text-ink tabular-nums">
                    {data.mutabaah.jumlahPertanyaan}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Periode</dt>
                  <dd className="text-right font-medium text-ink">
                    {data.mutabaah.periodeNama ?? "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-[22px] text-ink-soft">
                Belum ada form mutaba&apos;ah aktif.
              </p>
            )}

            <Link
              href="/admin/mutabaah/pertanyaan"
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "mt-4 w-full",
              )}
            >
              Kelola pertanyaan
            </Link>
            <p className="mt-2 text-xs leading-4 text-muted">
              Item mutaba&apos;ah dikelola di halaman form builder.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
