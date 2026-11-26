import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, FileText, Lock, Search } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { IssueSuratButton } from "@/components/pkl/IssueSuratButton";
import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { SuratTabs } from "@/components/pkl/SuratTabs";
import { UploadSuratBaruButton } from "@/components/pkl/UploadSuratBaruButton";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import { jakartaToday } from "@/lib/date";
import {
  currentSuratYear,
  getSuratKelengkapan,
  getSuratUploadOptions,
  type SuratKelengkapanCell,
} from "@/lib/data/admin-surat";
import {
  jenisSuratLabel,
  statusPengajuan,
  type JenisSurat,
  type StatusPengajuan,
} from "@/lib/status";
import {
  alurSuratTypes,
  suratTambahanTypes,
} from "@/lib/surat";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kelengkapan Surat",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

const shortLabel: Record<JenisSurat, string> = {
  izin_orang_tua: "Izin Ortu",
  pengajuan: "Pengajuan",
  keberangkatan: "Pengantar",
  tugas_monitoring: "Tugas Monitoring",
  penarikan: "Penarikan",
  pernyataan: "Pernyataan",
  perjanjian: "Perjanjian",
};

function cellTitle(cell: SuratKelengkapanCell) {
  if (cell.state === "terbit") {
    return cell.surat?.nomor ?? "Surat sudah terbit";
  }

  if (cell.state === "siap") {
    return "Siap diterbitkan";
  }

  return cell.reason ?? "Belum tersedia pada status pengajuan ini";
}

function LetterCell({ cell, pengajuanId }: {
  cell: SuratKelengkapanCell;
  pengajuanId: string;
}) {
  if (cell.state === "terbit" && cell.surat) {
    return (
      <div className="min-w-[104px]">
        <Link
          href={`/api/surat/${cell.surat.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-success underline-offset-4 hover:underline"
        >
          <BadgeCheck
            className="size-3.5"
            strokeWidth={1.75}
            aria-hidden
          />
          Terbit
        </Link>
        <p className="mt-1 max-w-[120px] truncate text-[11px] leading-4 text-muted tabular-nums">
          {cell.surat.nomor ?? "Nomor belum tersedia"}
        </p>
        {cell.surat.hasFile ? (
          <p className="text-[11px] leading-4 text-brand-700">
            File sekolah
          </p>
        ) : null}
      </div>
    );
  }

  if (cell.state === "siap") {
    return (
      <IssueSuratButton
        pengajuanId={pengajuanId}
        jenis={cell.jenis}
      />
    );
  }

  return (
    <span
      title={cellTitle(cell)}
      className="inline-flex items-center gap-1 text-[12px] text-muted"
    >
      <Lock className="size-3.5" strokeWidth={1.75} aria-hidden />
      Belum
    </span>
  );
}

export default async function AdminSuratKelengkapanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(statusPengajuan, params.status)
      ? (params.status as StatusPengajuan)
      : "";

  const [data, uploadOptions] = await Promise.all([
    getSuratKelengkapan({ q, status }),
    getSuratUploadOptions(),
  ]);
  const hasFilter = Boolean(q || status);
  const types = [...alurSuratTypes, ...suratTambahanTypes];
  const tahun = currentSuratYear();
  const today = jakartaToday();

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
            Pantau surat yang sudah terbit untuk setiap siswa. Kolom terkunci
            berarti surat belum bisa diterbitkan pada status pengajuan saat ini.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted lg:text-right">
            <span className="font-display text-2xl font-semibold text-ink tabular-nums">
              {data.total}
            </span>{" "}
            pengajuan
          </p>
          <UploadSuratBaruButton
            options={uploadOptions}
            tahun={tahun}
            today={today}
          />
        </div>
      </header>

      <SuratTabs active="kelengkapan" />

      <FilterForm className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={q}
            placeholder="Nama siswa, NIS, atau perusahaan"
          />
        </Field>

        <Field label="Status pengajuan" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            {Object.entries(statusPengajuan).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/surat/kelengkapan"
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
          <div className="mt-4 hidden overflow-x-auto rounded-md border border-border bg-surface shadow-xs lg:block">
            <table className="w-full min-w-[1420px] border-collapse text-sm">
              <caption className="sr-only">
                Kelengkapan surat per pengajuan siswa
              </caption>
              <thead className="bg-surface-muted text-left text-[12px] font-semibold text-ink-soft">
                <tr>
                  <th scope="col" rowSpan={2} className="px-4 py-3">
                    Siswa
                  </th>
                  <th scope="col" rowSpan={2} className="px-3 py-3">
                    Status
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={alurSuratTypes.length}
                    className="border-l border-border px-4 py-2 text-center"
                  >
                    Alur PKL
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={suratTambahanTypes.length}
                    className="border-l border-border px-4 py-2 text-center"
                  >
                    Tambahan
                  </th>
                </tr>
                <tr>
                  {types.map((jenis, index) => (
                    <th
                      key={jenis}
                      scope="col"
                      className={cn(
                        "px-3 py-2 align-bottom",
                        index === 0 && "border-l border-border",
                        index === alurSuratTypes.length &&
                          "border-l border-border",
                      )}
                      title={jenisSuratLabel[jenis]}
                    >
                      {shortLabel[jenis]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.pengajuanId}
                    className="border-t border-border align-top transition-colors duration-[var(--m-fast)] hover:bg-brand-50/40"
                  >
                    <td className="min-w-[240px] px-4 py-3">
                      <p className="font-medium text-ink">
                        {row.students
                          .map((student) => student.nama)
                          .join(", ") || "Siswa tidak ditemukan"}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-4 text-muted">
                        {row.students
                          .map((student) => `NIS ${student.nis}`)
                          .join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-[12px] leading-4 text-muted">
                        {[row.perusahaan?.nama, row.periode?.nama]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <PengajuanBadge status={row.status} />
                    </td>
                    {types.map((jenis, index) => (
                      <td
                        key={jenis}
                        className={cn(
                          "px-3 py-3",
                          index === 0 && "border-l border-border",
                          index === alurSuratTypes.length &&
                            "border-l border-border",
                        )}
                      >
                        <LetterCell
                          cell={row.cells[jenis]}
                          pengajuanId={row.pengajuanId}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 lg:hidden">
            {data.rows.map((row) => (
              <li key={row.pengajuanId}>
                <article className="rounded-md border border-border bg-surface p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink">
                        {row.students
                          .map((student) => student.nama)
                          .join(", ") || "Siswa tidak ditemukan"}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-4 text-muted">
                        {row.students
                          .map((student) => `NIS ${student.nis}`)
                          .join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-[13px] leading-[18px] text-muted">
                        {[row.perusahaan?.nama, row.periode?.nama]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <PengajuanBadge status={row.status} />
                  </div>

                  <div className="mt-4 divide-y divide-border border-t border-border">
                    {types.map((jenis) => {
                      const cell = row.cells[jenis];

                      return (
                        <div
                          key={jenis}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <span className="text-[13px] leading-[18px] text-ink-soft">
                            {jenisSuratLabel[jenis]}
                          </span>
                          <div className="shrink-0 text-right">
                            <LetterCell
                              cell={cell}
                              pengajuanId={row.pengajuanId}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-4 rounded-md border border-border bg-surface p-5 shadow-xs sm:p-6">
          <EmptyState
            icon={hasFilter ? Search : FileText}
            title={
              hasFilter
                ? "Tidak ada pengajuan yang cocok"
                : "Belum ada pengajuan"
            }
            description={
              hasFilter
                ? "Ubah kata kunci atau filter status, lalu coba lagi."
                : "Kelengkapan surat akan muncul setelah ada pengajuan PKL."
            }
            action={
              hasFilter ? (
                <Link
                  href="/admin/surat/kelengkapan"
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
