import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarCheck,
  Check,
  CircleDashed,
  ClipboardList,
  FileText,
  Search,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { MutabaahTabs } from "@/components/pkl/MutabaahTabs";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  getAdminMutabaahHistory,
  normalizeDateFilter,
} from "@/lib/data/admin-mutabaah-history";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mutaba'ah",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: localeId });
}

type PageProps = {
  searchParams: Promise<{
    dari?: string;
    sampai?: string;
    kelas?: string;
    q?: string;
    form?: string;
    lengkap?: string;
  }>;
};

export default async function AdminMutabaahPage({
  searchParams,
}: PageProps) {
  await requireRole("admin");

  const params = await searchParams;
  const dari =
    typeof params.dari === "string" ? normalizeDateFilter(params.dari) : "";
  const sampai =
    typeof params.sampai === "string" ? normalizeDateFilter(params.sampai) : "";
  const kelas =
    typeof params.kelas === "string" ? params.kelas.slice(0, 30) : "";
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const form = typeof params.form === "string" ? params.form : "";
  const lengkap =
    params.lengkap === "lengkap" || params.lengkap === "belum"
      ? params.lengkap
      : "semua";

  const data = await getAdminMutabaahHistory({
    dari,
    sampai,
    kelas,
    q,
    form,
    lengkap,
  });
  const dateFrom = data.range.dari;
  const dateTo = data.range.sampai;
  const rows = data.rows;

  return (
    <div>
      <header className="mb-6">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Admin Sekolah
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Mutaba&apos;ah
        </h1>
        <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
          Pantau pengisian mutaba&apos;ah siswa dan kelola pertanyaannya.
        </p>
      </header>

      <MutabaahTabs active="riwayat" />

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Ringkasan mutaba'ah"
      >
        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Hari ini
              </p>
              <p className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink tabular-nums">
                {data.stats.todayFilled}
                <span className="text-lg font-medium text-muted">
                  /{data.stats.totalStudents}
                </span>
              </p>
            </div>
            <CalendarCheck
              className="size-5 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-[13px] text-muted">siswa sudah mengisi</p>
        </article>

        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Minggu ini
              </p>
              <p className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink tabular-nums">
                {data.stats.weekPercent}%
              </p>
            </div>
            <ClipboardList
              className="size-5 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-[13px] text-muted">tingkat pengisian</p>
        </article>

        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Belum hari ini
              </p>
              <p className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink tabular-nums">
                {data.stats.missingToday}
              </p>
            </div>
            <Users
              className="size-5 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-[13px] text-muted">siswa belum mengisi</p>
        </article>

        <article className={cn(card, "flex flex-col justify-between")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Form aktif
              </p>
              <p className="mt-1 text-base font-semibold leading-6 text-ink">
                {data.stats.formName ?? "Belum ada"}
              </p>
            </div>
            <FileText
              className="size-5 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
          <Link
            href="/admin/mutabaah/pertanyaan"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "mt-3 w-full",
            )}
          >
            Kelola form
          </Link>
        </article>
      </section>

      <section className="mt-6" aria-label="Filter riwayat">
        <FilterForm
          className={cn(card, "grid gap-4 sm:grid-cols-2 lg:grid-cols-6")}
        >
          <Field label="Dari" htmlFor="dari">
            <Input
              id="dari"
              name="dari"
              type="date"
              defaultValue={dateFrom}
            />
          </Field>

          <Field label="Sampai" htmlFor="sampai">
            <Input
              id="sampai"
              name="sampai"
              type="date"
              defaultValue={dateTo}
            />
          </Field>

          <Field label="Kelas" htmlFor="kelas">
            <Select id="kelas" name="kelas" defaultValue={kelas}>
              <option value="">Semua kelas</option>
              {data.kelasOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Siswa" htmlFor="q">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                strokeWidth={1.75}
                aria-hidden
              />
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Nama atau NIS"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Form" htmlFor="form">
            <Select id="form" name="form" defaultValue={form}>
              <option value="">Semua form</option>
              {data.forms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} · v{item.versi}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kelengkapan" htmlFor="lengkap">
            <Select id="lengkap" name="lengkap" defaultValue={lengkap}>
              <option value="semua">Semua</option>
              <option value="lengkap">Lengkap</option>
              <option value="belum">Belum lengkap</option>
            </Select>
          </Field>

          <div className="flex items-end sm:col-span-2 lg:col-span-6">
            <Link
              href="/admin/mutabaah"
              prefetch={false}
              className="text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
            >
              Reset filter
            </Link>
          </div>
        </FilterForm>
      </section>

      <section className="mt-6 sm:mt-8" aria-labelledby="riwayat-title">
        <div className="mb-3">
          <h2
            id="riwayat-title"
            className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
          >
            Riwayat pengisian
          </h2>
          <p className="mt-1 text-sm text-muted">
            {rows.length} entri pada rentang {formatDate(dateFrom)} –{" "}
            {formatDate(dateTo)}.
          </p>
        </div>

        {rows.length ? (
          <>
            <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-left text-[12px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Siswa</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Form</th>
                    <th className="px-4 py-3 font-semibold">Terisi</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => {
                    const complete =
                      row.total > 0 && row.answered >= row.total;

                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-ink-soft tabular-nums">
                          {formatDate(row.tanggal)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">
                            {row.siswa.nama}
                          </p>
                          <p className="text-[12px] text-muted">
                            {row.siswa.nis}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {row.siswa.kelas ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {row.form
                            ? `${row.form.nama} · v${row.form.versi}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-ink-soft tabular-nums">
                          {row.answered}/{row.total}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={complete ? "Lengkap" : "Belum lengkap"}
                            tone={complete ? "success" : "warning"}
                            icon={complete ? Check : CircleDashed}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {rows.map((row) => {
                const complete = row.total > 0 && row.answered >= row.total;

                return (
                  <li key={row.id} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] text-muted">
                          {formatDate(row.tanggal)}
                        </p>
                        <p className="mt-0.5 text-base font-medium text-ink">
                          {row.siswa.nama}
                        </p>
                        <p className="text-[13px] text-muted">
                          {row.siswa.nis} · {row.siswa.kelas ?? "—"}
                        </p>
                      </div>
                      <StatusBadge
                        label={complete ? "Lengkap" : "Belum lengkap"}
                        tone={complete ? "success" : "warning"}
                        icon={complete ? Check : CircleDashed}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-[13px] text-muted">
                      <span className="truncate">
                        {row.form
                          ? `${row.form.nama} · v${row.form.versi}`
                          : "Tanpa form"}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {row.answered}/{row.total}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <section className={card}>
            <EmptyState
              icon={ClipboardList}
              title="Belum ada riwayat"
              description="Tidak ada pengisian mutaba'ah pada filter yang dipilih. Coba ubah rentang tanggal atau reset filter."
            />
          </section>
        )}
      </section>
    </div>
  );
}
