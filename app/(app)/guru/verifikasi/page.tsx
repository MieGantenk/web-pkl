import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ClipboardCheck, ImageOff } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { FilterForm } from "@/components/pkl/FilterForm";
import { JurnalBadge } from "@/components/pkl/StatusBadge";
import { VerificationPanel } from "@/components/pkl/VerificationPanel";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { verifyJurnalAction } from "@/lib/actions/verifikasi";
import { requireRole } from "@/lib/auth";
import { getGuruVerificationQueue } from "@/lib/data/guru";
import {
  kehadiranJurnal,
  statusJurnal,
  type StatusJurnal,
} from "@/lib/status";
import { postgresUuidPattern } from "@/lib/validators/common";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi Jurnal",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const statusFilters = [
  { value: "menunggu", label: "Perlu diverifikasi" },
  { value: "revisi", label: "Perlu revisi" },
  { value: "terverifikasi_guru", label: "Menunggu instruktur" },
  { value: "terverifikasi_instruktur", label: "Selesai" },
] as const;

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM yyyy", {
    locale: localeId,
  });
}

function formatShortDay(isoDate: string) {
  return format(parseISO(isoDate), "d MMM", { locale: localeId });
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

type GuruVerificationPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function GuruVerificationPage({
  searchParams,
}: GuruVerificationPageProps) {
  const profile = await requireRole("guru");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(statusJurnal, params.status)
      ? (params.status as StatusJurnal)
      : "";
  const selectedId =
    typeof params.jurnal === "string" &&
    postgresUuidPattern.test(params.jurnal)
      ? params.jurnal
      : undefined;
  const data = await getGuruVerificationQueue(profile.id, {
    jurnalId: selectedId,
    q,
    status,
  });
  const hasFilter = Boolean(q || status);

  function jurnalHref(id: string) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    next.set("jurnal", id);
    return `/guru/verifikasi?${next.toString()}#jurnal-detail`;
  }

  if (!data.context) {
    return (
      <section className={card}>
        <EmptyState
          icon={ClipboardCheck}
          title="Data guru belum terhubung"
          description="Akun ini belum memiliki data guru. Hubungi admin sekolah agar profil guru dihubungkan ke akun Anda."
        />
      </section>
    );
  }

  const selected = data.selected;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Verifikasi Jurnal
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Verifikasi langkah 1. Setelah disetujui, jurnal diteruskan ke
            instruktur perusahaan.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.pending}
          </span>{" "}
          menunggu
        </p>
      </header>

      <FilterForm className="mb-4 grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
        <Field label="Cari siswa atau kegiatan" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nama, NIS, atau kegiatan"
          />
        </Field>

        <Field label="Status jurnal" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Semua status ({data.total})</option>
            {statusFilters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label} ({data.counts[item.value]})
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2">
          {/* Muat ulang penuh agar input filter uncontrolled kembali kosong. */}
          <a
            href="/guru/verifikasi"
            className={cn(
              buttonVariants({ variant: "ghost", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            Reset
          </a>
        </div>
      </FilterForm>

      {!data.journals.length ? (
        <section className={card}>
          <EmptyState
            icon={ClipboardCheck}
            title={
              hasFilter
                ? "Tidak ada jurnal pada filter ini"
                : "Belum ada jurnal"
            }
            description={
              hasFilter
                ? "Ubah filter atau reset pencarian untuk melihat jurnal lain."
                : "Jurnal siswa bimbingan akan muncul di sini setelah diisi."
            }
            action={
              hasFilter ? (
                <a
                  href="/guru/verifikasi"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </a>
              ) : undefined
            }
          />
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-md border border-border bg-surface shadow-xs lg:order-1">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-ink">Antrean</h2>
            <span className="text-[13px] text-muted tabular-nums">
              {data.journals.length}
              {hasFilter ? ` dari ${data.total}` : ""} jurnal
            </span>
          </div>

          {data.journals.length ? (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
              {data.journals.map((journal) => {
                const active = journal.id === selected?.id;

                return (
                  <li key={journal.id}>
                    <Link
                      href={jurnalHref(journal.id)}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block px-4 py-3 transition-colors hover:bg-surface-muted/60",
                        active && "bg-brand-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {journal.nama}
                        </p>
                        <JurnalBadge status={journal.status} />
                      </div>
                      <p className="mt-1 text-[12px] leading-4 text-muted">
                        {formatShortDay(journal.tanggal)} ·{" "}
                        {kehadiranJurnal[journal.kehadiran].label} ·{" "}
                        {journal.perusahaan ?? "Perusahaan belum diisi"}
                      </p>
                      <p className="mt-1 truncate text-[13px] leading-[18px] text-ink-soft">
                        {journal.kegiatan}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={ClipboardCheck}
                title="Tidak ada jurnal"
                description={
                  hasFilter
                    ? "Ubah filter atau reset pencarian."
                    : "Jurnal siswa bimbingan akan muncul di sini setelah diisi."
                }
                action={
                  hasFilter ? (
                    <a
                      href="/guru/verifikasi"
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

        <section
          id="jurnal-detail"
          className={cn("lg:order-2", selected && "order-first")}
        >
          {!selected ? (
            <div className={card}>
              <EmptyState
                icon={ClipboardCheck}
                title={
                  data.total === 0
                    ? "Belum ada jurnal"
                    : hasFilter
                      ? "Tidak ada jurnal pada filter ini"
                      : "Tidak ada jurnal untuk diverifikasi"
                }
                description={
                  data.total === 0
                    ? "Jurnal siswa bimbingan akan muncul di sini setelah diisi."
                    : hasFilter
                      ? "Ubah filter atau reset pencarian untuk melihat jurnal lain."
                      : "Pilih jurnal dari antrean atau tunggu siswa mengisi jurnal."
                }
                action={
                  hasFilter ? (
                    <a
                      href="/guru/verifikasi"
                      className={buttonVariants({ variant: "secondary" })}
                    >
                      Reset filter
                    </a>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className={card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium leading-[18px] text-muted">
                    {selected.perusahaan ?? "Perusahaan belum diisi"}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink">
                    {selected.nama}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {selected.nis ? `NIS ${selected.nis} · ` : ""}
                    {selected.kelas ?? "—"} · {formatDay(selected.tanggal)} ·{" "}
                    {kehadiranJurnal[selected.kehadiran].label}
                    {selected.kehadiran === "hadir" &&
                    formatTime(selected.waktuMulai) &&
                    formatTime(selected.waktuSelesai)
                      ? ` · ${formatTime(selected.waktuMulai)}–${formatTime(selected.waktuSelesai)}`
                      : ""}
                  </p>
                </div>
                <JurnalBadge status={selected.status} />
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-base font-medium text-ink">
                  {selected.kegiatan}
                </p>
                {selected.deskripsi ? (
                  <p className="mt-2 text-base leading-[26px] text-ink-soft">
                    {selected.deskripsi}
                  </p>
                ) : null}

                {selected.fotoUrl ? (
                  <a
                    href={selected.fotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.fotoUrl}
                      alt={`Foto jurnal ${selected.nama}`}
                      className="max-h-[360px] w-full rounded-sm border border-border bg-surface-muted object-contain"
                      loading="lazy"
                    />
                  </a>
                ) : selected.kehadiran === "hadir" ? (
                  <div className="mt-4 flex items-start gap-2 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
                    <ImageOff
                      className="mt-0.5 size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Foto jurnal tidak tersedia.
                  </div>
                ) : null}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <VerificationPanel
                  key={selected.id}
                  jurnalId={selected.id}
                  canVerify={selected.canVerify}
                  existingNote={selected.guruVerification?.catatan ?? null}
                  approveDescription="Jurnal akan diteruskan ke instruktur perusahaan. Pastikan kegiatan dan foto sudah sesuai."
                  unavailableMessage={
                    selected.hasInstrukturVerification
                      ? "Jurnal ini sudah diverifikasi instruktur. Verifikasi tidak bisa diubah lagi."
                      : "Jurnal ini tidak dapat diverifikasi saat ini."
                  }
                  verifierName={profile.nama_lengkap}
                  action={verifyJurnalAction}
                />
              </div>
            </div>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
