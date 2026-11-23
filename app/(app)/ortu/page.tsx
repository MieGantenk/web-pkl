import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Ban,
  BookOpen,
  CircleAlert,
  FileCheck,
  FileText,
  HeartHandshake,
  ScrollText,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import {
  JurnalBadge,
  PengajuanBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getOrtuDashboard, type OrtuChild } from "@/lib/data/ortu-dashboard";
import {
  jenisSuratLabel,
  statusPengajuanNextStep,
  statusSurat,
} from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beranda",
};

// Sama seperti dashboard lain: data sesi dimuat memblokir.
export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const hubunganLabel: Record<OrtuChild["hubungan"], string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
};

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM", { locale: localeId });
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

type OrtuHomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrtuHomePage({ searchParams }: OrtuHomePageProps) {
  const profile = await requireRole("ortu");
  const params = await searchParams;
  const selectedChildId =
    typeof params.anak === "string" ? params.anak : undefined;
  const data = await getOrtuDashboard(profile.id, selectedChildId);

  const child = data.activeChild;
  const pengajuan = data.pengajuan;
  const firstName = profile.nama_lengkap.trim().split(" ")[0] || "Bapak/Ibu";
  const startDate =
    pengajuan?.tanggal_mulai ??
    pengajuan?.periode?.tanggal_mulai ??
    null;
  const endDate =
    pengajuan?.tanggal_selesai ??
    pengajuan?.periode?.tanggal_selesai ??
    null;

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
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Ringkasan perkembangan PKL {child?.nama ?? "anak Anda"}.
          </p>
        </div>
      </header>

      {data.children.length > 1 ? (
        <nav aria-label="Pilih anak" className="mb-6 flex flex-wrap gap-2">
          {data.children.map((item) => {
            const active = item.id === child?.id;

            return (
              <Link
                key={item.id}
                href={`/ortu?anak=${item.id}`}
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

      {!child ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada data anak"
            description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar relasi orang tua dan siswa dibuat."
          />
        </section>
      ) : (
        <>
          <section className={card} aria-labelledby="status-pkl-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[13px] font-medium leading-[18px] text-muted">
                  Anak
                </p>
                <h2
                  id="status-pkl-title"
                  className="mt-1 font-display text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink"
                >
                  {child.nama}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {[
                    hubunganLabel[child.hubungan],
                    child.kelas,
                    child.jurusan?.nama,
                    `NIS ${child.nis}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {pengajuan ? (
                <PengajuanBadge status={pengajuan.status} />
              ) : (
                <StatusBadge
                  label="Belum ada pengajuan"
                  tone="warning"
                  icon={FileText}
                />
              )}
            </div>

            {pengajuan ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-display text-[20px] font-semibold leading-7 tracking-[-0.01em] text-ink">
                  {pengajuan.perusahaan?.nama ?? "Tempat PKL belum ditetapkan"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {[
                    pengajuan.perusahaan?.kota,
                    pengajuan.periode?.nama,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Menunggu penempatan dari sekolah"}
                </p>

                {startDate && endDate ? (
                  <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
                    {format(parseISO(startDate), "d MMM yyyy", {
                      locale: localeId,
                    })}{" "}
                    –{" "}
                    {format(parseISO(endDate), "d MMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                ) : null}

                <p className="mt-3 max-w-[68ch] text-base leading-[26px] text-ink-soft">
                  {statusPengajuanNextStep[pengajuan.status]}
                </p>

                {pengajuan.status === "ditolak" &&
                pengajuan.alasan_penolakan ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
                    <CircleAlert
                      className="mt-0.5 size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p>{pengajuan.alasan_penolakan}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 border-t border-border pt-4">
                <EmptyState
                  icon={FileText}
                  title="Belum ada pengajuan PKL"
                  description="Status pengajuan anak Anda akan muncul di sini setelah siswa mengajukan tempat PKL pada periode aktif."
                />
              </div>
            )}
          </section>

          <section
            className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6"
            aria-label="Ringkasan kegiatan"
          >
            <article className={cn(card, "flex flex-col")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink">
                    Jurnal terbaru
                  </h2>
                  <p className="mt-1 text-sm text-muted">3 kegiatan terakhir</p>
                </div>
                <BookOpen
                  className="size-5 shrink-0 text-brand-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>

              {data.jurnal.length ? (
                <ul className="mt-4 divide-y divide-border">
                  {data.jurnal.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col items-start gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] leading-[18px] text-muted">
                          {formatDay(entry.tanggal)}
                        </p>
                        <p className="mt-0.5 truncate text-base font-medium text-ink">
                          {entry.kegiatan}
                        </p>
                        {formatTime(entry.waktu_mulai) &&
                        formatTime(entry.waktu_selesai) ? (
                          <p className="mt-0.5 text-sm text-muted tabular-nums">
                            {formatTime(entry.waktu_mulai)}–
                            {formatTime(entry.waktu_selesai)}
                          </p>
                        ) : null}
                      </div>
                      <JurnalBadge status={entry.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    icon={BookOpen}
                    title="Belum ada jurnal"
                    description="Jurnal harian anak akan muncul di sini setelah diisi."
                  />
                </div>
              )}
            </article>

            <article className={cn(card, "flex flex-col")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink">
                    Mutaba&apos;ah
                  </h2>
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
                    <>
                      <p className="text-[13px] font-medium leading-[18px] text-ink-soft">
                        {data.mutabaah.formNama}
                      </p>
                      <p className="mt-1 text-sm leading-[22px] text-ink-soft">
                        {data.mutabaah.hariIniTerisi
                          ? "Sudah diisi hari ini."
                          : "Belum diisi hari ini."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm leading-[22px] text-ink-soft">
                      Form belum aktif dari sekolah.
                    </p>
                  )}
                </div>
              </div>
            </article>
          </section>

          <section className="mt-6 sm:mt-8" aria-labelledby="surat-title">
            <div className={card}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="surat-title" className="text-xl font-semibold text-ink">
                    Surat
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Surat terbaru untuk pengajuan anak
                  </p>
                </div>
                <ScrollText
                  className="size-5 shrink-0 text-brand-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>

              {data.surat.length ? (
                <ul className="mt-4 divide-y divide-border">
                  {data.surat.map((letter) => {
                    const meta = statusSurat[letter.status];
                    const Icon =
                      letter.status === "terbit"
                        ? FileCheck
                        : letter.status === "dibatalkan"
                          ? Ban
                          : FileText;

                    return (
                      <li
                        key={letter.id}
                        className="flex flex-col items-start gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-medium text-ink">
                            {jenisSuratLabel[letter.jenis]}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                            {letter.nomor ?? "Nomor belum terbit"}
                            {letter.tanggal_terbit
                              ? ` · ${format(
                                  parseISO(letter.tanggal_terbit),
                                  "d MMM yyyy",
                                  { locale: localeId },
                                )}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge
                          label={meta.label}
                          tone={meta.tone}
                          icon={Icon}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    icon={ScrollText}
                    title="Belum ada surat"
                    description="Surat izin, pengajuan, dan keberangkatan akan muncul di sini setelah diterbitkan sekolah."
                  />
                </div>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <Link
                  href={`/ortu/surat?anak=${child.id}`}
                  prefetch={false}
                  className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                >
                  Lihat semua surat
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
