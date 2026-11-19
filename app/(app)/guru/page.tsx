import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  ScrollText,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import {
  JurnalBadge,
  PengajuanBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getGuruDashboard, type GuruStudent } from "@/lib/data/guru";
import { statusSurat } from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ringkasan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM", { locale: localeId });
}

function journalProgress(student: GuruStudent) {
  if (!student.jurnal.total) {
    return "Belum ada jurnal";
  }

  return `${student.jurnal.terverifikasi}/${student.jurnal.total} jurnal terverifikasi`;
}

export default async function GuruHomePage() {
  const profile = await requireRole("guru");
  const data = await getGuruDashboard(profile.id);

  const firstName = profile.nama_lengkap.trim().split(" ")[0] || "Guru";
  const context = data.context;
  const suratMeta = data.suratTugas
    ? statusSurat[data.suratTugas.status]
    : null;

  const queueCards = [
    {
      label: "Perlu diverifikasi",
      count: data.pending,
      href: "/guru/verifikasi",
      action: "Buka antrean",
      icon: ClipboardCheck,
    },
    {
      label: "Siswa bimbingan",
      count: data.studentCount,
      href: "/guru/siswa",
      action: "Lihat siswa",
      icon: Users,
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
            Assalamu&apos;alaikum, {firstName}.
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Pantau jurnal, siswa bimbingan, dan surat tugas PKL.
          </p>
        </div>

        {context ? (
          <div className="text-sm lg:text-right">
            <p className="font-medium text-ink-soft">
              {context.jabatan ?? "Guru Pembimbing"}
            </p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted">
              {context.jurusan?.nama ?? "Belum ada jurusan"}
              {context.nip ? ` · NIP ${context.nip}` : ""}
            </p>
          </div>
        ) : null}
      </header>

      {!context ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Data guru belum terhubung"
            description="Akun ini belum memiliki data guru. Hubungi admin sekolah agar profil guru dihubungkan ke akun Anda."
          />
        </section>
      ) : (
        <>
          <section aria-labelledby="antrean-title">
            <h2 id="antrean-title" className="sr-only">
              Antrean dan ringkasan
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

              <div className={cn(card, "flex flex-col justify-between")}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                      <ScrollText
                        className="size-5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    {suratMeta ? (
                      <StatusBadge
                        label={suratMeta.label}
                        tone={suratMeta.tone}
                        icon={ScrollText}
                      />
                    ) : null}
                  </div>
                  <p className="mt-5 text-[13px] font-medium leading-[18px] text-muted">
                    Surat tugas
                  </p>
                  <p className="mt-1 truncate font-display text-xl font-semibold leading-7 text-ink">
                    {data.suratTugas?.nomor ?? "Belum terbit"}
                  </p>
                  <p className="mt-1 text-[13px] leading-[18px] text-muted">
                    {data.suratTugas?.tanggalTerbit
                      ? format(
                          parseISO(data.suratTugas.tanggalTerbit),
                          "d MMM yyyy",
                          { locale: localeId },
                        )
                      : "Menunggu penerbitan admin"}
                  </p>
                </div>
                <p className="mt-4 text-sm text-muted">
                  Surat monitoring guru pembimbing.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 sm:mt-8" aria-labelledby="siswa-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="siswa-title"
                  className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
                >
                  Siswa bimbingan
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {data.studentCount} siswa pada penempatan aktif.
                </p>
              </div>
              <Link
                href="/guru/siswa"
                prefetch={false}
                className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                Lihat semua
              </Link>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
              {data.students.length ? (
                <ul className="divide-y divide-border">
                  {data.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/guru/siswa/${student.id}`}
                          prefetch={false}
                          className="text-base font-medium text-ink hover:text-brand-700"
                        >
                          {student.nama}
                        </Link>
                        <p className="mt-0.5 truncate text-[13px] leading-[18px] text-muted">
                          {student.nis} · {student.kelas ?? "—"} ·{" "}
                          {student.perusahaan?.nama ?? "Belum ada tempat"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[13px] text-muted tabular-nums">
                          {journalProgress(student)}
                        </span>
                        <PengajuanBadge status={student.pengajuanStatus} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 sm:p-6">
                  <EmptyState
                    icon={Users}
                    title="Belum ada siswa bimbingan"
                    description="Siswa akan muncul di sini setelah admin menetapkan Anda sebagai guru pembimbing."
                  />
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 sm:mt-8" aria-labelledby="jurnal-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="jurnal-title"
                  className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
                >
                  Jurnal terbaru
                </h2>
                <p className="mt-1 text-sm text-muted">
                  5 jurnal terakhir dari siswa bimbingan.
                </p>
              </div>
              <Link
                href="/guru/verifikasi"
                prefetch={false}
                className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                Buka verifikasi
              </Link>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
              {data.journals.length ? (
                <ul className="divide-y divide-border">
                  {data.journals.map((journal) => (
                    <li key={journal.id}>
                      <Link
                        href={`/guru/verifikasi?jurnal=${journal.id}`}
                        prefetch={false}
                        className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface-muted sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] leading-[18px] text-muted">
                            {formatDay(journal.tanggal)} · {journal.nama}
                          </p>
                          <p className="mt-0.5 truncate text-base font-medium text-ink">
                            {journal.kegiatan}
                          </p>
                        </div>
                        <JurnalBadge status={journal.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 sm:p-6">
                  <EmptyState
                    icon={BookOpen}
                    title="Belum ada jurnal"
                    description="Jurnal siswa bimbingan akan muncul di sini setelah diisi."
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
