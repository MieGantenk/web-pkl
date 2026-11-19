import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth";
import { getGuruStudents } from "@/lib/data/guru";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siswa Bimbingan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type GuruStudentsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function GuruStudentsPage({
  searchParams,
}: GuruStudentsPageProps) {
  const profile = await requireRole("guru");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
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

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Siswa Bimbingan
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            {students.length
              ? `${students.length} siswa pada penempatan aktif.`
              : "Belum ada siswa pada penempatan aktif."}
          </p>
        </div>

        {context?.jurusan?.nama ? (
          <p className="text-sm text-muted lg:text-right">
            {context.jurusan.nama}
          </p>
        ) : null}
      </header>

      <section className={cn(card, "mb-6")}>
        <form
          action="/guru/siswa"
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="q"
              className="block text-[13px] font-medium leading-[18px] text-ink"
            >
              Cari siswa
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Nama atau NIS"
              className="mt-1.5"
            />
          </div>

          <div className="sm:w-56">
            <label
              htmlFor="jurusan"
              className="block text-[13px] font-medium leading-[18px] text-ink"
            >
              Jurusan
            </label>
            <select
              id="jurusan"
              name="jurusan"
              defaultValue={selectedJurusan}
              className="mt-1.5 h-12 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-ink shadow-xs transition-[border-color,box-shadow] duration-[var(--m-fast)] hover:border-brand-600 focus:border-brand-500 focus:ring-3 focus:ring-brand-100 sm:h-11"
            >
              <option value="">Semua jurusan</option>
              {jurusanOptions.map((jurusan) => (
                <option key={jurusan} value={jurusan}>
                  {jurusan}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              <Search className="size-4" strokeWidth={1.75} aria-hidden />
              Cari
            </Button>
            {query || selectedJurusan ? (
              <Link
                href="/guru/siswa"
                prefetch={false}
                className={buttonVariants({ variant: "ghost" })}
              >
                Reset
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      {!students.length ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada siswa bimbingan"
            description="Siswa akan muncul di sini setelah admin menetapkan Anda sebagai guru pembimbing."
          />
        </section>
      ) : !filtered.length ? (
        <section className={card}>
          <EmptyState
            icon={Search}
            title="Siswa tidak ditemukan"
            description="Coba kata kunci lain atau pilih jurusan yang berbeda."
          />
        </section>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((student) => (
              <article key={student.id} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/guru/siswa/${student.id}`}
                      prefetch={false}
                      className="text-base font-medium text-ink hover:text-brand-700"
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

                <p className="mt-3 text-sm text-ink-soft">
                  {student.perusahaan?.nama ?? "Belum ada tempat PKL"}
                </p>
                <p className="text-[13px] leading-[18px] text-muted">
                  {student.periode?.nama ?? "—"}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="text-[13px] text-muted tabular-nums">
                    {student.jurnal.terverifikasi}/{student.jurnal.total} jurnal
                    · {student.mutabaah.terisi}/7 mutaba&apos;ah
                  </p>
                  <Link
                    href={`/guru/siswa/${student.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Detail
                    <ArrowRight
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-surface-muted/60 text-left text-[13px] text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Siswa</th>
                    <th className="px-4 py-3 font-medium">Penempatan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Jurnal</th>
                    <th className="px-4 py-3 font-medium">Mutaba&apos;ah</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-surface-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/guru/siswa/${student.id}`}
                          prefetch={false}
                          className="font-medium text-ink hover:text-brand-700"
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
                        <p className="text-ink-soft tabular-nums">
                          {student.jurnal.terverifikasi}/
                          {student.jurnal.total} terverifikasi
                        </p>
                        <p className="text-[13px] leading-[18px] text-muted">
                          {student.jurnal.menunggu} menunggu
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {student.mutabaah.terisi}/{student.mutabaah.totalHari}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/guru/siswa/${student.id}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Detail
                          <ArrowRight
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
