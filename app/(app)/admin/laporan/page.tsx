import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  BookOpen,
  Building2,
  Download,
  FileCheck,
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
import { getLaporanReport } from "@/lib/data/admin-laporan";
import { cn } from "@/lib/utils";
import { postgresUuidPattern } from "@/lib/validators/common";

export const metadata: Metadata = {
  title: "Laporan PKL",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

type SearchParams = Promise<{
  periode?: string;
  perusahaan?: string;
  kelas?: string;
  q?: string;
  page?: string;
}>;

export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const periode =
    typeof params.periode === "string" &&
    postgresUuidPattern.test(params.periode)
      ? params.periode
      : "";
  const perusahaan =
    typeof params.perusahaan === "string" &&
    postgresUuidPattern.test(params.perusahaan)
      ? params.perusahaan
      : "";
  const kelas =
    typeof params.kelas === "string" ? params.kelas.slice(0, 30) : "";
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const data = await getLaporanReport({
    periode,
    perusahaan,
    kelas,
    q,
    page,
  });

  const hasFilter = Boolean(periode || perusahaan || kelas || q);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function queryString(targetPage?: number) {
    const next = new URLSearchParams();
    if (periode) next.set("periode", periode);
    if (perusahaan) next.set("perusahaan", perusahaan);
    if (kelas) next.set("kelas", kelas);
    if (q) next.set("q", q);
    if (targetPage && targetPage > 1) next.set("page", String(targetPage));

    return next.toString();
  }

  function pageHref(targetPage: number) {
    const query = queryString(targetPage);
    return query ? `/admin/laporan?${query}` : "/admin/laporan";
  }

  const exportQuery = queryString();
  const exportHref = exportQuery
    ? `/api/admin/laporan/export?${exportQuery}`
    : "/api/admin/laporan/export";

  const summary = [
    {
      label: "Siswa PKL",
      value: data.summary.siswa,
      hint: "siswa dalam laporan",
      icon: Users,
    },
    {
      label: "Perusahaan",
      value: data.summary.perusahaan,
      hint: "mitra pada filter",
      icon: Building2,
    },
    {
      label: "Jurnal",
      value: data.summary.jurnal,
      hint: "entri tercatat",
      icon: BookOpen,
    },
    {
      label: "Surat terbit",
      value: data.summary.surat,
      hint: "dokumen resmi",
      icon: FileCheck,
    },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Admin Sekolah
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Laporan PKL
          </h1>
          <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
            Rekap siswa, perusahaan, kelas, jurnal, dan surat terbit. Unduh
            CSV untuk diolah lebih lanjut.
          </p>
        </div>

        {data.total > 0 ? (
          <a
            href={exportHref}
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "w-full sm:w-auto",
            )}
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Unduh CSV
          </a>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "pointer-events-none w-full opacity-50 sm:w-auto",
            )}
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Unduh CSV
          </span>
        )}
      </header>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-6 sm:items-end">
        <div className="sm:col-span-2">
          <Field label="Cari siswa" htmlFor="q">
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nama atau NIS"
            />
          </Field>
        </div>

        <Field label="Periode" htmlFor="periode">
          <Select id="periode" name="periode" defaultValue={periode}>
            <option value="">Semua periode</option>
            {data.periodeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nama}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Perusahaan" htmlFor="perusahaan">
          <Select
            id="perusahaan"
            name="perusahaan"
            defaultValue={perusahaan}
          >
            <option value="">Semua mitra</option>
            {data.perusahaanOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nama}
              </option>
            ))}
          </Select>
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

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
          <Link
            href="/admin/laporan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </FilterForm>

      <section
        className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4"
        aria-label="Ringkasan laporan"
      >
        {summary.map((item) => (
          <div key={item.label} className="bg-surface px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted">{item.label}</p>
              <item.icon
                className="size-4 shrink-0 text-muted"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
              {item.value}
            </p>
            <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <div className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Per perusahaan
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Sebaran siswa dan jurnal
              </p>
            </div>
            <span className="text-xs tabular-nums text-muted">
              {data.perusahaanBreakdown.length} mitra
            </span>
          </div>

          {data.perusahaanBreakdown.length ? (
            <ul className="mt-4 space-y-4">
              {data.perusahaanBreakdown.map((item) => {
                const percent =
                  data.summary.siswa > 0
                    ? Math.min(
                        100,
                        Math.round((item.siswa / data.summary.siswa) * 100),
                      )
                    : 0;

                return (
                  <li key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.label}
                        </p>
                        {item.sublabel ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {item.sublabel}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-[13px] tabular-nums text-ink-soft">
                        {item.siswa} siswa
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {item.jurnal} jurnal · {percent}% siswa
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Belum ada data perusahaan pada filter ini.
            </p>
          )}
        </div>

        <div className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Per kelas</h2>
              <p className="mt-0.5 text-xs text-muted">
                Sebaran siswa dan jurnal
              </p>
            </div>
            <span className="text-xs tabular-nums text-muted">
              {data.kelasBreakdown.length} kelas
            </span>
          </div>

          {data.kelasBreakdown.length ? (
            <ul className="mt-4 space-y-4">
              {data.kelasBreakdown.map((item) => {
                const percent =
                  data.summary.siswa > 0
                    ? Math.min(
                        100,
                        Math.round((item.siswa / data.summary.siswa) * 100),
                      )
                    : 0;

                return (
                  <li key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.label}
                      </p>
                      <p className="shrink-0 text-[13px] tabular-nums text-ink-soft">
                        {item.siswa} siswa
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {item.jurnal} jurnal · {percent}% siswa
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Belum ada data kelas pada filter ini.
            </p>
          )}
        </div>
      </section>

      {!data.total ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={hasFilter ? Search : BookOpen}
            title={
              hasFilter
                ? "Data laporan tidak ditemukan"
                : "Belum ada data PKL"
            }
            description={
              hasFilter
                ? "Coba ubah periode, perusahaan, kelas, atau kata kunci."
                : "Data akan muncul setelah pengajuan PKL disetujui dan siswa ditempatkan."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/laporan"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : (
                <Link
                  href="/admin/pengajuan"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Buka pengajuan
                </Link>
              )
            }
          />
        </section>
      ) : (
        <>
          <section className="mt-4 overflow-hidden rounded-md border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Rincian siswa
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {data.total} baris sesuai filter
                </p>
              </div>
              <span className="text-[13px] tabular-nums text-muted">
                {data.rows.length} tampil
              </span>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Siswa
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Kelas
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Perusahaan
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Periode
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Jurnal
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Terakhir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.map((row) => (
                    <tr
                      key={row.key}
                      className="transition-colors hover:bg-surface-muted/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/siswa/${row.siswaId}`}
                          prefetch={false}
                          className="font-medium text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                        >
                          {row.nama}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {row.nis}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-soft">{row.kelas ?? "—"}</p>
                        {row.jurusan ? (
                          <p className="mt-0.5 text-[12px] text-muted">
                            {row.jurusan}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-soft">
                          {row.perusahaan ?? "—"}
                        </p>
                        {row.kota ? (
                          <p className="mt-0.5 text-[12px] text-muted">
                            {row.kota}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-soft">
                        {row.periode ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <PengajuanBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                        {row.jurnal}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted">
                        {formatDate(row.jurnalTerakhir)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {data.rows.map((row) => (
                <li key={row.key} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/siswa/${row.siswaId}`}
                        prefetch={false}
                        className="font-medium text-ink"
                      >
                        {row.nama}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {row.nis} · {row.kelas ?? "—"}
                      </p>
                    </div>
                    <PengajuanBadge status={row.status} />
                  </div>

                  <p className="mt-2 text-[13px] text-ink-soft">
                    {row.perusahaan ?? "—"}
                    {row.kota ? ` · ${row.kota}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                    <span>{row.periode ?? "—"}</span>
                    <span>
                      {row.jurnal} jurnal · terakhir{" "}
                      {formatDate(row.jurnalTerakhir)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

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
              <span className="tabular-nums text-ink-soft">{data.total}</span>
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
                </span>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
