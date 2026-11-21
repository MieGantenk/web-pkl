import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PenempatanForm } from "@/components/pkl/PenempatanForm";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getPenempatanEditor,
  getPenempatanList,
  isPenempatanStatus,
  PENEMPATAN_STATUSES,
} from "@/lib/data/admin-penempatan";
import { FilterForm } from "@/components/pkl/FilterForm";
import { requireRole } from "@/lib/auth";
import { statusPengajuan } from "@/lib/status";
import { cn } from "@/lib/utils";
import { postgresUuidPattern } from "@/lib/validators/common";

export const metadata: Metadata = {
  title: "Penempatan PKL",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
  edit?: string;
}>;

function formatDate(value: string | null) {
  if (!value) {
    return "Belum diatur";
  }

  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

export default async function AdminPenempatanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    typeof params.status === "string" && isPenempatanStatus(params.status)
      ? params.status
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const edit =
    typeof params.edit === "string" && postgresUuidPattern.test(params.edit)
      ? params.edit
      : "";

  const [data, editor] = await Promise.all([
    getPenempatanList({ q, status, page }),
    edit ? getPenempatanEditor(edit) : Promise.resolve(null),
  ]);

  const hasFilter = Boolean(q || status);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (target > 1) next.set("page", String(target));

    const query = next.toString();
    return query ? `/admin/penempatan?${query}` : "/admin/penempatan";
  }

  function editHref(id: string) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (data.page > 1) next.set("page", String(data.page));
    next.set("edit", id);

    return `/admin/penempatan?${next.toString()}`;
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Admin Sekolah
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Penempatan PKL
          </h1>
          <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
            Kelola guru pembimbing, instruktur perusahaan, tanggal, dan mulai
            PKL untuk pengajuan yang sudah diterima.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.total}
          </span>{" "}
          penempatan
        </p>
      </header>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-end"
      >
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama siswa, NIS, atau perusahaan"
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            {PENEMPATAN_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusPengajuan[value].label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/penempatan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </FilterForm>

      {edit && !editor ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-sm leading-[22px] text-warning"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <p>
            Data penempatan tidak ditemukan atau sudah tidak aktif. Pilih
            penempatan lain dari daftar.
          </p>
        </div>
      ) : null}

      {editor ? (
        <section
          id="kelola-penempatan"
          className="mt-4 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
          aria-labelledby="kelola-penempatan-title"
        >
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Kelola penempatan
              </p>
              <h2
                id="kelola-penempatan-title"
                className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
              >
                {editor.application.perusahaan?.nama ?? "Perusahaan"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {editor.application.periode?.nama ?? "Periode belum diisi"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <PengajuanBadge status={editor.application.status} />
              <Link
                href={pageHref(data.page)}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Tutup
              </Link>
            </div>
          </div>

          <div className="mt-5">
            <PenempatanForm key={editor.application.id} editor={editor} />
          </div>
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="daftar-penempatan-title">
        <div className="mb-3">
          <h2
            id="daftar-penempatan-title"
            className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
          >
            Daftar penempatan
          </h2>
          <p className="mt-1 text-sm text-muted">
            {hasFilter
              ? "Hasil sesuai pencarian dan filter."
              : "Penempatan aktif beserta pembimbingnya."}
          </p>
        </div>

        {data.rows.length ? (
          <>
            <div className="hidden overflow-x-auto rounded-md border border-border bg-surface shadow-xs md:block">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <caption className="sr-only">
                  Daftar penempatan PKL aktif
                </caption>
                <thead className="bg-surface-muted text-left text-[13px] font-semibold text-ink-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Siswa
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Perusahaan
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Pembimbing
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
                        {row.students.length ? (
                          <ul className="space-y-1">
                            {row.students.map((student) => (
                              <li key={student.id}>
                                <p className="font-medium text-ink">
                                  {student.nama}
                                </p>
                                <p className="text-[13px] leading-[18px] text-muted">
                                  {student.nis} · {student.kelas ?? "—"} ·{" "}
                                  {student.jurusan?.nama ?? "—"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">Belum ada siswa</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {row.perusahaan?.nama ?? "Belum ada perusahaan"}
                        </p>
                        <p className="text-[13px] leading-[18px] text-muted">
                          {[row.perusahaan?.kota, row.periode?.nama]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[13px] leading-[20px] text-ink-soft">
                        <p>Guru: {row.guru ?? "—"}</p>
                        <p>Instruktur: {row.instruktur ?? "—"}</p>
                        {row.pembimbing ? (
                          <p>Lapangan: {row.pembimbing}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[13px] leading-[20px] text-ink-soft tabular-nums">
                        <p>{formatDate(row.tanggal_mulai)}</p>
                        <p className="text-muted">s.d. {formatDate(row.tanggal_selesai)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <PengajuanBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={editHref(row.id)}
                          className="inline-flex h-11 items-center justify-end gap-1.5 px-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                        >
                          Kelola
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
                  <article className="rounded-md border border-border bg-surface p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-ink">
                          {row.perusahaan?.nama ?? "Belum ada perusahaan"}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                          {[row.perusahaan?.kota, row.periode?.nama]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <PengajuanBadge status={row.status} />
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[13px] font-medium text-ink-soft">
                        Siswa
                      </p>
                      {row.students.length ? (
                        <ul className="mt-1 space-y-1">
                          {row.students.map((student) => (
                            <li
                              key={student.id}
                              className="text-[13px] leading-[18px] text-muted"
                            >
                              {student.nama} · {student.nis}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[13px] text-muted">
                          Belum ada siswa
                        </p>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[13px] leading-[18px]">
                      <div>
                        <dt className="text-muted">Guru</dt>
                        <dd className="text-ink-soft">{row.guru ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Instruktur</dt>
                        <dd className="text-ink-soft">
                          {row.instruktur ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Mulai</dt>
                        <dd className="text-ink-soft tabular-nums">
                          {formatDate(row.tanggal_mulai)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Selesai</dt>
                        <dd className="text-ink-soft tabular-nums">
                          {formatDate(row.tanggal_selesai)}
                        </dd>
                      </div>
                    </dl>

                    <Link
                      href={editHref(row.id)}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "mt-3 w-full",
                      )}
                    >
                      Kelola penempatan
                      <ArrowRight
                        className="size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </Link>
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
              icon={Building2}
              title={
                hasFilter
                  ? "Tidak ada penempatan yang cocok"
                  : "Belum ada penempatan aktif"
              }
              description={
                hasFilter
                  ? "Ubah kata kunci atau filter, lalu coba lagi."
                  : "Penempatan akan muncul setelah pengajuan siswa diterima dan disetujui admin."
              }
              action={
                hasFilter ? (
                  <Link
                    href="/admin/penempatan"
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    Reset filter
                  </Link>
                ) : (
                  <Link
                    href="/admin"
                    className={buttonVariants({ variant: "primary" })}
                  >
                    Buka ringkasan
                  </Link>
                )
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
