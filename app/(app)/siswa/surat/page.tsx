import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Building2,
  CalendarDays,
  Download,
  Eye,
  FileText,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanBadge, SuratBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSiswaSurat } from "@/lib/data/siswa-surat";
import { jenisSuratLabel } from "@/lib/status";
import { studentSuratTypes } from "@/lib/surat";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Surat",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMMM yyyy", { locale: localeId })
    : "—";
}

export default async function SiswaSuratPage() {
  const profile = await requireRole("siswa");
  const data = await getSiswaSurat(profile.id);

  if (!data.student) {
    return (
      <section className={card}>
        <EmptyState
          icon={FileText}
          title="Data siswa belum terhubung"
          description="Akun ini belum memiliki data siswa. Hubungi admin sekolah agar profil siswa dihubungkan ke akun Anda."
        />
      </section>
    );
  }

  if (!data.application) {
    return (
      <section className={card}>
        <EmptyState
          icon={FileText}
          title="Belum ada pengajuan PKL"
          description="Surat akan tersedia setelah pengajuan PKL dibuat dan disetujui sekolah."
          action={
            <Link
              href="/siswa/pengajuan"
              prefetch={false}
              className={buttonVariants({ variant: "primary" })}
            >
              Buka pengajuan PKL
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Siswa PKL
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Surat
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Unduh surat resmi PKL yang sudah diterbitkan sekolah.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          {data.student.nis} · {data.student.kelas ?? "—"}
          {data.student.jurusan?.nama ? ` · ${data.student.jurusan.nama}` : ""}
        </p>
      </header>

      <section className={cn(card, "mb-6")} aria-labelledby="pkl-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium leading-[18px] text-muted">
              Penempatan PKL
            </p>
            <h2
              id="pkl-title"
              className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
            >
              {data.application.perusahaan?.nama ??
                "Tempat PKL belum ditetapkan"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {[data.application.perusahaan?.kota, data.application.periode?.nama]
                .filter(Boolean)
                .join(" · ") || "Menunggu penempatan dari sekolah"}
            </p>
          </div>
          <PengajuanBadge status={data.application.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <CalendarDays
              className="size-4 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            {formatDate(data.application.tanggalMulai)} –{" "}
            {formatDate(data.application.tanggalSelesai)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Building2
              className="size-4 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            {data.application.periode?.nama ?? "Periode belum diisi"}
          </span>
        </div>
      </section>

      <section aria-labelledby="daftar-surat-title">
        <div className="mb-3">
          <h2
            id="daftar-surat-title"
            className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
          >
            Surat tersedia
          </h2>
          <p className="mt-1 text-sm text-muted">
            Surat yang belum terbit akan muncul di sini setelah admin
            menerbitkannya.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {studentSuratTypes.map((jenis) => {
            const letter = data.letters.find((item) => item.jenis === jenis);

            return (
              <article key={jenis} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                    <FileText
                      className="size-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  {letter ? (
                    <SuratBadge status={letter.status} />
                  ) : (
                    <span className="text-[13px] text-muted">
                      Belum tersedia
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-semibold text-ink">
                  {jenisSuratLabel[jenis]}
                </h3>

                {letter ? (
                  <>
                    <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
                      {letter.nomor ?? "Nomor belum tersedia"} ·{" "}
                      {formatDate(letter.tanggalTerbit)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/api/surat/${letter.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        <Eye
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        Lihat
                      </Link>
                      <Link
                        href={`/api/surat/${letter.id}/pdf?download=1`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        <Download
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        Unduh
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-[13px] leading-[18px] text-muted">
                    Surat ini belum diterbitkan oleh sekolah.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
