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
  Users,
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
  getOrtuJurnalData,
  type OrtuJurnalVerification,
} from "@/lib/data/ortu-jurnal";
import { normalizeMonthFilter } from "@/lib/data/siswa-jurnal";
import { statusJurnal, type StatusJurnal } from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jurnal Anak",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const hubunganLabel = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
} as const;

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
  verification?: OrtuJurnalVerification;
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
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-[22px] text-ink-soft">
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
  anak?: string;
  q?: string;
  status?: string;
  bulan?: string;
  page?: string;
}>;

export default async function OrtuJurnalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireRole("ortu");
  const params = await searchParams;
  const anak = typeof params.anak === "string" ? params.anak : undefined;
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

  const data = await getOrtuJurnalData(profile.id, {
    anak,
    q,
    status,
    bulan,
    page,
  });
  const child = data.activeChild;
  const hasFilter = Boolean(q || status || bulan);
  const emptyPage = data.total > 0 && data.rows.length === 0;
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Orang Tua
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Jurnal Anak
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Pantau jurnal harian anak dan status verifikasi dari guru pembimbing
          serta instruktur perusahaan.
        </p>
      </div>

      {child ? (
        <p className="text-sm text-muted lg:text-right">
          {hubunganLabel[child.hubungan]} · {child.nama} · NIS {child.nis}
        </p>
      ) : null}
    </header>
  );

  if (!child) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada data anak"
            description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar relasi orang tua dan siswa dibuat."
          />
        </section>
      </div>
    );
  }

  const childId = child.id;

  function pageHref(target: number) {
    const next = new URLSearchParams();
    next.set("anak", childId);
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (bulan) next.set("bulan", bulan);
    if (target > 1) next.set("page", String(target));

    return `/ortu/jurnal?${next.toString()}`;
  }

  const resetHref = `/ortu/jurnal?anak=${childId}`;

  return (
    <div>
      {header}

      {data.children.length > 1 ? (
        <nav aria-label="Pilih anak" className="mb-6 flex flex-wrap gap-2">
          {data.children.map((item) => {
            const active = item.id === child.id;

            return (
              <Link
                key={item.id}
                href={`/ortu/jurnal?anak=${item.id}`}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full border px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                  active
                    ? "border-brand-700 bg-brand-50 text-brand-700"
                    : "border-border bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                {item.nama}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <dl
        aria-label="Ringkasan jurnal anak"
        className="mb-4 grid overflow-hidden rounded-md border border-border bg-surface shadow-xs sm:grid-cols-3"
      >
        <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
          <dt className="text-[13px] font-medium leading-[18px] text-muted">
            Total jurnal
          </dt>
          <dd className="mt-1">
            <span className="block font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink tabular-nums">
              {data.summary.total}
            </span>
            <span className="mt-1 block text-[13px] leading-[18px] text-muted">
              {data.summary.total
                ? "Jurnal yang sudah dicatat"
                : "Belum ada jurnal"}
            </span>
          </dd>
        </div>

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
              Terverifikasi instruktur
            </span>
          </dd>
        </div>

        <div className="px-4 py-4 sm:px-5">
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
      </dl>

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_180px_auto] sm:items-end">
        <input type="hidden" name="anak" value={child.id} />

        <Field label="Cari kegiatan" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={q}
            placeholder="Kegiatan atau deskripsi"
          />
        </Field>

        <Field label="Status jurnal" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            {data.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
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
            href={resetHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </a>
        </div>
      </FilterForm>

      {data.rows.length ? (
        <section className="mt-6" aria-labelledby="daftar-jurnal-title">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="daftar-jurnal-title"
                className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
              >
                Daftar jurnal
              </h2>
              <p className="mt-1 text-sm text-muted">
                Diurutkan dari yang terbaru.
              </p>
            </div>
            <p className="text-sm text-muted tabular-nums">
              {data.total} jurnal
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.rows.map((journal) => {
              const guruVerification = journal.verifikasi.find(
                (verification) => verification.peran === "guru",
              );
              const instrukturVerification = journal.verifikasi.find(
                (verification) => verification.peran === "instruktur",
              );
              const waktu = timeRange(
                journal.waktuMulai,
                journal.waktuSelesai,
              );

              return (
                <article
                  key={journal.id}
                  id={`jurnal-${journal.id}`}
                  className={cn(card, "scroll-mt-24")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] leading-[18px] text-muted">
                        {formatDay(journal.tanggal)}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold leading-7 text-ink">
                        {journal.kegiatan}
                      </h3>
                      <p className="mt-1 text-[13px] leading-[18px] text-muted">
                        {[
                          journal.perusahaan,
                          waktu,
                          journal.periode,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Penempatan PKL belum diisi"}
                      </p>
                    </div>
                    <JurnalBadge status={journal.status} />
                  </div>

                  {journal.status === "revisi" ? (
                    <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
                      <CircleAlert
                        className="mt-0.5 size-4 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <p>
                        Jurnal ini perlu diperbaiki. Catatan verifikasi ada di
                        bagian bawah.
                      </p>
                    </div>
                  ) : null}

                  {journal.deskripsi ? (
                    <p className="mt-3 whitespace-pre-line break-words text-base leading-[26px] text-ink-soft">
                      {journal.deskripsi}
                    </p>
                  ) : null}

                  {journal.fotoUrl ? (
                    <a
                      href={journal.fotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={journal.fotoUrl}
                        alt={`Foto jurnal ${child.nama} tanggal ${formatDate(journal.tanggal)}`}
                        className="max-h-[320px] w-full rounded-sm border border-border bg-surface-muted object-contain"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="mt-4 flex items-start gap-2 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
                      <ImageOff
                        className="mt-0.5 size-4 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      Foto jurnal tidak tersedia.
                    </div>
                  )}

                  <div className="mt-5 border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-ink">
                      Verifikasi
                    </h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                </article>
              );
            })}
          </div>

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
        </section>
      ) : (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={hasFilter || emptyPage ? Search : BookOpen}
            title={
              hasFilter
                ? "Jurnal tidak ditemukan"
                : emptyPage
                  ? "Halaman tidak ditemukan"
                  : "Belum ada jurnal"
            }
            description={
              hasFilter
                ? "Coba kata kunci lain atau ubah filter."
                : emptyPage
                  ? "Halaman ini tidak memiliki jurnal. Kembali ke halaman pertama."
                  : "Jurnal yang diisi anak akan muncul di sini setelah diisi."
            }
            action={
              hasFilter ? (
                <a
                  href={resetHref}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </a>
              ) : emptyPage ? (
                <Link
                  href={pageHref(1)}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Halaman pertama
                </Link>
              ) : undefined
            }
          />
        </section>
      )}
    </div>
  );
}
