import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanBadge, SuratBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getOrtuSurat, type OrtuSuratChild } from "@/lib/data/ortu-surat";
import { jenisSuratLabel } from "@/lib/status";
import { studentSuratTypes } from "@/lib/surat";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Surat",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const hubunganLabel: Record<OrtuSuratChild["hubungan"], string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
};

type OrtuSuratPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMMM yyyy", { locale: localeId })
    : "—";
}

export default async function OrtuSuratPage({
  searchParams,
}: OrtuSuratPageProps) {
  const profile = await requireRole("ortu");
  const params = await searchParams;
  const selectedChildId =
    typeof params.anak === "string" ? params.anak : undefined;
  const data = await getOrtuSurat(profile.id, selectedChildId);
  const child = data.activeChild;
  const application = data.application;

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Orang Tua
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Surat
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Unduh surat resmi PKL yang sudah diterbitkan untuk anak Anda.
        </p>
      </div>

      {child ? (
        <p className="text-sm text-muted lg:text-right">
          {child.nama} · NIS {child.nis}
        </p>
      ) : null}
    </header>
  );

  if (!child) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada data anak"
            description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar relasi orang tua dan siswa dibuat."
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      {header}

      {data.children.length > 1 ? (
        <nav aria-label="Pilih anak" className="mb-6 flex flex-wrap gap-2">
          {data.children.map((item) => {
            const active = item.id === child.id;

            return (
              <Link
                key={item.id}
                href={`/ortu/surat?anak=${item.id}`}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                  active
                    ? "border-brand-700 bg-brand-50 text-brand-700"
                    : "border-border bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                {item.nama}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {!application ? (
        <section className={card}>
          <EmptyState
            icon={FileText}
            title="Belum ada pengajuan PKL"
            description="Surat akan tersedia setelah anak Anda memiliki pengajuan PKL yang disetujui sekolah."
          />
        </section>
      ) : (
        <>
          <section
            className={cn(card, "mb-6")}
            aria-labelledby="anak-surat-title"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium leading-[18px] text-muted">
                  Anak
                </p>
                <h2
                  id="anak-surat-title"
                  className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
                >
                  {child.nama}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {[
                    hubunganLabel[child.hubungan],
                    child.kelas ?? "—",
                    child.jurusan?.nama ?? "—",
                    `NIS ${child.nis}`,
                  ].join(" · ")}
                </p>
              </div>
              <PengajuanBadge status={application.status} />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="font-display text-xl font-semibold leading-7 tracking-[-0.01em] text-ink">
                {application.perusahaan?.nama ??
                  "Tempat PKL belum ditetapkan"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {[application.perusahaan?.kota, application.periode?.nama]
                  .filter(Boolean)
                  .join(" · ") || "Menunggu penempatan dari sekolah"}
              </p>
              {application.tanggalMulai && application.tanggalSelesai ? (
                <p className="mt-1 inline-flex items-center gap-2 text-[13px] leading-[18px] text-muted tabular-nums">
                  <CalendarDays
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {formatDate(application.tanggalMulai)} –{" "}
                  {formatDate(application.tanggalSelesai)}
                </p>
              ) : null}
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
                const letter = data.letters.find(
                  (item) => item.jenis === jenis,
                );

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
        </>
      )}
    </div>
  );
}
