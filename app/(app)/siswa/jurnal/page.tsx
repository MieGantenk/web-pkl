import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  BookOpen,
  CircleAlert,
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
  getSiswaJurnalDetail,
  getSiswaJurnalList,
  normalizeMonthFilter,
  type SiswaJurnalVerification,
} from "@/lib/data/siswa-jurnal";
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

function formatDay(value: string) {
  return format(parseISO(value), "EEEE, d MMMM yyyy", { locale: localeId });
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
  verification?: SiswaJurnalVerification;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface-muted px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {verification ? (
          <DokumenBadge status={verification.status} />
        ) : (
          <StatusBadge label="Belum" tone="neutral" icon={CircleDashed} />
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
  bulan?: string;
  page?: string;
  jurnal?: string;
}>;

export default async function SiswaJurnalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireRole("siswa");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(statusJurnal, params.status)
      ? (params.status as StatusJurnal)
      : "";
  const bulan =
    typeof params.bulan === "string"
      ? normalizeMonthFilter(params.bulan)
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const selectedId =
    typeof params.jurnal === "string" &&
    postgresUuidPattern.test(params.jurnal)
      ? params.jurnal
      : undefined;

  const [data, selected] = await Promise.all([
    getSiswaJurnalList(profile.id, { q, status, bulan, page }),
    selectedId
      ? getSiswaJurnalDetail(profile.id, selectedId)
      : Promise.resolve(null),
  ]);

  if (!data.siswa) {
    return (
      <section className={card}>
        <EmptyState
          icon={CircleAlert}
          title="Profil siswa belum lengkap"
          description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar data Anda dilengkapi."
        />
      </section>
    );
  }

  const hasFilter = Boolean(q || status || bulan);
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
    if (bulan) next.set("bulan", bulan);

    const targetPage = overrides.page ?? page;
    if (targetPage > 1) next.set("page", String(targetPage));
    if (overrides.jurnal) next.set("jurnal", overrides.jurnal);

    const query = next.toString();
    return query ? `/siswa/jurnal?${query}` : "/siswa/jurnal";
  }

  function pageHref(target: number) {
    return jurnalHref({ page: target });
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Jurnal PKL
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Jurnal Harian
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Riwayat jurnal PKL Anda. Jurnal diverifikasi guru pembimbing lalu
            instruktur perusahaan.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.total}
          </span>{" "}
          jurnal
        </p>
      </header>

      <dl
        aria-label="Ringkasan jurnal"
        className="mb-4 grid overflow-hidden rounded-md border border-border bg-surface shadow-xs sm:grid-cols-3"
      >
        <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
          <dt className="text-[13px] font-medium leading-[18px] text-muted">
            Jurnal final
          </dt>
          <dd className="mt-1">
            <span className="block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
              {data.summary.final}
              <span className="text-base font-medium text-muted">
                /{data.summary.total}
              </span>
            </span>
            <span className="mt-1 block text-[13px] leading-[18px] text-muted">
              {data.summary.total
                ? "Terverifikasi instruktur"
                : "Belum ada jurnal"}
            </span>
          </dd>
        </div>

        <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
          <dt className="text-[13px] font-medium leading-[18px] text-muted">
            Perlu revisi
          </dt>
          <dd className="mt-1">
            <span
              className={cn(
                "block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] tabular-nums",
                data.summary.revisi ? "text-danger" : "text-ink",
              )}
            >
              {data.summary.revisi}
            </span>
            <span className="mt-1 block text-[13px] leading-[18px] text-muted">
              {data.summary.revisi
                ? "Baca catatan verifikasi"
                : "Tidak ada revisi"}
            </span>
          </dd>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <dt className="text-[13px] font-medium leading-[18px] text-muted">
            Hari ini
          </dt>
          <dd className="mt-1">
            {data.summary.hariIni ? (
              <>
                <JurnalBadge status={data.summary.hariIni.status} />
                <Link
                  href={`${jurnalHref({ jurnal: data.summary.hariIni.id })}#jurnal-detail`}
                  prefetch={false}
                  className="mt-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                >
                  Lihat jurnal hari ini
                </Link>
              </>
            ) : (
              <>
                <span className="block text-sm font-medium text-ink">
                  Belum diisi
                </span>
                <Link
                  href="/siswa"
                  className="mt-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                >
                  Buka beranda
                </Link>
              </>
            )}
          </dd>
        </div>
      </dl>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] sm:items-end">
        <Field label="Cari kegiatan" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Kegiatan atau deskripsi"
          />
        </Field>

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

        <Field label="Bulan" htmlFor="bulan">
          <Select id="bulan" name="bulan" defaultValue={bulan}>
            <option value="">Semua bulan</option>
            {data.monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          {/* Muat ulang penuh agar input filter uncontrolled kembali kosong. */}
          <a
            href="/siswa/jurnal"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </a>
        </div>
      </FilterForm>

      {!data.rows.length && !selected ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={hasFilter ? Search : BookOpen}
            title={hasFilter ? "Jurnal tidak ditemukan" : "Belum ada jurnal"}
            description={
              hasFilter
                ? "Coba kata kunci lain atau ubah filter."
                : "Jurnal yang Anda isi akan muncul di sini."
            }
            action={
              hasFilter ? (
                <a
                  href="/siswa/jurnal"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </a>
              ) : (
                <Link
                  href="/siswa"
                  className={buttonVariants({ variant: "primary" })}
                >
                  Buka beranda
                </Link>
              )
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
                            <p className="text-[13px] font-medium text-ink">
                              {formatDate(journal.tanggal)}
                            </p>
                            <JurnalBadge status={journal.status} />
                          </div>
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
                          href="/siswa/jurnal"
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
                      {formatDay(selected.tanggal)}
                    </h2>
                  </div>
                  <JurnalBadge status={selected.status} />
                </div>

                {selected.status === "revisi" ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
                    <CircleAlert
                      className="mt-0.5 size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p>
                      Jurnal ini perlu diperbaiki. Baca catatan verifikasi di
                      bagian bawah.
                    </p>
                  </div>
                ) : null}

                <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
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
                        alt={`Foto jurnal tanggal ${formatDate(selected.tanggal)}`}
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
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
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
                  description="Jurnal mungkin sudah dihapus atau bukan milik akun Anda."
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
