import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleAlert,
  FileText,
  HeartHandshake,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import {
  JurnalBadge,
  PengajuanBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSiswaDashboard } from "@/lib/data/siswa-dashboard";
import {
  statusPengajuanNextStep,
  statusPengajuanStage,
  type StatusPengajuan,
} from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beranda",
};

// Data sesi dimuat memblokir. Jangan bungkus dengan loading.tsx/Suspense:
// boundary itu bisa menggantung setelah server restart (Next 16 cacheComponents).
export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const stages = ["Pengajuan", "Keberangkatan", "Pelaksanaan", "Penarikan"];

const letterStatuses: StatusPengajuan[] = [
  "pengajuan_terbit",
  "balasan_diunggah",
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
  "selesai",
];

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM", { locale: localeId });
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

export default async function SiswaHomePage() {
  const profile = await requireRole("siswa");
  const data = await getSiswaDashboard(profile.id);

  const firstName = profile.nama_lengkap.trim().split(" ")[0] || "Siswa";
  const stage = data.pengajuan
    ? statusPengajuanStage[data.pengajuan.status]
    : 0;
  const hasLetter = data.pengajuan
    ? letterStatuses.includes(data.pengajuan.status)
    : false;
  const pklBerakhir =
    data.pengajuan?.status === "berlangsung" &&
    Boolean(
      data.pengajuan.tanggal_selesai &&
        data.pengajuan.tanggal_selesai < data.today,
    );
  const journalNeedsWork =
    !pklBerakhir &&
    (!data.jurnalHariIni || data.jurnalHariIni.status === "revisi");
  const mutabaahNeedsWork =
    !pklBerakhir &&
    Boolean(data.mutabaah.formNama) &&
    !data.mutabaah.hariIniTerisi;

  let primaryAction: "jurnal" | "mutabaah" | null = null;

  if (data.siswa && data.pengajuan) {
    if (journalNeedsWork) {
      primaryAction = "jurnal";
    } else if (mutabaahNeedsWork) {
      primaryAction = "mutabaah";
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            {format(parseISO(data.today), "EEEE, d MMMM yyyy", {
              locale: localeId,
            })}
          </p>
          <h1 className="mt-1 text-balance font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Assalamu&apos;alaikum, {firstName}.
          </h1>
        </div>

        {data.siswa ? (
          <div className="text-sm sm:text-right">
            <p className="font-medium text-ink-soft">
              {[data.siswa.kelas, data.siswa.jurusan?.nama]
                .filter(Boolean)
                .join(" · ") || "Siswa PKL"}
            </p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
              NIS {data.siswa.nis}
            </p>
          </div>
        ) : null}
      </header>

      {!data.siswa ? (
        <section className={card}>
          <EmptyState
            icon={CircleAlert}
            title="Profil siswa belum lengkap"
            description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar data Anda dilengkapi."
          />
        </section>
      ) : (
        <>
          {data.pengajuan ? (
            <section className={card} aria-labelledby="status-pkl-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="status-pkl-title"
                  className="text-xl font-semibold text-ink"
                >
                  Status PKL
                </h2>
                <PengajuanBadge status={data.pengajuan.status} />
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink">
                    {data.pengajuan.perusahaan?.nama ??
                      "Tempat PKL belum ditetapkan"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {[
                      data.pengajuan.perusahaan?.kota,
                      data.pengajuan.periode?.nama,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Menunggu penempatan dari sekolah"}
                  </p>
                  <p className="mt-3 max-w-[68ch] text-base leading-[26px] text-ink-soft">
                    {pklBerakhir
                      ? "Periode PKL sudah berakhir. Sekolah akan menerbitkan surat penarikan."
                      : statusPengajuanNextStep[data.pengajuan.status]}
                  </p>
                </div>

                <Link
                  href={hasLetter ? "/siswa/surat" : "/siswa/pengajuan"}
                  prefetch={false}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "md" }),
                    "hidden shrink-0 sm:inline-flex",
                  )}
                >
                  {hasLetter ? "Lihat surat" : "Lihat pengajuan"}
                  <ArrowRight
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>
              </div>

              {data.pengajuan.status === "ditolak" &&
              data.pengajuan.alasan_penolakan ? (
                <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p>{data.pengajuan.alasan_penolakan}</p>
                </div>
              ) : null}

              <ol
                className="mt-6 hidden grid-cols-4 gap-2 sm:grid"
                aria-label="Tahap PKL"
              >
                {stages.map((label, index) => {
                  const number = index + 1;
                  const done = stage > number;
                  const current = stage === number;
                  const filled = done || current;

                  return (
                    <li
                      key={label}
                      className="min-w-0"
                      aria-current={current ? "step" : undefined}
                    >
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          filled ? "bg-brand-600" : "bg-border",
                        )}
                      />
                      <p
                        className={cn(
                          "mt-2 text-[12px] leading-4",
                          current
                            ? "font-semibold text-brand-700"
                            : done
                              ? "text-ink-soft"
                              : "text-muted",
                        )}
                      >
                        {label === "Keberangkatan" ? (
                          <>
                            <span className="sm:hidden">Berangkat</span>
                            <span className="hidden sm:inline">{label}</span>
                          </>
                        ) : (
                          label
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : (
            <section className={card} aria-labelledby="status-pkl-title">
              <h2
                id="status-pkl-title"
                className="text-xl font-semibold text-ink"
              >
                Status PKL
              </h2>
              <div className="mt-4">
                <EmptyState
                  icon={FileText}
                  title="Belum ada pengajuan tempat PKL"
                  description="Ajukan tempat PKL agar sekolah dapat menerbitkan surat izin orang tua."
                  action={
                    <Link
                      href="/siswa/pengajuan"
                      prefetch={false}
                      className={cn(
                        buttonVariants({ variant: "primary" }),
                        "w-full sm:w-auto",
                      )}
                    >
                      Ajukan tempat PKL
                      <ArrowRight
                        className="size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </Link>
                  }
                />
              </div>
            </section>
          )}

          <section className="mt-6 sm:mt-8" aria-labelledby="hari-ini-title">
            <h2 id="hari-ini-title" className="sr-only">
              Hari ini
            </h2>

            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <article className={cn(card, "flex flex-col")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">
                      Jurnal hari ini
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatDay(data.today)}
                    </p>
                  </div>
                  <BookOpen
                    className="size-5 shrink-0 text-brand-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>

                <div className="mt-4">
                  {data.jurnalHariIni ? (
                    <>
                      <JurnalBadge status={data.jurnalHariIni.status} />
                      <p className="mt-3 text-base font-medium leading-[26px] text-ink">
                        {data.jurnalHariIni.kegiatan}
                      </p>
                      {formatTime(data.jurnalHariIni.waktu_mulai) &&
                      formatTime(data.jurnalHariIni.waktu_selesai) ? (
                        <p className="mt-1 text-sm text-muted tabular-nums">
                          {formatTime(data.jurnalHariIni.waktu_mulai)}–
                          {formatTime(data.jurnalHariIni.waktu_selesai)}
                        </p>
                      ) : null}
                      {data.jurnalHariIni.status === "revisi" ? (
                        <p className="mt-2 text-sm leading-[22px] text-danger">
                          Perbaiki jurnal ini, lalu kirim ulang untuk
                          diverifikasi.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <StatusBadge
                        label="Belum diisi"
                        tone="warning"
                        icon={CalendarDays}
                      />
                      <p className="mt-3 text-base leading-[26px] text-ink-soft">
                        Isi jurnal sebelum pukul 23.59 agar kegiatan hari ini
                        tercatat.
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    href={
                      data.jurnalHariIni
                        ? "/siswa/jurnal"
                        : "/siswa/jurnal/baru"
                    }
                    prefetch={false}
                    className={cn(
                      buttonVariants({
                        variant:
                          primaryAction === "jurnal" ? "primary" : "secondary",
                        size: "md",
                      }),
                      "w-full sm:w-auto",
                    )}
                  >
                    {data.jurnalHariIni
                      ? data.jurnalHariIni.status === "revisi"
                        ? "Perbaiki jurnal"
                        : "Lihat jurnal"
                      : "Isi jurnal"}
                  </Link>
                </div>
              </article>

              <article className={cn(card, "flex flex-col")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">
                      Mutaba&apos;ah
                    </h3>
                    <p className="mt-1 text-sm text-muted">Minggu ini</p>
                  </div>
                  <HeartHandshake
                    className="size-5 shrink-0 text-brand-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <MutabaahRing
                    value={data.mutabaah.terisi}
                    total={data.mutabaah.totalHari}
                  />
                  <div className="min-w-0">
                    {data.mutabaah.formNama ? (
                      <p className="mt-1 text-sm leading-[22px] text-ink-soft">
                        {data.mutabaah.hariIniTerisi
                          ? "Sudah diisi hari ini."
                          : "Belum diisi hari ini."}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm leading-[22px] text-ink-soft">
                        Form belum aktif dari sekolah.
                      </p>
                    )}
                  </div>
                </div>

                {data.mutabaah.formNama ? (
                  <div className="mt-auto pt-5">
                    <Link
                      href="/siswa/mutabaah"
                      prefetch={false}
                      className={cn(
                        buttonVariants({
                          variant:
                            primaryAction === "mutabaah"
                              ? "primary"
                              : "secondary",
                          size: "md",
                        }),
                        "w-full sm:w-auto",
                      )}
                    >
                      {data.mutabaah.hariIniTerisi
                        ? "Lihat mutaba'ah"
                        : "Isi mutaba'ah"}
                    </Link>
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <section
            className="mt-6 sm:mt-8"
            aria-labelledby="jurnal-terakhir-title"
          >
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2
                id="jurnal-terakhir-title"
                className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
              >
                Jurnal terakhir
              </h2>
              <Link
                href="/siswa/jurnal"
                prefetch={false}
                className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                Lihat semua
              </Link>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
              {data.jurnalTerakhir.length ? (
                <ul className="divide-y divide-border">
                  {data.jurnalTerakhir.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] leading-[18px] text-muted">
                          {formatDay(entry.tanggal)}
                        </p>
                        <p className="mt-0.5 truncate text-base font-medium text-ink">
                          {entry.kegiatan}
                        </p>
                      </div>
                      <JurnalBadge status={entry.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 sm:p-6">
                  <EmptyState
                    icon={BookOpen}
                    title="Belum ada jurnal"
                    description="Jurnal yang Anda isi akan muncul di sini beserta status verifikasinya."
                  />
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
