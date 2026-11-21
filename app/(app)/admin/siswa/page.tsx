import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Plus,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { NaikKelasButton } from "@/components/pkl/NaikKelasButton";
import {
  AkunBadge,
  PengajuanBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import { getSiswaList } from "@/lib/data/admin-siswa";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Data siswa",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  kelas?: string;
  status?: string;
  periode?: string;
  page?: string;
}>;

export default async function AdminSiswaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const kelas = typeof params.kelas === "string" ? params.kelas : "";
  const status =
    params.status === "aktif" || params.status === "nonaktif"
      ? params.status
      : "";
  const periode =
    typeof params.periode === "string" ? params.periode.trim() : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const data = await getSiswaList({ q, kelas, status, periode, page });
  const hasFilter = Boolean(q || kelas || status || periode);
  const from =
    data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function filterHref(nextPeriode: string) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (kelas) next.set("kelas", kelas);
    if (status) next.set("status", status);
    if (nextPeriode) next.set("periode", nextPeriode);

    const query = next.toString();
    return query ? `/admin/siswa?${query}` : "/admin/siswa";
  }

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (kelas) next.set("kelas", kelas);
    if (status) next.set("status", status);
    if (periode) next.set("periode", periode);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/siswa?${query}` : "/admin/siswa";
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data master
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Data siswa
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Kelola data siswa dan akun login PKL.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <NaikKelasButton counts={data.kelasCounts} />
          <Link
            href="/admin/siswa/baru"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "w-full sm:w-auto",
            )}
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Tambah siswa
          </Link>
        </div>
      </header>

      {data.periodeOptions.length ? (
        <nav aria-label="Filter periode PKL" className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-[13px] font-medium leading-[18px] text-muted">
              <CalendarDays
                className="size-4"
                strokeWidth={1.75}
                aria-hidden
              />
              Periode PKL
            </span>

            <Link
              href={filterHref("")}
              aria-current={!periode ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-3 text-[13px] font-medium transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100",
                !periode
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink",
              )}
            >
              Semua periode
            </Link>

            {data.periodeOptions.map((option) => {
              const active = periode === option.id;

              return (
                <Link
                  key={option.id}
                  href={filterHref(option.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100",
                    active
                      ? "border-brand-300 bg-brand-50 text-brand-800"
                      : "border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink",
                  )}
                >
                  <span className="min-w-0 truncate">{option.nama}</span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums text-[12px]",
                      active ? "text-brand-700" : "text-muted",
                    )}
                  >
                    {option.siswa}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <FilterForm
        className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_180px_160px_auto] lg:items-end"
      >
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama atau NIS"
          />
        </Field>

        <Field label="Kelas" htmlFor="kelas">
          <Select id="kelas" name="kelas" defaultValue={kelas}>
            <option value="">Semua kelas</option>
            {data.kelasOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Periode PKL" htmlFor="periode">
          <Select id="periode" name="periode" defaultValue={periode}>
            <option value="">Semua periode</option>
            {data.periodeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nama} ({option.siswa})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status akun" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/siswa"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </FilterForm>

      {data.rows.length ? (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-md border border-border bg-surface shadow-xs md:block">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <caption className="sr-only">Daftar siswa PKL</caption>
              <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nama
                  </th>
                  <th scope="col" className="px-4 py-3">
                    NIS
                  </th>
                  <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                    Kelas
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Akun
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status PKL
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Periode PKL
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
                    <td className="max-w-[220px] px-4 py-3">
                      <Link
                        href={`/admin/siswa/${row.id}`}
                        className="block truncate font-medium text-ink hover:text-brand-700"
                      >
                        {row.nama}
                      </Link>
                      <span className="block truncate text-[12px] leading-4 text-muted">
                        @{row.username}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {row.nis}
                    </td>
                    <td className="hidden px-4 py-3 text-ink-soft xl:table-cell">
                      {row.kelas ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AkunBadge aktif={row.aktif} />
                    </td>
                    <td className="px-4 py-3">
                      {row.pengajuanStatus ? (
                        <PengajuanBadge status={row.pengajuanStatus} />
                      ) : (
                        <StatusBadge
                          label="Belum ada pengajuan"
                          tone="neutral"
                          icon={CircleDashed}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.periode ? (
                        <Link
                          href={filterHref(row.periode.id)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                        >
                          <CalendarDays
                            className="size-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {row.periode.nama}
                        </Link>
                      ) : (
                        <span className="whitespace-nowrap text-[13px] text-muted">
                          Belum ditempatkan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/siswa/${row.id}`}
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
                  href={`/admin/siswa/${row.id}`}
                  className="group block rounded-md border border-border bg-surface p-4 shadow-xs transition-colors duration-[var(--m-fast)] hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">
                        {row.nama}
                      </p>
                      <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
                        NIS {row.nis}
                        {row.kelas ? ` · ${row.kelas}` : ""}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted transition-transform duration-[var(--m-fast)] group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AkunBadge aktif={row.aktif} />
                    {row.pengajuanStatus ? (
                      <PengajuanBadge status={row.pengajuanStatus} />
                    ) : (
                      <StatusBadge
                        label="Belum ada pengajuan"
                        tone="neutral"
                        icon={CircleDashed}
                      />
                    )}
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-[13px] leading-[18px] text-ink-soft">
                    <CalendarDays
                      className="size-3.5 shrink-0 text-muted"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {row.periode?.nama ?? "Belum ditempatkan"}
                  </p>

                  <p className="mt-2 text-[12px] leading-4 text-muted">
                    @{row.username}
                  </p>
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
            icon={Users}
            title={
              hasFilter ? "Tidak ada siswa yang cocok" : "Belum ada siswa"
            }
            description={
              hasFilter
                ? "Ubah kata kunci atau filter, lalu coba lagi."
                : "Tambahkan siswa pertama untuk mulai mengelola data dan akun PKL."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/siswa"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : (
                <Link
                  href="/admin/siswa/baru"
                  prefetch={false}
                  className={buttonVariants({ variant: "primary" })}
                >
                  Tambah siswa
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
