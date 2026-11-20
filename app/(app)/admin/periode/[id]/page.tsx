import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

import { PeriodeForm } from "@/components/pkl/PeriodeForm";
import { PeriodeStatusButton } from "@/components/pkl/PeriodeStatusButton";
import { AktifBadge } from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getPeriodeDetail } from "@/lib/data/admin-periode";
import { postgresUuidPattern } from "@/lib/validators/common";
import type { PeriodeFormInput } from "@/lib/validators/periode";

export const metadata: Metadata = {
  title: "Detail periode",
};

export const instant = false;

function formatDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

export default async function AdminPeriodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;

  if (!postgresUuidPattern.test(id)) {
    notFound();
  }

  const data = await getPeriodeDetail(id);

  if (!data) {
    notFound();
  }

  const defaultValues: PeriodeFormInput = {
    nama: data.nama,
    tahun_ajaran: data.tahun_ajaran,
    tanggal_mulai: data.tanggal_mulai,
    tanggal_selesai: data.tanggal_selesai,
  };

  return (
    <div>
      <Link
        href="/admin/periode"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke periode PKL
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data periode
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {data.nama}
          </h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {data.tahun_ajaran} · {formatDate(data.tanggal_mulai)} –{" "}
            {formatDate(data.tanggal_selesai)}
          </p>
        </div>

        <AktifBadge aktif={data.aktif} />
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
          <PeriodeForm
            mode="edit"
            periodeId={data.id}
            defaultValues={defaultValues}
          />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-xl font-semibold text-ink">Status periode</h2>
            <div className="mt-3">
              <AktifBadge aktif={data.aktif} />
            </div>
            <p className="mt-3 text-sm leading-[22px] text-ink-soft">
              {data.aktif
                ? "Periode ini dipakai sebagai acuan ringkasan PKL."
                : "Periode ini tersimpan tetapi tidak dipakai sebagai acuan."}
            </p>
            <p className="mt-2 text-[13px] leading-[18px] text-muted">
              Hanya satu periode yang dapat aktif. Mengaktifkan periode ini
              akan menonaktifkan periode lain.
            </p>

            <div className="mt-4">
              <PeriodeStatusButton
                id={data.id}
                aktif={data.aktif}
                nama={data.nama}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
