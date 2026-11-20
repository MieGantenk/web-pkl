import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth";
import { getInstrukturStudents } from "@/lib/data/instruktur";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siswa PKL",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type InstrukturStudentsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function InstrukturStudentsPage({
  searchParams,
}: InstrukturStudentsPageProps) {
  const profile = await requireRole("instruktur");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const selectedPerusahaan =
    typeof params.perusahaan === "string" ? params.perusahaan : "";

  const { context, students } = await getInstrukturStudents(profile.id);
  const normalizedQuery = query.toLowerCase();

  const filtered = students.filter((student) => {
    const matchesQuery =
      !normalizedQuery ||
      student.nama.toLowerCase().includes(normalizedQuery) ||
      student.nis.toLowerCase().includes(normalizedQuery);
    const matchesPerusahaan =
      !selectedPerusahaan || student.perusahaan?.id === selectedPerusahaan;

    return matchesQuery && matchesPerusahaan;
  });

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Instruktur Perusahaan
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Siswa PKL
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            {students.length
              ? `${students.length} siswa dari perusahaan yang Anda dampingi.`
              : "Belum ada siswa pada penempatan perusahaan Anda."}
          </p>
        </div>

        {context.companies.length ? (
          <p className="max-w-[320px] text-sm text-muted lg:text-right">
            {context.companies.map((company) => company.nama).join(" · ")}
          </p>
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
      ) : (
        <>
          <section className={cn(card, "mb-6")}>
            <form
              action="/instruktur/siswa"
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

              <div className="sm:w-64">
                <label
                  htmlFor="perusahaan"
                  className="block text-[13px] font-medium leading-[18px] text-ink"
                >
                  Perusahaan
                </label>
                <select
                  id="perusahaan"
                  name="perusahaan"
                  defaultValue={selectedPerusahaan}
                  className="mt-1.5 h-12 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-ink shadow-xs transition-[border-color,box-shadow] duration-[var(--m-fast)] hover:border-brand-600 focus:border-brand-500 focus:ring-3 focus:ring-brand-100 sm:h-11"
                >
                  <option value="">Semua perusahaan</option>
                  {context.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  <Search className="size-4" strokeWidth={1.75} aria-hidden />
                  Cari
                </Button>
                {query || selectedPerusahaan ? (
                  <Link
                    href="/instruktur/siswa"
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
                title="Belum ada siswa perusahaan"
                description="Siswa akan muncul di sini setelah admin menetapkan penempatan pada perusahaan Anda."
              />
            </section>
          ) : !filtered.length ? (
            <section className={card}>
              <EmptyState
                icon={Search}
                title="Siswa tidak ditemukan"
                description="Coba kata kunci lain atau pilih perusahaan yang berbeda."
              />
            </section>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filtered.map((student) => (
                  <article key={student.id} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-medium text-ink">
                          {student.nama}
                        </p>
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
                        {student.jurnal.terverifikasi}/{student.jurnal.total}{" "}
                        jurnal · {student.mutabaah.terisi}/7 mutaba&apos;ah
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="border-b border-border bg-surface-muted/60 text-left text-[13px] text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Siswa</th>
                        <th className="px-4 py-3 font-medium">Penempatan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Jurnal</th>
                        <th className="px-4 py-3 font-medium">Mutaba&apos;ah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((student) => (
                        <tr
                          key={student.id}
                          className="transition-colors hover:bg-surface-muted/40"
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
                            <PengajuanBadge status={student.pengajuanStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-ink-soft tabular-nums">
                              {student.jurnal.terverifikasi}/
                              {student.jurnal.total} final
                            </p>
                            <p className="text-[13px] leading-[18px] text-muted">
                              {student.jurnal.menunggu} menunggu
                            </p>
                          </td>
                          <td className="px-4 py-3 text-ink-soft tabular-nums">
                            {student.mutabaah.terisi}/
                            {student.mutabaah.totalHari}
                          </td>
                        </tr>
                      ))}
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
