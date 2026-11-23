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
  Printer,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { IssueSuratButton } from "@/components/pkl/IssueSuratButton";
import { SuratTabs } from "@/components/pkl/SuratTabs";
import { UploadSuratBaruButton } from "@/components/pkl/UploadSuratBaruButton";
import { UploadSuratButton } from "@/components/pkl/UploadSuratButton";
import {
  PengajuanBadge,
  SuratBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  currentSuratYear,
  getSuratIssueOptions,
  getSuratList,
  getSuratUploadOptions,
} from "@/lib/data/admin-surat";
import {
  jenisSuratLabel,
  jenisSuratList,
  type JenisSurat,
} from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Surat",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  jenis?: string;
  status?: string;
  page?: string;
}>;

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMM yyyy", { locale: localeId })
    : "—";
}

export default async function AdminSuratPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const jenis = jenisSuratList.includes(params.jenis as JenisSurat)
    ? (params.jenis as JenisSurat)
    : "";
  const status =
    params.status === "terbit" ||
    params.status === "draft" ||
    params.status === "dibatalkan"
      ? params.status
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [data, issueOptions, uploadOptions] = await Promise.all([
    getSuratList({ q, jenis, status, page }),
    jenis ? getSuratIssueOptions(jenis) : Promise.resolve([]),
    getSuratUploadOptions(),
  ]);

  const hasFilter = Boolean(q || jenis || status);
  const tahun = currentSuratYear();
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (jenis) next.set("jenis", jenis);
    if (status) next.set("status", status);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/surat?${query}` : "/admin/surat";
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
            Terbitkan surat resmi PKL, unggah berkas surat, dan pantau dokumen
            yang dikirim siswa. Nomor surat dibuat otomatis dari pengaturan
            sekolah.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted lg:text-right">
            <span className="font-display text-2xl font-semibold text-ink tabular-nums">
              {data.total}
            </span>{" "}
            surat
          </p>
          <UploadSuratBaruButton
            options={uploadOptions}
            tahun={tahun}
          />
        </div>
      </header>

      <SuratTabs active="sekolah" />

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_220px_170px_auto] sm:items-end">
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nomor surat, siswa, atau perusahaan"
          />
        </Field>

        <Field label="Jenis surat" htmlFor="jenis">
          <Select id="jenis" name="jenis" defaultValue={jenis}>
            <option value="">Semua jenis</option>
            {jenisSuratList.map((value) => (
              <option key={value} value={value}>
                {jenisSuratLabel[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status surat" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            <option value="terbit">Terbit</option>
            <option value="draft">Draft</option>
            <option value="dibatalkan">Dibatalkan</option>
          </Select>
        </Field>

        <Link
          href="/admin/surat"
          className={cn(
            buttonVariants({ variant: "ghost", size: "md" }),
            "w-full sm:w-auto",
          )}
        >
          Reset
        </Link>
      </FilterForm>

      {jenis ? (
        <section
          className="mt-4 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
          aria-labelledby="terbitkan-surat-title"
        >
          <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Terbitkan surat
              </p>
              <h2
                id="terbitkan-surat-title"
                className="mt-1 font-display text-xl font-semibold text-ink"
              >
                {jenisSuratLabel[jenis]}
              </h2>
            </div>
            <p className="text-sm text-muted">
              {issueOptions.length} pengajuan siap diproses
            </p>
          </div>

          {issueOptions.length ? (
            <ul className="divide-y divide-border">
              {issueOptions.map((option) => (
                <li
                  key={option.pengajuanId}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {option.perusahaan?.nama ?? "Perusahaan belum diisi"}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                      {[option.periode?.nama, option.perusahaan?.kota]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">
                      {option.students
                        .map((student) => student.nama)
                        .join(", ") || "Belum ada siswa"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <PengajuanBadge status={option.status} />
                    {option.existingSurat ? (
                      <>
                        <Link
                          href={`/api/surat/${option.existingSurat.id}/pdf`}
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
                        <Link
                          href={`/api/surat/${option.existingSurat.id}/pdf?download=1`}
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
                        </Link>
                      </>
                    ) : (
                      <IssueSuratButton
                        pengajuanId={option.pengajuanId}
                        jenis={jenis}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pt-4">
              <EmptyState
                icon={FileText}
                title="Belum ada pengajuan yang siap"
                description="Pengajuan akan muncul setelah statusnya memenuhi syarat untuk jenis surat ini."
              />
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="daftar-surat-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2
              id="daftar-surat-title"
              className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
            >
              Daftar surat
            </h2>
            <p className="mt-1 text-sm text-muted">
              {hasFilter
                ? "Hasil sesuai pencarian dan filter."
                : "Semua surat yang sudah diterbitkan."}
            </p>
          </div>
        </div>

        {data.rows.length ? (
          <>
            <div className="hidden overflow-x-auto rounded-md border border-border bg-surface shadow-xs md:block">
              <table className="w-full min-w-[1120px] border-collapse text-sm">
                <caption className="sr-only">Daftar surat PKL</caption>
                <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Surat
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Nomor
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Siswa / Perusahaan
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Tanggal
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
                          {jenisSuratLabel[row.jenis]}
                        </p>
                        <p className="text-[13px] leading-[18px] text-muted">
                          {row.periode?.nama ?? "—"}
                        </p>
                        <p className="text-[12px] leading-4 text-muted">
                          {row.hasFile ? "File sekolah" : "PDF sistem"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {row.nomor ?? "Nomor belum tersedia"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-soft">
                          {row.students.map((student) => student.nama).join(", ") ||
                            "Belum ada siswa"}
                        </p>
                        <p className="text-[13px] leading-[18px] text-muted">
                          {row.perusahaan?.nama ?? "Perusahaan belum diisi"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {formatDate(row.tanggalTerbit)}
                      </td>
                      <td className="px-4 py-3">
                        <SuratBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <UploadSuratButton
                            suratId={row.id}
                            jenis={row.jenis}
                            jenisLabel={jenisSuratLabel[row.jenis]}
                            nomor={row.nomor}
                            hasFile={row.hasFile}
                            tahun={tahun}
                          />
                          <Link
                            href={
                              row.hasFile
                                ? `/api/surat/${row.id}/pdf`
                                : `/admin/surat/print/${row.id}`
                            }
                            target={row.hasFile ? "_blank" : undefined}
                            rel={row.hasFile ? "noreferrer" : undefined}
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            <Printer
                              className="size-4"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            Cetak
                          </Link>
                          <Link
                            href={`/api/surat/${row.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({
                              variant: "ghost",
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
                          <Link
                            href={`/api/surat/${row.id}/pdf?download=1`}
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
                      <div>
                        <p className="font-display text-lg font-semibold text-ink">
                          {jenisSuratLabel[row.jenis]}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-[18px] text-muted tabular-nums">
                          {row.nomor ?? "Nomor belum tersedia"}
                        </p>
                      </div>
                      <SuratBadge status={row.status} />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      {row.students.map((student) => student.nama).join(", ") ||
                        "Belum ada siswa"}
                    </p>
                    <p className="text-[13px] leading-[18px] text-muted">
                      {[row.perusahaan?.nama, row.periode?.nama]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[18px] text-muted">
                      {formatDate(row.tanggalTerbit)}
                    </p>
                    <p className="text-[12px] leading-4 text-muted">
                      {row.hasFile ? "File sekolah" : "PDF sistem"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <UploadSuratButton
                        suratId={row.id}
                        jenis={row.jenis}
                        jenisLabel={jenisSuratLabel[row.jenis]}
                        nomor={row.nomor}
                        hasFile={row.hasFile}
                        tahun={tahun}
                      />
                      <Link
                        href={
                          row.hasFile
                            ? `/api/surat/${row.id}/pdf`
                            : `/admin/surat/print/${row.id}`
                        }
                        target={row.hasFile ? "_blank" : undefined}
                        rel={row.hasFile ? "noreferrer" : undefined}
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                          "flex-1",
                        )}
                      >
                        <Printer
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        Cetak
                      </Link>
                      <Link
                        href={`/api/surat/${row.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
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
                      <Link
                        href={`/api/surat/${row.id}/pdf?download=1`}
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
          <div className="rounded-md border border-border bg-surface p-5 shadow-xs sm:p-6">
            <EmptyState
              icon={FileText}
              title={
                hasFilter
                  ? "Tidak ada surat yang cocok"
                  : "Belum ada surat terbit"
              }
              description={
                hasFilter
                  ? "Ubah kata kunci atau filter, lalu coba lagi."
                  : "Pilih jenis surat untuk menerbitkan surat pertama."
              }
              action={
                hasFilter ? (
                  <Link
                    href="/admin/surat"
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    Reset filter
                  </Link>
                ) : undefined
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
