import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardCheck,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import {
  JurnalBadge,
  PengajuanBadge,
} from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import {
  getInstrukturDashboard,
  type InstrukturStudent,
} from "@/lib/data/instruktur";

export const metadata: Metadata = {
  title: "Ringkasan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM", { locale: localeId });
}

function journalProgress(student: InstrukturStudent) {
  if (!student.jurnal.total) {
    return "Belum ada jurnal";
  }

  return `${student.jurnal.terverifikasi}/${student.jurnal.total} jurnal final`;
}

export default async function InstrukturHomePage() {
  const profile = await requireRole("instruktur");
  const data = await getInstrukturDashboard(profile.id);

  const firstName = profile.nama_lengkap.trim().split(" ")[0] || "Instruktur";
  const companies = data.context.companies;
  const companyLabel = companies.length
    ? companies
        .slice(0, 2)
        .map((company) => company.nama)
        .join(" · ") + (companies.length > 2 ? ` +${companies.length - 2}` : "")
    : "Belum ada perusahaan";

  const queueCards = [
    {
      label: "Siswa PKL",
      count: data.studentCount,
      href: "/instruktur/siswa",
      action: "Lihat siswa",
      icon: Users,
    },
    {
      label: "Perusahaan",
      count: companies.length,
      href: "/instruktur/siswa",
      action: "Lihat penempatan",
      icon: Building2,
    },
    {
      label: "Jurnal siap diverifikasi",
      count: data.pending,
      href: "/instruktur/verifikasi",
      action: "Tinjau jurnal",
      icon: ClipboardCheck,
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
            Pantau siswa PKL dan progres jurnal dari perusahaan yang Anda
            dampingi.
          </p>
        </div>

        <div className="text-sm lg:max-w-[320px] lg:text-right">
          <p className="font-medium text-ink-soft">{companyLabel}</p>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">
            {companies.length
              ? `${companies.length} penugasan perusahaan`
              : "Hubungi admin sekolah untuk penugasan"}
          </p>
        </div>
      </header>

      {!companies.length ? (
        <section className={card}>
          <EmptyState
            icon={Building2}
            title="Belum ada penugasan perusahaan"
            description="Akun ini belum ditugaskan ke perusahaan. Hubungi admin sekolah agar Anda dihubungkan dengan perusahaan tempat siswa PKL."
          />
        </section>
      ) : (
        <>
          <section aria-labelledby="ringkasan-title">
            <h2 id="ringkasan-title" className="sr-only">
              Ringkasan instruktur
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {queueCards.map((item) => (
                <Link
                  key={item.label}
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

          <section className="mt-6 sm:mt-8" aria-labelledby="siswa-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="siswa-title"
                  className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
                >
                  Siswa perusahaan
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {data.studentCount} siswa pada penempatan aktif.
                </p>
              </div>
              <Link
                href="/instruktur/siswa"
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
                        <p className="text-base font-medium text-ink">
                          {student.nama}
                        </p>
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
                    title="Belum ada siswa perusahaan"
                    description="Siswa akan muncul di sini setelah admin menetapkan penempatan pada perusahaan Anda."
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
                  5 jurnal terakhir dari siswa perusahaan.
                </p>
              </div>
              <Link
                href="/instruktur/siswa"
                prefetch={false}
                className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                Lihat siswa
              </Link>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
              {data.journals.length ? (
                <ul className="divide-y divide-border">
                  {data.journals.map((journal) => (
                    <li key={journal.id}>
                      <Link
                        href={`/instruktur/verifikasi?jurnalId=${journal.id}`}
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
                    description="Jurnal siswa perusahaan akan muncul di sini setelah diisi."
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
