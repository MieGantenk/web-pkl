import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Search,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import { getGuruStudents } from "@/lib/data/guru";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siswa bimbingan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type GuruStudentsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export default async function GuruStudentsPage({
  searchParams,
}: GuruStudentsPageProps) {
  const profile = await requireRole("guru");
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const selectedJurusan =
    typeof params.jurusan === "string" ? params.jurusan : "";

  const { context, students } = await getGuruStudents(profile.id);
  const normalizedQuery = query.toLowerCase();
  const jurusanOptions = Array.from(
    new Set(
      students
        .map((student) => student.jurusan?.nama)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filtered = students.filter((student) => {
    const matchesQuery =
      !normalizedQuery ||
      student.nama.toLowerCase().includes(normalizedQuery) ||
      student.nis.toLowerCase().includes(normalizedQuery);
    const matchesJurusan =
      !selectedJurusan || student.jurusan?.nama === selectedJurusan;

    return matchesQuery && matchesJurusan;
  });

  const pendingJournals = students.reduce(
    (total, student) => total + student.jurnal.menunggu,
    0,
  );
  const hasFilter = Boolean(query || selectedJurusan);

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Siswa bimbingan
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            {students.length
              ? `${students.length} siswa pada penempatan aktif${
                  context?.jurusan?.nama
                    ? ` · ${context.jurusan.nama}`
                    : ""
                }.`
              : "Belum ada siswa pada penempatan aktif."}
          </p>
        </div>

        {students.length ? (
          <Link
            href="/guru/verifikasi"
            prefetch={false}
            className={cn(
              buttonVariants({
                variant: pendingJournals > 0 ? "primary" : "secondary",
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
            {pendingJournals > 0
              ? `Verifikasi jurnal (${pendingJournals})`
              : "Buka verifikasi"}
          </Link>
        ) : null}
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-end"
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

        <Field label="Jurusan" htmlFor="jurusan">
          <Select id="jurusan" name="jurusan" defaultValue={selectedJurusan}>
            <option value="">Semua jurusan</option>
            {jurusanOptions.map((jurusan) => (
              <option key={jurusan} value={jurusan}>
                {jurusan}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            <Search className="size-4" strokeWidth={1.75} aria-hidden />
            Terapkan
          </button>
          <Link
            href="/guru/siswa"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </form>

      {!students.length ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={Users}
            title="Belum ada siswa bimbingan"
            description="Siswa akan muncul di sini setelah admin menetapkan Anda sebagai guru pembimbing."
          />
        </section>
      ) : !filtered.length ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={Search}
            title="Siswa tidak ditemukan"
            description="Coba kata kunci lain atau pilih jurusan yang berbeda."
            action={
              hasFilter ? (
                <Link
                  href="/guru/siswa"
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

              return (
                <li key={student.id} className={card}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/guru/siswa/${student.id}`}
                        prefetch={false}
                        className="inline-flex min-h-11 items-center text-base font-semibold text-ink hover:text-brand-700"
                      >
                        {student.nama}
                      </Link>
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
                        Jurnal terverifikasi
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
                      {student.jurnal.menunggu ||
                      student.jurnal.revisi ? (
                        <p className="mt-1 text-[12px] leading-4 text-warning">
                          {student.jurnal.menunggu} menunggu
                          {student.jurnal.revisi
                            ? ` · ${student.jurnal.revisi} revisi`
                            : ""}
                        </p>
                      ) : null}
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

                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <Link
                      href={`/guru/siswa/${student.id}`}
                      prefetch={false}
                      className="inline-flex h-11 items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Lihat detail
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
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">
                  Daftar siswa bimbingan beserta penempatan, status PKL,
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
                    <th scope="col" className="hidden px-4 py-3 xl:table-cell">
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

                    return (
                      <tr
                        key={student.id}
                        className="transition-colors duration-[var(--m-fast)] hover:bg-brand-50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/guru/siswa/${student.id}`}
                            prefetch={false}
                            className="inline-flex min-h-11 items-center font-medium text-ink hover:text-brand-700"
                          >
                            {student.nama}
                          </Link>
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
                          <PengajuanBadge status={student.pengajuanStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-[150px]">
                            <p className="text-ink-soft tabular-nums">
                              {student.jurnal.terverifikasi}/
                              {student.jurnal.total} terverifikasi
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
                            {student.jurnal.menunggu ||
                            student.jurnal.revisi ? (
                              <p className="mt-1 text-[12px] leading-4 text-warning">
                                {student.jurnal.menunggu} menunggu
                                {student.jurnal.revisi
                                  ? ` · ${student.jurnal.revisi} revisi`
                                  : ""}
                              </p>
                            ) : null}
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
                            href={`/guru/siswa/${student.id}`}
                            prefetch={false}
                            className="inline-flex h-11 items-center justify-end gap-1.5 px-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                          >
                            Lihat
                            <ArrowRight
                              className="size-4"
                              strokeWidth={1.75}
                              aria-hidden
                            />
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
    </div>
  );
}
