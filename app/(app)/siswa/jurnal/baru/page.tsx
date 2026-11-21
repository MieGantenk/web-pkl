import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Info } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { JournalForm } from "@/components/pkl/JournalForm";
import { JurnalBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSiswaJurnalFormContext } from "@/lib/data/siswa-jurnal";

export const metadata: Metadata = {
  title: "Isi Jurnal",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

export default async function SiswaJurnalBaruPage() {
  const profile = await requireRole("siswa");
  const context = await getSiswaJurnalFormContext(profile.id);

  if (!context.siswa) {
    return (
      <section className={card}>
        <EmptyState
          icon={CircleAlert}
          title="Profil siswa belum lengkap"
          description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar data Anda dilengkapi."
        />
      </section>
    );
  }

  if (!context.placement) {
    return (
      <section className={card}>
        <EmptyState
          icon={CircleAlert}
          title="Jurnal belum dapat diisi"
          description="Jurnal harian dapat diisi saat PKL berstatus berlangsung. Hubungi guru atau admin jika status PKL Anda belum sesuai."
          action={
            <Link
              href="/siswa/jurnal"
              className={buttonVariants({ variant: "secondary" })}
            >
              Kembali ke jurnal
            </Link>
          }
        />
      </section>
    );
  }

  const maxDate =
    context.placement.tanggalSelesai &&
    context.placement.tanggalSelesai < context.today
      ? context.placement.tanggalSelesai
      : context.today;
  const defaultDate = context.jurnalHariIni
    ? ""
    : context.today > maxDate
      ? maxDate
      : context.today;

  return (
    <div>
      <Link
        href="/siswa/jurnal"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke jurnal
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Jurnal PKL
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Isi jurnal harian
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Catat kegiatan Anda selama PKL. Jurnal diverifikasi guru pembimbing
          lalu instruktur perusahaan.
        </p>
        <p className="mt-1 text-sm text-muted">
          {context.placement.perusahaan ?? "Perusahaan belum diisi"}
          {context.placement.periode
            ? ` · ${context.placement.periode}`
            : ""}
        </p>
      </header>

      {context.jurnalHariIni ? (
        <div className="mt-4 max-w-[680px] rounded-sm border border-info-border bg-info-bg px-3 py-2.5 text-sm leading-[22px] text-info">
          <div className="flex items-start gap-2">
            <Info
              className="mt-0.5 size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-semibold">Jurnal hari ini sudah diisi.</p>
              <p className="mt-0.5 text-[13px] leading-[18px]">
                Anda masih dapat menambah jurnal untuk tanggal lain.{" "}
                <Link
                  href={`/siswa/jurnal?jurnal=${context.jurnalHariIni.id}#jurnal-detail`}
                  prefetch={false}
                  className="font-semibold underline underline-offset-4"
                >
                  Lihat jurnal hari ini
                </Link>
                .
              </p>
              <div className="mt-2">
                <JurnalBadge status={context.jurnalHariIni.status} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-6 max-w-[680px] rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        <JournalForm
          siswaId={context.siswa.id}
          minDate={context.placement.tanggalMulai}
          maxDate={maxDate}
          defaultDate={defaultDate}
        />
      </section>
    </div>
  );
}
