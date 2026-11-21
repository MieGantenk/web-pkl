import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Search,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  getInstrukturStudents,
  type InstrukturStudent,
} from "@/lib/data/instruktur";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siswa PKL",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const statusFilters = [
  { value: "siap", label: "Siap diverifikasi" },
  { value: "menunggu", label: "Menunggu guru" },
  { value: "revisi", label: "Perlu revisi" },
  { value: "final", label: "Sudah final" },
  { value: "belum", label: "Belum ada jurnal" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

type InstrukturStudentsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function journalStatus(student: InstrukturStudent) {
  const parts: string[] = [];

  if (student.jurnal.siapVerifikasi) {
    parts.push(`${student.jurnal.siapVerifikasi} siap diverifikasi`);
  }

  if (student.jurnal.revisi) {
    parts.push(`${student.jurnal.revisi} revisi`);
  }

  if (student.jurnal.menungguGuru) {
    parts.push(`${student.jurnal.menungguGuru} menunggu guru`);
  }

  if (!parts.length) {
    return student.jurnal.total
      ? { label: "Semua jurnal final", className: "text-success" }
      : { label: "Belum ada jurnal", className: "text-muted" };
  }

  const className = student.jurnal.siapVerifikasi
    ? "text-warning"
    : student.jurnal.revisi
      ? "text-danger"
      : "text-muted";

  return { label: parts.join(" · "), className };
}

function verifikasiHref(student: InstrukturStudent) {
  return student.pendingJournalId
    ? `/instruktur/verifikasi?jurnal=${student.pendingJournalId}`
    : "/instruktur/verifikasi";
}

export default async function InstrukturStudentsPage({
  searchParams,
}: InstrukturStudentsPageProps) {
  const profile = await requireRole("instruktur");
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const perusahaanParam =
    typeof params.perusahaan === "string" ? params.perusahaan : "";
  const selectedStatus = statusFilters.some(
    (item) => item.value === params.status,
  )
    ? (params.status as StatusFilter)
    : "";

  const { context, students } = await getInstrukturStudents(profile.id);
  const selectedPerusahaan = context.companies.some(
    (company) => company.id === perusahaanParam,
  )
    ? perusahaanParam
    : "";
  const normalizedQuery = query.toLowerCase();

  const filtered = students.filter((student) => {
    const matchesQuery =
      !normalizedQuery ||
      student.nama.toLowerCase().includes(normalizedQuery) ||
      student.nis.toLowerCase().includes(normalizedQuery);
    const matchesPerusahaan =
      !selectedPerusahaan || student.perusahaan?.id === selectedPerusahaan;
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === "siap" && student.jurnal.siapVerifikasi > 0) ||
      (selectedStatus === "menunggu" && student.jurnal.menungguGuru > 0) ||
      (selectedStatus === "revisi" && student.jurnal.revisi > 0) ||
      (selectedStatus === "final" &&
        student.jurnal.total > 0 &&
        student.jurnal.terverifikasi === student.jurnal.total) ||
      (selectedStatus === "belum" && student.jurnal.total === 0);

    return matchesQuery && matchesPerusahaan && matchesStatus;
  }).sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  const pendingVerification = students.reduce(
    (total, student) => total + student.jurnal.siapVerifikasi,
    0,
  );
  const revisionCount = students.reduce(
    (total, student) => total + student.jurnal.revisi,
    0,
  );
  const mutabaahFilled = students.reduce(
    (total, student) => total + student.mutabaah.terisi,
    0,
  );
  const mutabaahTarget = students.length * 7;
  const mutabaahPercent = percent(mutabaahFilled, mutabaahTarget);
  const hasFilter = Boolean(query || selectedPerusahaan || selectedStatus);
  const multipleCompanies = context.companies.length > 1;
  const companyLabel =
    context.companies.length === 1
      ? context.companies[0].nama
      : `${context.companies.length} perusahaan`;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Instruktur Perusahaan
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Siswa PKL
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Pantau progres jurnal dan mutaba&apos;ah siswa di perusahaan yang
            Anda dampingi.
          </p>
        </div>

        {students.length ? (
          <Link
            href="/instruktur/verifikasi"
            prefetch={false}
            className={cn(
              buttonVariants({
                variant: pendingVerification > 0 ? "primary" : "secondary",
                size: "md",
              }),
              "w-full sm:w-auto",
            )}
          >
            <ClipboardCheck
              className="size-4"
              strokeWidth={1.75}
              aria-hidden
            />
            {pendingVerification > 0
              ? `Verifikasi jurnal (${pendingVerification})`
              : "Buka verifikasi"}
          </Link>
        ) : null}
      </header>

      {!context.companies.length ? (
        <section className={card}>
          <EmptyState
            icon={Building2}
            title="Belum ada penugasan perusahaan"
            description="Akun ini belum ditugaskan ke perusahaan. Hubungi admin sekolah agar Anda dihubungkan dengan perusahaan tempat siswa PKL."
          />
        </section>
      ) : !students.length ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada siswa perusahaan"
            description="Siswa akan muncul di sini setelah admin menetapkan penempatan pada perusahaan Anda."
          />
        </section>
      ) : (
        <>
          <dl
            aria-label="Ringkasan siswa PKL"
            className="mb-4 grid overflow-hidden rounded-md border border-border bg-surface shadow-xs sm:grid-cols-3"
          >
            <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
              <dt className="text-[13px] font-medium leading-[18px] text-muted">
                Siswa dampingan
              </dt>
              <dd className="mt-1">
                <span className="block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
                  {students.length}
                </span>
                <span className="mt-1 block text-[13px] leading-[18px] text-muted">
                  {companyLabel}
                </span>
              </dd>
            </div>

            <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
              <dt className="text-[13px] font-medium leading-[18px] text-muted">
                Siap diverifikasi
              </dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] tabular-nums",
                    pendingVerification ? "text-warning" : "text-ink",
                  )}
                >
                  {pendingVerification}
                </span>
                <span className="mt-1 block text-[13px] leading-[18px] text-muted">
                  {pendingVerification
                    ? "Jurnal menunggu langkah 2"
                    : "Tidak ada antrean"}
                </span>
                {revisionCount ? (
                  <span className="mt-1 block text-[12px] leading-4 text-danger">
                    {revisionCount} jurnal perlu revisi
                  </span>
                ) : null}
              </dd>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <dt className="text-[13px] font-medium leading-[18px] text-muted">
                Mutaba&apos;ah minggu ini
              </dt>
              <dd className="mt-1">
                <span className="block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
                  {mutabaahFilled}
                  <span className="text-base font-medium text-muted">
                    /{mutabaahTarget}
                  </span>
                </span>
                <span
                  className="mt-2 block h-1.5 overflow-hidden rounded-full bg-border"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${mutabaahPercent}%` }}
                  />
                </span>
              </dd>
            </div>
          </dl>

          <FilterForm
            className={cn(
              "grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 sm:items-end",
              multipleCompanies
                ? "lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]"
                : "lg:grid-cols-[minmax(0,1fr)_190px_auto]",
            )}
          >
            <Field label="Cari siswa" htmlFor="q">
              <Input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Nama atau NIS"
              />
            </Field>

            {multipleCompanies ? (
              <Field label="Perusahaan" htmlFor="perusahaan">
                <Select
                  id="perusahaan"
                  name="perusahaan"
                  defaultValue={selectedPerusahaan}
                >
                  <option value="">Semua perusahaan</option>
                  {context.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nama}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <Field label="Status jurnal" htmlFor="status">
              <Select id="status" name="status" defaultValue={selectedStatus}>
                <option value="">Semua status</option>
                {statusFilters.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center gap-2">
              <Link
                href="/instruktur/siswa"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "md" }),
                  "flex-1 sm:flex-none",
                )}
              >
                Reset
              </Link>
            </div>
          </FilterForm>

          {!filtered.length ? (
            <section className={cn(card, "mt-4")}>
              <EmptyState
                icon={Search}
                title="Siswa tidak ditemukan"
                description="Coba kata kunci lain atau pilih filter yang berbeda."
                action={
                  hasFilter ? (
                    <Link
                      href="/instruktur/siswa"
                      className={buttonVariants({ variant: "secondary" })}
                    >
                      Reset filter
                    </Link>
                  ) : undefined
                }
              />
            </section>
          ) : (
            <>
              <ul className="mt-4 space-y-3 md:hidden">
                {filtered.map((student) => {
                  const journalPercent = percent(
                    student.jurnal.terverifikasi,
                    student.jurnal.total,
                  );
                  const mutabaahPercent = percent(
                    student.mutabaah.terisi,
                    student.mutabaah.totalHari,
                  );
                  const status = journalStatus(student);

                  return (
                    <li key={student.id} className={card}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-ink">
                            {student.nama}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                            {student.nis} · {student.kelas ?? "—"} ·{" "}
                            {student.jurusan?.nama ?? "—"}
                          </p>
                        </div>
                        <PengajuanBadge status={student.pengajuanStatus} />
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-ink-soft">
                          {student.perusahaan?.nama ?? "Belum ada tempat PKL"}
                        </p>
                        <p className="text-[13px] leading-[18px] text-muted">
                          {student.periode?.nama ?? "—"}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[12px] leading-4 text-muted">
                            Jurnal final
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-ink tabular-nums">
                            {student.jurnal.terverifikasi}/
                            {student.jurnal.total}
                          </p>
                          <div
                            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                            aria-hidden
                          >
                            <div
                              className="h-full rounded-full bg-brand-600"
                              style={{ width: `${journalPercent}%` }}
                            />
                          </div>
                          <p
                            className={cn(
                              "mt-1 text-[12px] leading-4",
                              status.className,
                            )}
                          >
                            {status.label}
                          </p>
                        </div>

                        <div>
                          <p className="text-[12px] leading-4 text-muted">
                            Mutaba&apos;ah minggu ini
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-ink tabular-nums">
                            {student.mutabaah.terisi}/
                            {student.mutabaah.totalHari}
                          </p>
                          <div
                            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                            aria-hidden
                          >
                            <div
                              className="h-full rounded-full bg-brand-600"
                              style={{ width: `${mutabaahPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
                        <Link
                          href={verifikasiHref(student)}
                          prefetch={false}
                          className="inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                        >
                          <ClipboardCheck
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {student.pendingJournalId
                            ? "Verifikasi jurnal"
                            : "Buka antrean verifikasi"}
                          <ArrowRight
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <caption className="sr-only">
                      Daftar siswa PKL perusahaan beserta penempatan, status,
                      progres jurnal, dan mutaba&apos;ah
                    </caption>
                    <thead className="border-b border-border bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Siswa
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Penempatan
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Status PKL
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Jurnal
                        </th>
                        <th
                          scope="col"
                          className="hidden px-4 py-3 xl:table-cell"
                        >
                          Mutaba&apos;ah
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((student) => {
                        const journalPercent = percent(
                          student.jurnal.terverifikasi,
                          student.jurnal.total,
                        );
                        const mutabaahPercent = percent(
                          student.mutabaah.terisi,
                          student.mutabaah.totalHari,
                        );
                        const status = journalStatus(student);

                        return (
                          <tr
                            key={student.id}
                            className="transition-colors duration-[var(--m-fast)] hover:bg-brand-50"
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-ink">
                                {student.nama}
                              </p>
                              <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                                {student.nis} · {student.kelas ?? "—"} ·{" "}
                                {student.jurusan?.nama ?? "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-ink-soft">
                                {student.perusahaan?.nama ?? "Belum ada"}
                              </p>
                              <p className="text-[13px] leading-[18px] text-muted">
                                {student.periode?.nama ?? "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <PengajuanBadge
                                status={student.pengajuanStatus}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-[170px]">
                                <p className="text-ink-soft tabular-nums">
                                  {student.jurnal.terverifikasi}/
                                  {student.jurnal.total} final
                                </p>
                                <div
                                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                                  aria-hidden
                                >
                                  <div
                                    className="h-full rounded-full bg-brand-600"
                                    style={{ width: `${journalPercent}%` }}
                                  />
                                </div>
                                <p
                                  className={cn(
                                    "mt-1 text-[12px] leading-4",
                                    status.className,
                                  )}
                                >
                                  {status.label}
                                </p>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 xl:table-cell">
                              <div className="min-w-[120px]">
                                <p className="text-ink-soft tabular-nums">
                                  {student.mutabaah.terisi}/
                                  {student.mutabaah.totalHari}
                                </p>
                                <div
                                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                                  aria-hidden
                                >
                                  <div
                                    className="h-full rounded-full bg-brand-600"
                                    style={{ width: `${mutabaahPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={verifikasiHref(student)}
                                prefetch={false}
                                className="inline-flex h-11 items-center justify-end gap-1.5 px-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                              >
                                <ClipboardCheck
                                  className="size-4"
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                                {student.pendingJournalId
                                  ? "Verifikasi"
                                  : "Buka antrean"}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
