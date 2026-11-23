import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Search,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { DokumenBadge } from "@/components/pkl/StatusBadge";
import { SuratTabs } from "@/components/pkl/SuratTabs";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  getSuratMasukList,
  jenisDokumenLabel,
  jenisDokumenList,
} from "@/lib/data/admin-surat-masuk";
import { statusVerifikasi } from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Surat dari Siswa",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  jenis?: string;
  status?: string;
  page?: string;
}>;

function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy · HH.mm", {
    locale: localeId,
  });
}

function formatSize(value: number | null) {
  if (!value) return "—";

  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export default async function AdminSuratSiswaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const jenis =
    typeof params.jenis === "string" &&
    jenisDokumenList.includes(
      params.jenis as (typeof jenisDokumenList)[number],
    )
      ? params.jenis
      : "";
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(statusVerifikasi, params.status)
      ? params.status
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const data = await getSuratMasukList({ q, jenis, status, page });
  const hasFilter = Boolean(q || jenis || status);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (jenis) next.set("jenis", jenis);
    if (status) next.set("status", status);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/surat/siswa?${query}` : "/admin/surat/siswa";
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Administrasi
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Surat
          </h1>
          <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
            Dokumen yang diunggah siswa untuk pengajuan PKL. Buka pengajuan
            untuk meninjau atau memberi catatan.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.total}
          </span>{" "}
          dokumen
        </p>
      </header>

      <SuratTabs active="siswa" />

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_240px_180px_auto] sm:items-end">
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={q}
            placeholder="Nama siswa, NIS, perusahaan, atau berkas"
          />
        </Field>

        <Field label="Jenis dokumen" htmlFor="jenis">
          <Select id="jenis" name="jenis" defaultValue={jenis}>
            <option value="">Semua jenis</option>
            {jenisDokumenList.map((value) => (
              <option key={value} value={value}>
                {jenisDokumenLabel[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            {Object.entries(statusVerifikasi).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/surat/siswa"
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
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <caption className="sr-only">
                Daftar dokumen yang diunggah siswa
              </caption>
              <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Siswa
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Jenis
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Berkas
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Diunggah
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
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">
                        {row.students.map((student) => student.nama).join(", ") ||
                          "Siswa tidak ditemukan"}
                      </p>
                      <p className="text-[13px] leading-[18px] text-muted">
                        {row.students
                          .map((student) => `NIS ${student.nis}`)
                          .join(" · ") || "—"}
                      </p>
                      <p className="text-[12px] leading-4 text-muted">
                        {[row.perusahaan, row.periode]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {jenisDokumenLabel[row.jenis]}
                    </td>
                    <td className="max-w-[230px] px-4 py-3">
                      <p className="truncate text-ink-soft">
                        {row.fileName ?? "Nama berkas tidak tersedia"}
                      </p>
                      <p className="text-[12px] leading-4 text-muted tabular-nums">
                        {formatSize(row.ukuran)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {formatDateTime(row.diunggahPada)}
                    </td>
                    <td className="px-4 py-3">
                      <DokumenBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {row.fileUrl ? (
                          <>
                            <Link
                              href={row.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({
                                variant: "secondary",
                                size: "sm",
                              })}
                            >
                              <Eye
                                className="size-4"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              Lihat
                            </Link>
                            <a
                              href={row.fileUrl}
                              download={row.fileName ?? undefined}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              <Download
                                className="size-4"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              Unduh
                            </a>
                          </>
                        ) : (
                          <span className="text-[13px] text-muted">
                            Berkas tidak tersedia
                          </span>
                        )}
                        <Link
                          href={`/admin/pengajuan?pengajuan=${row.pengajuanId}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Tinjau
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {data.rows.map((row) => (
              <li key={row.id}>
                <article className="rounded-md border border-border bg-surface p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink">
                        {row.students.map((student) => student.nama).join(", ") ||
                          "Siswa tidak ditemukan"}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                        {jenisDokumenLabel[row.jenis]}
                      </p>
                    </div>
                    <DokumenBadge status={row.status} />
                  </div>

                  <dl className="mt-3 space-y-1.5 text-[13px] leading-[18px]">
                    <div>
                      <dt className="inline text-muted">Berkas: </dt>
                      <dd className="inline break-all text-ink-soft">
                        {row.fileName ?? "Nama berkas tidak tersedia"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-muted">Ukuran: </dt>
                      <dd className="inline tabular-nums text-ink-soft">
                        {formatSize(row.ukuran)}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-muted">Diunggah: </dt>
                      <dd className="inline tabular-nums text-ink-soft">
                        {formatDateTime(row.diunggahPada)}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-muted">Penempatan: </dt>
                      <dd className="inline text-ink-soft">
                        {[row.perusahaan, row.periode]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </dd>
                    </div>
                  </dl>

                  {row.catatan ? (
                    <p className="mt-3 whitespace-pre-line break-words rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-sm leading-[22px] text-ink-soft">
                      {row.catatan}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {row.fileUrl ? (
                      <>
                        <Link
                          href={row.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            }),
                            "flex-1",
                          )}
                        >
                          <Eye
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          Lihat
                        </Link>
                        <a
                          href={row.fileUrl}
                          download={row.fileName ?? undefined}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "flex-1",
                          )}
                        >
                          <Download
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          Unduh
                        </a>
                      </>
                    ) : (
                      <span className="text-[13px] text-muted">
                        Berkas tidak tersedia
                      </span>
                    )}
                    <Link
                      href={`/admin/pengajuan?pengajuan=${row.pengajuanId}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "flex-1",
                      )}
                    >
                      Tinjau
                    </Link>
                  </div>
                </article>
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
              dari{" "}
              <span className="tabular-nums text-ink-soft">
                {data.total}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {data.page > 1 ? (
                <Link
                  href={pageHref(data.page - 1)}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
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
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
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
            icon={hasFilter ? Search : FileText}
            title={
              hasFilter
                ? "Tidak ada dokumen yang cocok"
                : "Belum ada surat dari siswa"
            }
            description={
              hasFilter
                ? "Ubah kata kunci atau filter, lalu coba lagi."
                : "Dokumen yang diunggah siswa akan muncul di sini setelah dikirim."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/surat/siswa"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
