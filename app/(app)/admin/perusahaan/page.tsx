import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
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
import { FilterForm } from "@/components/pkl/FilterForm";
import { requireRole } from "@/lib/auth";
import { getPerusahaanList } from "@/lib/data/admin-perusahaan";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Data perusahaan",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminPerusahaanPage({
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

  const data = await getPerusahaanList({ q, status, page });
  const hasFilter = Boolean(q || status);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/perusahaan?${query}` : "/admin/perusahaan";
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data master
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Data perusahaan
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Kelola tempat PKL, kontak, dan instruktur mitra.
          </p>
        </div>

        <Link
          href="/admin/perusahaan/baru"
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "primary", size: "md" }),
            "w-full sm:w-auto",
          )}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          Tambah perusahaan
        </Link>
      </header>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-end"
      >
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama, kota, atau email"
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
          <Link
            href="/admin/perusahaan"
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
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Daftar perusahaan mitra PKL</caption>
              <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nama
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Kontak
                  </th>
                  <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                    Instruktur
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
                        href={`/admin/perusahaan/${row.id}`}
                        className="block truncate font-medium text-ink hover:text-brand-700"
                      >
                        {row.nama}
                      </Link>
                      <span className="block truncate text-[12px] leading-4 text-muted">
                        {row.kota ?? "Kota belum diisi"}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-ink-soft">
                      <span className="block tabular-nums">
                        {row.telepon ?? "—"}
                      </span>
                      {row.email ? (
                        <span className="block truncate text-[12px] leading-4 text-muted">
                          {row.email}
                        </span>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-ink-soft xl:table-cell">
                      {row.instrukturCount > 0
                        ? `${row.instrukturCount} orang`
                        : "Belum ada"}
                    </td>
                    <td className="px-4 py-3">
                      <AktifBadge aktif={row.aktif} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/perusahaan/${row.id}`}
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
                  href={`/admin/perusahaan/${row.id}`}
                  className="group block rounded-md border border-border bg-surface p-4 shadow-xs transition-colors duration-[var(--m-fast)] hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">
                        {row.nama}
                      </p>
                      <p className="mt-1 text-[13px] leading-[18px] text-muted">
                        {row.kota ?? "Kota belum diisi"}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted transition-transform duration-[var(--m-fast)] group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>

                  {row.telepon || row.email ? (
                    <p className="mt-2 break-words text-[13px] leading-[18px] text-ink-soft">
                      {[row.telepon, row.email].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <AktifBadge aktif={row.aktif} />
                    <span className="text-[12px] leading-4 text-muted">
                      {row.instrukturCount > 0
                        ? `${row.instrukturCount} instruktur terhubung`
                        : "Belum ada instruktur"}
                    </span>
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
            icon={Building2}
            title={
              hasFilter
                ? "Tidak ada perusahaan yang cocok"
                : "Belum ada perusahaan"
            }
            description={
              hasFilter
                ? "Ubah kata kunci atau filter, lalu coba lagi."
                : "Tambahkan perusahaan pertama untuk mulai mengelola tempat PKL."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/perusahaan"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : (
                <Link
                  href="/admin/perusahaan/baru"
                  prefetch={false}
                  className={buttonVariants({ variant: "primary" })}
                >
                  Tambah perusahaan
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
