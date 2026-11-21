import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { AktifBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import { getPeriodeList } from "@/lib/data/admin-periode";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Periode PKL",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

function formatDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

export default async function AdminPeriodePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    params.status === "aktif" || params.status === "nonaktif"
      ? params.status
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const data = await getPeriodeList({ q, status, page });
  const hasFilter = Boolean(q || status);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/periode?${query}` : "/admin/periode";
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data master
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Periode PKL
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Kelola periode PKL, tahun ajaran, dan rentang tanggalnya.
          </p>
        </div>

        <Link
          href="/admin/periode/baru"
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "primary", size: "md" }),
            "w-full sm:w-auto",
          )}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          Tambah periode
        </Link>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-end"
      >
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama atau tahun ajaran"
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
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
            Terapkan
          </button>
          <Link
            href="/admin/periode"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </form>

      {data.rows.length ? (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-md border border-border bg-surface shadow-xs md:block">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <caption className="sr-only">Daftar periode PKL</caption>
              <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nama
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tahun ajaran
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tanggal
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Siswa
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border transition-colors duration-[var(--m-fast)] hover:bg-brand-50"
                  >
                    <td className="max-w-[260px] px-4 py-3">
                      <Link
                        href={`/admin/periode/${row.id}`}
                        className="block truncate font-medium text-ink hover:text-brand-700"
                      >
                        {row.nama}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {row.tahun_ajaran}
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {formatDate(row.tanggal_mulai)} –{" "}
                      {formatDate(row.tanggal_selesai)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/siswa?periode=${row.id}`}
                        className="inline-flex h-11 items-center whitespace-nowrap text-sm font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                      >
                        {row.siswa} siswa
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <AktifBadge aktif={row.aktif} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/periode/${row.id}`}
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
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {data.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/periode/${row.id}`}
                  className="group block rounded-md border border-border bg-surface p-4 shadow-xs transition-colors duration-[var(--m-fast)] hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">
                        {row.nama}
                      </p>
                      <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
                        {row.tahun_ajaran}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted transition-transform duration-[var(--m-fast)] group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>

                  <p className="mt-2 text-[13px] leading-[18px] text-ink-soft tabular-nums">
                    {formatDate(row.tanggal_mulai)} –{" "}
                    {formatDate(row.tanggal_selesai)}
                  </p>

                  <p className="mt-1 text-[13px] leading-[18px] text-muted">
                    <span className="tabular-nums">{row.siswa}</span> siswa
                    ditempatkan
                  </p>

                  <div className="mt-3">
                    <AktifBadge aktif={row.aktif} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Navigasi halaman"
            className="mt-4 flex flex-col gap-3 text-[13px] leading-[18px] text-muted sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              Menampilkan{" "}
              <span className="tabular-nums text-ink-soft">
                {from}–{to}
              </span>{" "}
              dari <span className="tabular-nums text-ink-soft">{data.total}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {data.page > 1 ? (
                <Link
                  href={pageHref(data.page - 1)}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <ChevronLeft
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  Sebelumnya
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "pointer-events-none opacity-50",
                  )}
                >
                  <ChevronLeft
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  Sebelumnya
                </span>
              )}

              <span className="px-1 tabular-nums text-ink-soft">
                Halaman {data.page} dari {data.pageCount}
              </span>

              {data.page < data.pageCount ? (
                <Link
                  href={pageHref(data.page + 1)}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Berikutnya
                  <ChevronRight
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "pointer-events-none opacity-50",
                  )}
                >
                  Berikutnya
                  <ChevronRight
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              )}
            </div>
          </nav>
        </>
      ) : (
        <div className="mt-4 rounded-md border border-border bg-surface p-5 shadow-xs sm:p-6">
          <EmptyState
            icon={CalendarDays}
            title={hasFilter ? "Tidak ada periode yang cocok" : "Belum ada periode"}
            description={
              hasFilter
                ? "Ubah kata kunci atau filter, lalu coba lagi."
                : "Tambahkan periode PKL pertama untuk mulai mengatur jadwal."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/periode"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : (
                <Link
                  href="/admin/periode/baru"
                  prefetch={false}
                  className={buttonVariants({ variant: "primary" })}
                >
                  Tambah periode
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
