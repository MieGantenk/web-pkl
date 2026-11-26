import type { Metadata } from "next";
import Link from "next/link";
import { History, Search, ShieldCheck } from "lucide-react";

import { AuditLogTable } from "@/components/pkl/AuditLogTable";
import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getAuditActionMeta,
  getAuditEntityLabel,
} from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getAuditList, normalizeAuditDate } from "@/lib/data/admin-audit";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audit",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type SearchParams = Promise<{
  q?: string;
  aksi?: string;
  entitas?: string;
  dari?: string;
  sampai?: string;
  page?: string;
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

  const data = await getAuditList({ q, aksi, entitas, dari, sampai, page });
  const hasFilter = Boolean(q || aksi || entitas || dari || sampai);
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function auditHref(targetPage: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (aksi) next.set("aksi", aksi);
    if (entitas) next.set("entitas", entitas);
    if (dari) next.set("dari", dari);
    if (sampai) next.set("sampai", sampai);
    if (targetPage > 1) next.set("page", String(targetPage));

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
          <AuditLogTable rows={data.rows} total={data.total} />

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
                  href={auditHref(data.page - 1)}
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
                  href={auditHref(data.page + 1)}
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
