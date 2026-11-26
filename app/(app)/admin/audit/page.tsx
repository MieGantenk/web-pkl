import type { Metadata } from "next";
import Link from "next/link";
import { History, KeyRound, Search, ShieldCheck } from "lucide-react";

import { AccountPasswordPanel } from "@/components/pkl/AccountPasswordPanel";
import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getAuditDetailLabel,
  getAuditActionMeta,
  getAuditEntityLabel,
  isPasswordAuditAction,
} from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import {
  getAuditDetail,
  getAuditList,
  normalizeAuditDate,
  type AuditRow,
} from "@/lib/data/admin-audit";
import { roleLabels, type Role } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { postgresUuidPattern } from "@/lib/validators/common";
import type { Json } from "@/types/database";

export const metadata: Metadata = {
  title: "Audit",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function detailEntries(detail: Json | null) {
  if (
    !detail ||
    typeof detail !== "object" ||
    Array.isArray(detail)
  ) {
    return [];
  }

  return Object.entries(detail);
}

const sensitiveDetailPattern = /(password|sandi|token|secret)/i;

function isSensitiveDetailKey(key: string) {
  return sensitiveDetailPattern.test(key);
}

function roleLabel(value: string | null | undefined) {
  return value
    ? (roleLabels[value as Role] ?? value)
    : "Sistem";
}

function AuditDetailPanel({
  row,
  closeHref,
}: {
  row: AuditRow;
  closeHref: string;
}) {
  const meta = getAuditActionMeta(row.aksi);
  const entries = detailEntries(row.detail);
  const passwordAction = isPasswordAuditAction(row.aksi);

  return (
    <section
      id="log-detail"
      className="mt-4 scroll-mt-24 overflow-hidden rounded-md border border-border bg-surface shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">Detail log</p>
          <div className="mt-1.5">
            <StatusBadge
              label={meta.label}
              tone={meta.tone}
              icon={meta.icon}
            />
          </div>
          <p className="mt-1.5 text-[13px] leading-[18px] text-muted">
            {formatDateTime(row.createdAt)}
          </p>
        </div>

        <Link
          href={closeHref}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0",
          )}
        >
          Tutup detail
        </Link>
      </div>

      <div
        className={cn(
          "grid gap-5 p-4 sm:p-5",
          passwordAction &&
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Ringkasan</h2>

          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                Pelaku
              </dt>
              <dd className="mt-1 text-[13px] leading-5 text-ink">
                {row.pengguna ? (
                  <>
                    <span className="font-medium">{row.pengguna.nama}</span>
                    <span className="block text-[12px] text-muted">
                      @{row.pengguna.username} ·{" "}
                      {roleLabel(row.pengguna.peran)}
                    </span>
                  </>
                ) : (
                  <span className="font-medium">Sistem</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                Waktu
              </dt>
              <dd className="mt-1 text-[13px] leading-5 text-ink">
                {formatDateTime(row.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                Entitas
              </dt>
              <dd className="mt-1 text-[13px] leading-5 text-ink">
                {getAuditEntityLabel(row.entitas)}
                <span className="mt-0.5 block break-all font-mono text-[11px] text-muted">
                  {row.entitasId ?? "—"}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                Akun target
              </dt>
              <dd className="mt-1 text-[13px] leading-5 text-ink">
                {row.target ? (
                  <>
                    <span className="font-medium">{row.target.nama}</span>
                    <span className="block text-[12px] text-muted">
                      @{row.target.username} ·{" "}
                      {roleLabel(row.target.peran)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Tidak ada akun target</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-ink">
              Detail teknis
            </h3>

            {entries.length ? (
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-sm border border-border bg-surface-muted px-3 py-2"
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                      {getAuditDetailLabel(key)}
                    </dt>
                    <dd className="mt-1 break-words text-[13px] leading-5 text-ink-soft">
                      {isSensitiveDetailKey(key)
                        ? "Tidak ditampilkan (data sensitif)"
                        : displayValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-[13px] leading-5 text-muted">
                Log ini tidak menyimpan detail tambahan.
              </p>
            )}
          </div>
        </div>

        {passwordAction ? (
          <div className="min-w-0">
            <div className="rounded-sm border border-info-border bg-info-bg px-3 py-3 text-[13px] leading-5 text-info">
              <div className="flex gap-2">
                <KeyRound
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold">
                    Kata sandi tidak dapat ditampilkan
                  </p>
                  <p className="mt-1">
                    Supabase Auth menyimpan kata sandi sebagai hash. Kata sandi
                    lama dan baru tidak dapat dibaca, termasuk oleh admin.
                    Gunakan panel di bawah untuk membuat kata sandi baru.
                  </p>
                </div>
              </div>
            </div>

            {row.target ? (
              <div className="mt-4">
                <AccountPasswordPanel
                  penggunaId={row.target.id}
                  nama={row.target.nama}
                  username={row.target.username}
                />
              </div>
            ) : (
              <p className="mt-4 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
                Akun target tidak ditemukan. Kata sandi tidak dapat direset
                dari log ini.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type SearchParams = Promise<{
  q?: string;
  aksi?: string;
  entitas?: string;
  dari?: string;
  sampai?: string;
  page?: string;
  log?: string;
}>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const aksi =
    typeof params.aksi === "string" ? params.aksi.slice(0, 100) : "";
  const entitas =
    typeof params.entitas === "string" ? params.entitas.slice(0, 100) : "";
  const dari =
    typeof params.dari === "string" ? normalizeAuditDate(params.dari) : "";
  const sampai =
    typeof params.sampai === "string"
      ? normalizeAuditDate(params.sampai)
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const selectedId =
    typeof params.log === "string" && postgresUuidPattern.test(params.log)
      ? params.log
      : "";

  const [data, selected] = await Promise.all([
    getAuditList({ q, aksi, entitas, dari, sampai, page }),
    selectedId ? getAuditDetail(selectedId) : Promise.resolve(null),
  ]);
  const hasFilter = Boolean(q || aksi || entitas || dari || sampai);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function auditHref(overrides: { page?: number; log?: string } = {}) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (aksi) next.set("aksi", aksi);
    if (entitas) next.set("entitas", entitas);
    if (dari) next.set("dari", dari);
    if (sampai) next.set("sampai", sampai);

    const targetPage = overrides.page ?? page;
    if (targetPage > 1) next.set("page", String(targetPage));
    if (overrides.log) next.set("log", overrides.log);

    const query = next.toString();
    return query ? `/admin/audit?${query}` : "/admin/audit";
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Admin Sekolah
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Audit
          </h1>
          <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
            Lacak siapa melakukan apa dan kapan. Semua aksi penting pada
            pengajuan, jurnal, surat, dan pengaturan tercatat di sini.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck
            className="size-4 text-brand-600"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>
            <span className="font-display text-2xl font-semibold text-ink tabular-nums">
              {data.total}
            </span>{" "}
            log
          </span>
        </div>
      </header>

      <section
        className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border"
        aria-label="Ringkasan audit"
      >
        <div className="bg-surface px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-muted">Total log</p>
          <p className="mt-1 font-display text-2xl font-semibold leading-8 text-ink tabular-nums">
            {data.stats.total}
          </p>
        </div>
        <div className="bg-surface px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-muted">Hari ini</p>
          <p className="mt-1 font-display text-2xl font-semibold leading-8 text-ink tabular-nums">
            {data.stats.today}
          </p>
        </div>
        <div className="bg-surface px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-muted">Jenis aksi</p>
          <p className="mt-1 font-display text-2xl font-semibold leading-8 text-ink tabular-nums">
            {data.stats.actions}
          </p>
        </div>
      </section>

      <FilterForm className="mt-4 grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-7 sm:items-end">
        <div className="sm:col-span-2">
          <Field label="Cari pengguna" htmlFor="q">
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nama atau username"
            />
          </Field>
        </div>

        <Field label="Aksi" htmlFor="aksi">
          <Select id="aksi" name="aksi" defaultValue={aksi}>
            <option value="">Semua aksi</option>
            {data.aksiOptions.map((option) => (
              <option key={option} value={option}>
                {getAuditActionMeta(option).label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Entitas" htmlFor="entitas">
          <Select id="entitas" name="entitas" defaultValue={entitas}>
            <option value="">Semua entitas</option>
            {data.entitasOptions.map((option) => (
              <option key={option} value={option}>
                {getAuditEntityLabel(option)}
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

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
          <Link
            href="/admin/audit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </FilterForm>

      {dari && sampai && dari > sampai ? (
        <p className="mt-4 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
          Tanggal awal melewati tanggal akhir. Tukar rentang tanggal untuk
          melihat log.
        </p>
      ) : null}

      {selected ? (
        <AuditDetailPanel row={selected} closeHref={auditHref()} />
      ) : selectedId ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={History}
            title="Log tidak ditemukan"
            description="Log mungkin sudah dihapus atau tautannya tidak valid."
            action={
              <Link
                href={auditHref()}
                className={buttonVariants({ variant: "secondary" })}
              >
                Tutup detail
              </Link>
            }
          />
        </section>
      ) : null}

      {!data.rows.length ? (
        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={hasFilter ? Search : History}
            title={
              hasFilter ? "Log tidak ditemukan" : "Belum ada log aktivitas"
            }
            description={
              hasFilter
                ? "Coba kata kunci lain atau ubah filter audit."
                : "Aksi persetujuan, verifikasi, dan penerbitan surat akan tercatat di sini."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/audit"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : undefined
            }
          />
        </section>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold text-ink">
                Log aktivitas
              </h2>
              <span className="text-[13px] text-muted tabular-nums">
                {data.rows.length} dari {data.total}
              </span>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Waktu
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Pengguna
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Aksi
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Entitas
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.map((row) => {
                    const meta = getAuditActionMeta(row.aksi);
                    const role = row.pengguna
                      ? (roleLabels[row.pengguna.peran as Role] ??
                        row.pengguna.peran)
                      : "Sistem";

                    return (
                      <tr key={row.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-ink-soft">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {row.pengguna ? (
                            <>
                              <p className="font-medium text-ink">
                                {row.pengguna.nama}
                              </p>
                              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                                @{row.pengguna.username} · {role}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-ink">Sistem</p>
                              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                                Aksi otomatis
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={meta.label}
                            tone={meta.tone}
                            icon={meta.icon}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {row.entitas === "pengguna" && row.target ? (
                            <>
                              <p className="font-medium text-ink">
                                {row.target.nama}
                              </p>
                              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                                @{row.target.username} ·{" "}
                                {roleLabel(row.target.peran)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-ink">
                                {getAuditEntityLabel(row.entitas)}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-muted">
                                {row.entitasId
                                  ? `${row.entitasId.slice(0, 8)}…`
                                  : "—"}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`${auditHref({ log: row.id })}#log-detail`}
                            prefetch={false}
                            className="inline-flex h-8 items-center text-[12px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                          >
                            Lihat detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border lg:hidden">
              {data.rows.map((row) => {
                const meta = getAuditActionMeta(row.aksi);
                const role = row.pengguna
                  ? (roleLabels[row.pengguna.peran as Role] ??
                    row.pengguna.peran)
                  : "Sistem";

                return (
                  <li key={row.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {row.pengguna?.nama ?? "Sistem"}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-4 text-muted">
                          {row.pengguna
                            ? `@${row.pengguna.username} · ${role}`
                            : "Aksi otomatis"}
                        </p>
                      </div>
                      <StatusBadge
                        label={meta.label}
                        tone={meta.tone}
                        icon={meta.icon}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                      <span>{formatDateTime(row.createdAt)}</span>
                      <span className="font-medium text-ink-soft">
                        {row.entitas === "pengguna" && row.target
                          ? `Pengguna · ${row.target.nama}`
                          : `${getAuditEntityLabel(row.entitas)}${
                              row.entitasId
                                ? ` · ${row.entitasId.slice(0, 8)}…`
                                : ""
                            }`}
                      </span>
                    </div>

                    <Link
                      href={`${auditHref({ log: row.id })}#log-detail`}
                      prefetch={false}
                      className="mt-3 inline-flex h-8 items-center text-[12px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
                    >
                      Lihat detail
                    </Link>
                  </li>
                );
              })}
            </ul>
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
              <span className="tabular-nums text-ink-soft">{data.total}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {data.page > 1 ? (
                <Link
                  href={auditHref({ page: data.page - 1 })}
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
                  href={auditHref({ page: data.page + 1 })}
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
