import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  BookOpen,
  CircleDashed,
  ImageOff,
  Search,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import {
  DokumenBadge,
  JurnalBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  getJurnalDetail,
  getJurnalList,
  normalizeDateFilter,
  type JurnalVerification,
} from "@/lib/data/admin-jurnal";
import { statusJurnal, type StatusJurnal } from "@/lib/status";
import { postgresUuidPattern } from "@/lib/validators/common";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jurnal Harian",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function timeRange(start: string | null, end: string | null) {
  const mulai = start?.slice(0, 5);
  const selesai = end?.slice(0, 5);

  if (mulai && selesai) {
    return `${mulai}–${selesai}`;
  }

  return mulai ?? selesai ?? null;
}

function VerificationRow({
  label,
  verification,
}: {
  label: string;
  verification?: JurnalVerification;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface-muted px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {verification ? (
          <DokumenBadge status={verification.status} />
        ) : (
          <StatusBadge
            label="Belum"
            tone="neutral"
            icon={CircleDashed}
          />
        )}
      </div>

      {verification ? (
        <>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">
            {verification.verifikator ?? label} ·{" "}
            {formatDateTime(verification.updatedAt)}
          </p>
          {verification.catatan ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-[22px] text-ink-soft">
              {verification.catatan}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-[13px] leading-[18px] text-muted">
          Belum ada verifikasi.
        </p>
      )}
    </div>
  );
}

type SearchParams = Promise<{
  q?: string;
  status?: string;
  kelas?: string;
  guru?: string;
  dari?: string;
  sampai?: string;
  page?: string;
  jurnal?: string;
}>;

export default async function AdminJurnalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(statusJurnal, params.status)
      ? (params.status as StatusJurnal)
      : "";
  const kelas =
    typeof params.kelas === "string" ? params.kelas.slice(0, 30) : "";
  const guru =
    typeof params.guru === "string" && postgresUuidPattern.test(params.guru)
      ? params.guru
      : "";
  const dari =
    typeof params.dari === "string" ? normalizeDateFilter(params.dari) : "";
  const sampai =
    typeof params.sampai === "string"
      ? normalizeDateFilter(params.sampai)
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const selectedId =
    typeof params.jurnal === "string" &&
    postgresUuidPattern.test(params.jurnal)
      ? params.jurnal
      : undefined;

  const [data, selected] = await Promise.all([
    getJurnalList({ q, status, kelas, guru, dari, sampai, page }),
    selectedId ? getJurnalDetail(selectedId) : Promise.resolve(null),
  ]);

  const hasFilter = Boolean(q || status || kelas || guru || dari || sampai);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);
  const guruVerification = selected?.verifikasi.find(
    (verification) => verification.peran === "guru",
  );
  const instrukturVerification = selected?.verifikasi.find(
    (verification) => verification.peran === "instruktur",
  );

  function jurnalHref(overrides: { jurnal?: string; page?: number } = {}) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (kelas) next.set("kelas", kelas);
    if (guru) next.set("guru", guru);
    if (dari) next.set("dari", dari);
    if (sampai) next.set("sampai", sampai);

    const targetPage = overrides.page ?? page;
    if (targetPage > 1) next.set("page", String(targetPage));
    if (overrides.jurnal) next.set("jurnal", overrides.jurnal);

    const query = next.toString();
    return query ? `/admin/jurnal?${query}` : "/admin/jurnal";
  }

  function pageHref(target: number) {
    return jurnalHref({ page: target });
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Admin Sekolah
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Jurnal Harian
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Pantau jurnal seluruh siswa, foto kegiatan, dan status verifikasi.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.total}
          </span>{" "}
          jurnal
        </p>
      </header>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
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

        <Field label="Status jurnal" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            {data.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Guru pembimbing" htmlFor="guru">
          <Select id="guru" name="guru" defaultValue={guru}>
            <option value="">Semua guru</option>
            {data.guruOptions.map((option) => (
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

        <Field label="Dari tanggal" htmlFor="dari">
          <Input id="dari" name="dari" type="date" defaultValue={dari} />
        </Field>

        <Field label="Sampai tanggal" htmlFor="sampai">
          <Input
            id="sampai"
            name="sampai"
            type="date"
            defaultValue={sampai}
          />
        </Field>

        <div className="flex items-center gap-2">
          {/* Muat ulang penuh agar input filter uncontrolled kembali kosong. */}
          <a
            href="/admin/jurnal"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </a>
        </div>
      </FilterForm>

      {dari && sampai && dari > sampai ? (
        <p className="mt-4 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
          Tanggal awal melewati tanggal akhir. Tukar rentang tanggal untuk
          melihat jurnal.
        </p>
      ) : null}

      {!data.rows.length && !selected ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={hasFilter ? Search : BookOpen}
            title={hasFilter ? "Jurnal tidak ditemukan" : "Belum ada jurnal"}
            description={
              hasFilter
                ? "Coba kata kunci lain atau ubah filter."
                : "Jurnal siswa akan muncul di sini setelah diisi."
            }
            action={
              hasFilter ? (
                <a
                  href="/admin/jurnal"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </a>
              ) : undefined
            }
          />
        </section>
      ) : (
        <>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
            <aside className="overflow-hidden rounded-md border border-border bg-surface shadow-xs lg:order-1">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold text-ink">
                  Daftar jurnal
                </h2>
                <span className="text-[13px] text-muted tabular-nums">
                  {data.rows.length} dari {data.total}
                </span>
              </div>

              {data.rows.length ? (
                <ul className="divide-y divide-border">
                  {data.rows.map((journal) => {
                    const active = journal.id === selected?.id;

                    return (
                      <li key={journal.id}>
                        <Link
                          href={`${jurnalHref({ jurnal: journal.id })}#jurnal-detail`}
                          prefetch={false}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "block px-4 py-3 transition-colors hover:bg-surface-muted/60",
                            active && "bg-brand-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {journal.siswa.nama}
                              </p>
                              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                                {journal.siswa.nis} ·{" "}
                                {journal.siswa.kelas ?? "—"}
                              </p>
                            </div>
                            <JurnalBadge status={journal.status} />
                          </div>

                          <p className="mt-2 text-[12px] leading-4 text-muted">
                            {formatDate(journal.tanggal)}
                          </p>
                          <p className="mt-1 truncate text-[13px] leading-[18px] text-ink-soft">
                            {journal.kegiatan}
                          </p>
                          <p className="mt-1 truncate text-[12px] leading-4 text-muted">
                            {journal.perusahaan ?? "Perusahaan belum diisi"}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4">
                  <EmptyState
                    icon={Search}
                    title="Tidak ada jurnal"
                    description="Ubah filter atau reset pencarian."
                    action={
                      hasFilter ? (
                        <a
                          href="/admin/jurnal"
                          className={buttonVariants({ variant: "secondary" })}
                        >
                          Reset filter
                        </a>
                      ) : undefined
                    }
                  />
                </div>
              )}
            </aside>

            {selected ? (
              <section
                id="jurnal-detail"
                className={cn(card, "order-first lg:order-2")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[13px] font-medium leading-[18px] text-muted">
                      {selected.perusahaan ?? "Perusahaan belum diisi"}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink">
                      {selected.siswa.nama}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {selected.siswa.nis} · {selected.siswa.kelas ?? "—"} ·{" "}
                      {selected.siswa.jurusan ?? "—"}
                    </p>
                  </div>
                  <JurnalBadge status={selected.status} />
                </div>

                <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Tanggal
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {formatDate(selected.tanggal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Waktu
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {timeRange(selected.waktuMulai, selected.waktuSelesai) ??
                        "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Guru pembimbing
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {selected.guru ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Periode
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {selected.periode ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-base font-semibold text-ink">Kegiatan</h3>
                  <p className="mt-1 text-base font-medium leading-[26px] text-ink">
                    {selected.kegiatan}
                  </p>
                  {selected.deskripsi ? (
                    <p className="mt-2 whitespace-pre-line text-base leading-[26px] text-ink-soft">
                      {selected.deskripsi}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-base font-semibold text-ink">
                    Foto kegiatan
                  </h3>
                  {selected.fotoUrl ? (
                    <a
                      href={selected.fotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.fotoUrl}
                        alt={`Foto jurnal ${selected.siswa.nama} tanggal ${formatDate(selected.tanggal)}`}
                        className="max-h-[420px] w-full rounded-sm border border-border bg-surface-muted object-contain"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="mt-3 flex items-start gap-2 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
                      <ImageOff
                        className="mt-0.5 size-4 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      Foto jurnal tidak tersedia.
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-base font-semibold text-ink">
                    Verifikasi
                  </h3>
                  <div className="mt-3 space-y-3">
                    <VerificationRow
                      label="Guru pembimbing"
                      verification={guruVerification}
                    />
                    <VerificationRow
                      label="Instruktur perusahaan"
                      verification={instrukturVerification}
                    />
                  </div>
                  <p className="mt-3 text-[13px] leading-[18px] text-muted">
                    Admin hanya memantau. Verifikasi dilakukan berurutan oleh
                    guru pembimbing lalu instruktur perusahaan.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <Link
                    href={`/admin/siswa/${selected.siswa.id}`}
                    className="inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                  >
                    Lihat data siswa
                    <ArrowRight
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                  <Link
                    href={jurnalHref()}
                    className="inline-flex h-11 items-center text-[13px] font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                  >
                    Tutup detail
                  </Link>
                </div>
              </section>
            ) : selectedId ? (
              <section className={cn(card, "order-first lg:order-2")}>
                <EmptyState
                  icon={BookOpen}
                  title="Jurnal tidak ditemukan"
                  description="Jurnal mungkin sudah dihapus atau tautannya tidak valid."
                  action={
                    <Link
                      href={jurnalHref()}
                      className={buttonVariants({ variant: "secondary" })}
                    >
                      Tutup detail
                    </Link>
                  }
                />
              </section>
            ) : (
              <section className={cn(card, "hidden lg:order-2 lg:block")}>
                <EmptyState
                  icon={BookOpen}
                  title="Pilih jurnal"
                  description="Klik salah satu jurnal di daftar untuk melihat foto dan status verifikasi."
                />
              </section>
            )}
          </div>

          {data.total ? (
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
          ) : null}
        </>
      )}
    </div>
  );
}
