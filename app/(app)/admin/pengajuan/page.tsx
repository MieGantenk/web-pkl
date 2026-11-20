import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanReviewPanel } from "@/components/pkl/PengajuanReviewPanel";
import { PengajuanTimeline } from "@/components/pkl/PengajuanTimeline";
import {
  DokumenBadge,
  PengajuanBadge,
  SuratBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import {
  getAdminPengajuanQueue,
  type PengajuanAdminDokumen,
} from "@/lib/data/admin-pengajuan";
import {
  jenisSuratLabel,
  statusPengajuan,
  type StatusPengajuan,
} from "@/lib/status";
import { cn } from "@/lib/utils";
import { postgresUuidPattern } from "@/lib/validators/common";

export const metadata: Metadata = {
  title: "Pengajuan PKL",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const documentLabels: Record<PengajuanAdminDokumen["jenis"], string> = {
  izin_orang_tua_ttd: "Scan izin orang tua",
  surat_balasan_perusahaan: "Surat balasan perusahaan",
  surat_pernyataan: "Surat pernyataan",
  dokumen_pendukung: "Dokumen pendukung",
  lainnya: "Dokumen lain",
};

const statusOptions = Object.entries(statusPengajuan) as Array<
  [StatusPengajuan, (typeof statusPengajuan)[StatusPengajuan]]
>;

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMM yyyy", { locale: localeId })
    : "—";
}

function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy · HH.mm", {
    locale: localeId,
  });
}

function formatSize(value: number | null) {
  if (!value) return null;

  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
  pengajuan?: string;
}>;

export default async function AdminPengajuanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    params.status === "tindakan" ||
    statusOptions.some(([value]) => value === params.status)
      ? (params.status as string)
      : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const selectedParam =
    typeof params.pengajuan === "string" ? params.pengajuan : "";
  const selectedId = postgresUuidPattern.test(selectedParam)
    ? selectedParam
    : "";

  const data = await getAdminPengajuanQueue({
    q,
    status,
    page,
    selectedId,
  });
  const selected = data.selected;
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  function queryHref(
    targetPage: number,
    pengajuanId?: string | null,
  ) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (targetPage > 1) next.set("page", String(targetPage));
    if (pengajuanId) next.set("pengajuan", pengajuanId);

    const query = next.toString();
    return query ? `/admin/pengajuan?${query}` : "/admin/pengajuan";
  }

  const backHref = queryHref(data.page);
  const pendingDokumen =
    selected?.status === "izin_ortu_diunggah"
      ? selected.dokumen.find(
          (dokumen) =>
            dokumen.jenis === "izin_orang_tua_ttd" &&
            dokumen.status === "menunggu",
        )
      : selected?.status === "balasan_diunggah"
        ? selected.dokumen.find(
            (dokumen) =>
              dokumen.jenis === "surat_balasan_perusahaan" &&
              dokumen.status === "menunggu",
          )
        : undefined;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            PKL
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Pengajuan PKL
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Tinjau pengajuan, verifikasi dokumen, dan setujui pengajuan siswa.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.pendingIzin + data.pendingBalasan}
          </span>{" "}
          menunggu tindakan
          <span className="mt-1 block text-[13px] leading-[18px]">
            {data.pendingIzin} izin · {data.pendingBalasan} balasan
          </span>
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end"
      >
        <Field label="Cari" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama siswa atau perusahaan"
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status</option>
            <option value="tindakan">Perlu tindakan</option>
            {statusOptions.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Terapkan
          </button>
          <Link
            href="/admin/pengajuan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside
          className={cn(
            "overflow-hidden rounded-md border border-border bg-surface shadow-xs",
            selected && "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-ink">Antrean</h2>
            <span className="text-[13px] text-muted tabular-nums">
              {data.total} pengajuan
            </span>
          </div>

          {data.items.length ? (
            <>
              <ul className="max-h-[480px] divide-y divide-border overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
                {data.items.map((item) => {
                  const active = item.id === selected?.id;

                  return (
                    <li key={item.id}>
                      <Link
                        href={queryHref(data.page, item.id)}
                        prefetch={false}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block px-4 py-3 transition-colors hover:bg-surface-muted/60",
                          active && "bg-brand-50",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-ink">
                            {item.studentName}
                          </p>
                          <PengajuanBadge status={item.status} />
                        </div>
                        <p className="mt-1 truncate text-[13px] leading-[18px] text-ink-soft">
                          {item.companyName ?? "Perusahaan belum diisi"}
                          {item.companyKota ? ` · ${item.companyKota}` : ""}
                        </p>
                        <p className="mt-1 text-[12px] leading-4 text-muted">
                          {formatDateTime(item.createdAt)} ·{" "}
                          {item.memberCount} siswa
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {data.pageCount > 1 ? (
                <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-[12px] leading-4 text-muted">
                  {data.page > 1 ? (
                    <Link
                      href={queryHref(data.page - 1)}
                      className="inline-flex h-11 items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                    >
                      <ChevronLeft
                        className="size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      Sebelumnya
                    </Link>
                  ) : (
                    <span aria-disabled="true" className="opacity-50">
                      Sebelumnya
                    </span>
                  )}
                  <span className="tabular-nums">
                    {data.page}/{data.pageCount}
                  </span>
                  {data.page < data.pageCount ? (
                    <Link
                      href={queryHref(data.page + 1)}
                      className="inline-flex h-11 items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Berikutnya
                      <ChevronRight
                        className="size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <span aria-disabled="true" className="opacity-50">
                      Berikutnya
                    </span>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={ClipboardCheck}
                title={
                  q || status
                    ? "Tidak ada pengajuan yang cocok"
                    : "Belum ada pengajuan"
                }
                description={
                  q || status
                    ? "Ubah kata kunci atau filter, lalu coba lagi."
                    : "Pengajuan siswa akan muncul di sini."
                }
                action={
                  q || status ? (
                    <Link
                      href="/admin/pengajuan"
                      className={buttonVariants({ variant: "secondary" })}
                    >
                      Reset filter
                    </Link>
                  ) : undefined
                }
              />
            </div>
          )}

          <p className="border-t border-border px-4 py-2 text-[12px] leading-4 text-muted tabular-nums">
            Menampilkan {from}–{to} dari {data.total}
          </p>
        </aside>

        <section className={cn(!selected && "hidden lg:block")}>
          {!selected ? (
            <div className={card}>
              <EmptyState
                icon={ClipboardCheck}
                title="Pilih pengajuan"
                description="Pilih salah satu pengajuan dari antrean untuk melihat detail dan memverifikasi dokumen."
              />
            </div>
          ) : (
            <div className={card}>
              <Link
                href={backHref}
                className="inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 lg:hidden"
              >
                <ChevronLeft
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden
                />
                Kembali ke antrean
              </Link>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium leading-[18px] text-muted">
                    {selected.perusahaan?.nama ?? "Perusahaan belum diisi"}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink">
                    {selected.student?.nama ?? "Siswa"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {[
                      selected.student?.nis,
                      selected.student?.kelas,
                      selected.student?.jurusan,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Data siswa belum lengkap"}
                  </p>
                </div>
                <PengajuanBadge status={selected.status} />
              </div>

              {selected.alasanPenolakan ? (
                <div className="mt-4 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
                  Alasan penolakan: {selected.alasanPenolakan}
                </div>
              ) : null}

              <div className="mt-5 border-t border-border pt-4">
                <PengajuanTimeline status={selected.status} />
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-base font-semibold text-ink">
                  Detail pengajuan
                </h3>
                <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[13px] font-medium text-muted">
                      Perusahaan
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink">
                      {selected.perusahaan?.nama ?? "—"}
                      {selected.perusahaan?.kota
                        ? ` · ${selected.perusahaan.kota}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-medium text-muted">
                      Periode
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink">
                      {selected.periode
                        ? `${selected.periode.nama} · ${selected.periode.tahun_ajaran}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-medium text-muted">
                      Tanggal PKL
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink tabular-nums">
                      {formatDate(selected.tanggalMulai)} –{" "}
                      {formatDate(selected.tanggalSelesai)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-medium text-muted">
                      Diajukan
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink tabular-nums">
                      {formatDateTime(selected.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-start gap-2 border-t border-border pt-4">
                  <Users
                    className="mt-0.5 size-4 shrink-0 text-brand-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      Anggota kelompok
                    </p>
                    <p className="mt-1 text-sm leading-[22px] text-ink-soft">
                      {selected.members
                        .map((member) => member.nama)
                        .join(", ") || "Belum ada anggota"}
                    </p>
                  </div>
                </div>

                {selected.catatan ? (
                  <p className="mt-4 border-t border-border pt-4 text-sm leading-[22px] text-ink-soft">
                    Catatan: {selected.catatan}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <FileText
                    className="size-5 text-brand-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <h3 className="text-base font-semibold text-ink">Dokumen</h3>
                </div>

                {selected.dokumen.length ? (
                  <ul className="mt-3 divide-y divide-border border-t border-border">
                    {selected.dokumen.map((dokumen) => (
                      <li
                        key={dokumen.id}
                        className="flex flex-col gap-2 py-3 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">
                            {documentLabels[dokumen.jenis]}
                          </p>
                          <p className="mt-0.5 break-words text-[13px] leading-[18px] text-muted">
                            {dokumen.fileName ?? "Tanpa nama berkas"}
                            {formatSize(dokumen.ukuran)
                              ? ` · ${formatSize(dokumen.ukuran)}`
                              : ""}
                            {` · ${formatDateTime(dokumen.diunggahPada)}`}
                          </p>
                          {dokumen.catatan ? (
                            <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">
                              Catatan: {dokumen.catatan}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                          {dokumen.fileUrl ? (
                            <a
                              href={dokumen.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                            >
                              Lihat berkas
                            </a>
                          ) : (
                            <span className="text-[12px] leading-4 text-muted">
                              Berkas tidak tersedia
                            </span>
                          )}
                          <DokumenBadge status={dokumen.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      icon={FileText}
                      title="Belum ada dokumen"
                      description="Dokumen unggahan siswa akan muncul di sini."
                    />
                  </div>
                )}

                {pendingDokumen ? (
                  <PengajuanReviewPanel
                    key={pendingDokumen.id}
                    pengajuanId={selected.id}
                    dokumenId={pendingDokumen.id}
                    jenis={
                      selected.status === "izin_ortu_diunggah"
                        ? "izin"
                        : "balasan"
                    }
                  />
                ) : selected.status === "izin_ortu_diunggah" ||
                  selected.status === "balasan_diunggah" ? (
                  <p className="mt-4 text-sm leading-[22px] text-warning">
                    Dokumen yang menunggu verifikasi tidak ditemukan. Muat
                    ulang halaman atau periksa data dokumen.
                  </p>
                ) : null}
              </div>

              {selected.surat.length ? (
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="size-5 text-brand-600"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <h3 className="text-base font-semibold text-ink">Surat</h3>
                  </div>
                  <ul className="mt-3 divide-y divide-border border-t border-border">
                    {selected.surat.map((surat) => (
                      <li
                        key={surat.id}
                        className="flex flex-col gap-2 py-3 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {jenisSuratLabel[surat.jenis]}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-[18px] text-muted tabular-nums">
                            {surat.nomor ?? "Nomor belum tersedia"}
                            {surat.tanggalTerbit
                              ? ` · ${formatDate(surat.tanggalTerbit)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {surat.fileUrl ? (
                            <a
                              href={surat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                            >
                              Unduh
                            </a>
                          ) : (
                            <span className="text-[12px] leading-4 text-muted">
                              Berkas belum tersedia
                            </span>
                          )}
                          <SuratBadge status={surat.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
