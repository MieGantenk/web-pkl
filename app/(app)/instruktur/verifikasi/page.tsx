import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ClipboardCheck, Search } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import {
  DokumenBadge,
  JurnalBadge,
} from "@/components/pkl/StatusBadge";
import { VerificationPanel } from "@/components/pkl/VerificationPanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth";
import { verifyInstrukturJurnalAction } from "@/lib/actions/instruktur-verifikasi";
import { getInstrukturVerificationQueue } from "@/lib/data/instruktur";
import { statusJurnal, type StatusJurnal } from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi Jurnal",
};

export const instant = false;

const route = "/instruktur/verifikasi";
const statusOptions: StatusJurnal[] = [
  "menunggu",
  "terverifikasi_guru",
  "terverifikasi_instruktur",
  "revisi",
];

type VerificationPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function selectionHref(
  jurnalId: string,
  query: string,
  status: StatusJurnal | "",
) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (status) params.set("status", status);
  params.set("jurnalId", jurnalId);

  return `${route}?${params.toString()}`;
}

function formatJournalDate(date: string) {
  return format(parseISO(date), "EEEE, d MMMM yyyy", { locale: localeId });
}

export default async function InstrukturVerificationPage({
  searchParams,
}: VerificationPageProps) {
  const profile = await requireRole("instruktur");
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.slice(0, 100).trim() : "";
  const statusValue =
    typeof params.status === "string" ? params.status : "";
  const selectedStatus =
    statusOptions.find((status) => status === statusValue) ?? "";
  const selectedJournalId =
    typeof params.jurnalId === "string" ? params.jurnalId : undefined;
  const data = await getInstrukturVerificationQueue(profile.id, {
    jurnalId: selectedJournalId,
    q: query,
    status: selectedStatus,
  });
  const selectedJournal = data.selected;
  const hasFilter = Boolean(query || selectedStatus);

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Instruktur Perusahaan
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Verifikasi Jurnal
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Tinjau jurnal siswa yang ditugaskan kepada Anda setelah disetujui
            guru pembimbing.
          </p>
        </div>

        <dl className="flex gap-4 rounded-md border border-border bg-surface px-4 py-3 shadow-xs">
          <div>
            <dt className="text-[12px] leading-4 text-muted">
              Siap diverifikasi
            </dt>
            <dd className="mt-1 text-xl font-semibold text-warning tabular-nums">
              {data.pending}
            </dd>
          </div>
          <div className="border-l border-border pl-4">
            <dt className="text-[12px] leading-4 text-muted">
              Total jurnal
            </dt>
            <dd className="mt-1 text-xl font-semibold text-ink tabular-nums">
              {data.total}
            </dd>
          </div>
        </dl>
      </header>

      <form
        action={route}
        method="get"
        className="mb-4 grid gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_220px_auto_auto] sm:items-end"
      >
        <Field label="Cari siswa atau kegiatan" htmlFor="q">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Nama, NIS, atau kegiatan"
          />
        </Field>
        <Field label="Status jurnal" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={selectedStatus}
          >
            <option value="">Semua status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusJurnal[status].label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" className="w-full sm:w-auto">
          Cari jurnal
        </Button>
        <Link
          href={route}
          className={cn(
            buttonVariants({ variant: "ghost", size: "md" }),
            "w-full sm:w-auto",
          )}
        >
          Reset
        </Link>
      </form>

      {!data.context.companies.length ? (
        <section className="rounded-md border border-border bg-surface p-5 shadow-xs sm:p-6">
          <EmptyState
            icon={ClipboardCheck}
            title="Belum ada penugasan perusahaan"
            description="Hubungi admin sekolah agar Anda ditetapkan pada perusahaan dan siswa PKL yang perlu didampingi."
          />
        </section>
      ) : !data.journals.length ? (
        <section className="rounded-md border border-border bg-surface p-5 shadow-xs sm:p-6">
          <EmptyState
            icon={Search}
            title={hasFilter ? "Jurnal tidak ditemukan" : "Belum ada jurnal"}
            description={
              hasFilter
                ? "Coba kata kunci lain atau reset filter untuk melihat antrean."
                : "Jurnal siswa dari penempatan Anda akan muncul di sini setelah dikirim."
            }
            action={
              hasFilter ? (
                <Link
                  href={route}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Reset filter
                </Link>
              ) : undefined
            }
          />
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
          <section
            aria-labelledby="antrean-title"
            className="overflow-hidden rounded-md border border-border bg-surface shadow-xs"
          >
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <h2
                id="antrean-title"
                className="font-semibold text-ink"
              >
                Antrean jurnal
              </h2>
              <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                {data.journals.length} jurnal sesuai filter
              </p>
            </div>
            <ul className="divide-y divide-border">
              {data.journals.map((journal) => (
                <li key={journal.id}>
                  <Link
                    href={selectionHref(
                      journal.id,
                      query,
                      selectedStatus,
                    )}
                    aria-current={
                      selectedJournal?.id === journal.id ? "page" : undefined
                    }
                    className={cn(
                      "block px-4 py-4 transition-colors duration-[var(--m-fast)] hover:bg-surface-muted sm:px-5",
                      selectedJournal?.id === journal.id &&
                        "border-l-2 border-brand-600 bg-brand-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {journal.nama}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-4 text-muted">
                          {journal.nis ?? "NIS belum tersedia"} ·{" "}
                          {formatJournalDate(journal.tanggal)}
                        </p>
                      </div>
                      <JurnalBadge status={journal.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-[18px] text-ink-soft">
                      {journal.kegiatan}
                    </p>
                    {journal.perusahaan ? (
                      <p className="mt-1 text-[12px] leading-4 text-muted">
                        {journal.perusahaan}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="detail-title"
            className="min-w-0 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
          >
            {selectedJournal ? (
              <div>
                <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] leading-[18px] text-muted">
                      {formatJournalDate(selectedJournal.tanggal)} ·{" "}
                      {selectedJournal.nis ?? "NIS belum tersedia"}
                    </p>
                    <h2
                      id="detail-title"
                      className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
                    >
                      {selectedJournal.nama}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {selectedJournal.perusahaan ?? "Perusahaan belum tersedia"}
                    </p>
                  </div>
                  <JurnalBadge status={selectedJournal.status} />
                </header>

                <div className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.75fr)]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[13px] font-semibold text-ink">
                        Kegiatan
                      </h3>
                      <p className="mt-1 text-base leading-[26px] text-ink-soft">
                        {selectedJournal.kegiatan}
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 rounded-sm bg-surface-muted p-3">
                      <div>
                        <dt className="text-[12px] leading-4 text-muted">
                          Kehadiran
                        </dt>
                        <dd className="mt-1 text-sm font-medium capitalize text-ink">
                          {selectedJournal.kehadiran}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[12px] leading-4 text-muted">
                          Waktu
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-ink tabular-nums">
                          {selectedJournal.waktuMulai ?? "—"}–
                          {selectedJournal.waktuSelesai ?? "—"}
                        </dd>
                      </div>
                    </dl>
                    {selectedJournal.deskripsi ? (
                      <div>
                        <h3 className="text-[13px] font-semibold text-ink">
                          Deskripsi
                        </h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-[22px] text-ink-soft">
                          {selectedJournal.deskripsi}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="mb-2 text-[13px] font-semibold text-ink">
                      Foto kegiatan
                    </h3>
                    {selectedJournal.fotoUrl ? (
                      <a
                        href={selectedJournal.fotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-sm border border-border bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                        aria-label={`Buka foto jurnal ${selectedJournal.nama} di tab baru`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedJournal.fotoUrl}
                          alt={`Foto kegiatan ${selectedJournal.nama}`}
                          className="max-h-[320px] w-full object-contain"
                        />
                      </a>
                    ) : (
                      <p className="rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-sm leading-[22px] text-warning">
                        Foto jurnal tidak tersedia.
                      </p>
                    )}
                  </div>
                </div>

                <section
                  aria-labelledby="riwayat-verifikasi-title"
                  className="space-y-3 border-t border-border pt-4"
                >
                  <h3
                    id="riwayat-verifikasi-title"
                    className="font-semibold text-ink"
                  >
                    Riwayat verifikasi
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-sm border border-border p-3">
                      <p className="text-[12px] leading-4 text-muted">
                        Guru pembimbing
                      </p>
                      <div className="mt-2">
                        {selectedJournal.guruVerification ? (
                          <DokumenBadge
                            status={selectedJournal.guruVerification.status}
                          />
                        ) : (
                          <p className="text-sm text-muted">
                            Belum diverifikasi.
                          </p>
                        )}
                      </div>
                      {selectedJournal.guruVerification?.catatan ? (
                        <p className="mt-2 text-[13px] leading-[18px] text-ink-soft">
                          {selectedJournal.guruVerification.catatan}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-sm border border-border p-3">
                      <p className="text-[12px] leading-4 text-muted">
                        Instruktur
                      </p>
                      <div className="mt-2">
                        {selectedJournal.instrukturVerification ? (
                          <DokumenBadge
                            status={
                              selectedJournal.instrukturVerification.status
                            }
                          />
                        ) : (
                          <p className="text-sm text-muted">
                            Belum diverifikasi.
                          </p>
                        )}
                      </div>
                      {selectedJournal.instrukturVerification?.catatan ? (
                        <p className="mt-2 text-[13px] leading-[18px] text-ink-soft">
                          {selectedJournal.instrukturVerification.catatan}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <VerificationPanel
                    jurnalId={selectedJournal.id}
                    canVerify={selectedJournal.canVerify}
                    existingNote={
                      selectedJournal.instrukturVerification?.catatan ?? null
                    }
                    unavailableMessage={selectedJournal.unavailableMessage}
                    unavailableTone={
                      selectedJournal.status === "terverifikasi_instruktur"
                        ? "success"
                        : "warning"
                    }
                    approveDescription="Pastikan kegiatan dan foto sudah sesuai. Jurnal yang disetujui instruktur menjadi final."
                    verifierName={profile.nama_lengkap}
                    action={verifyInstrukturJurnalAction}
                  />
                </section>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="Pilih jurnal"
                description="Pilih jurnal pada antrean untuk melihat foto, catatan guru, dan pilihan verifikasi."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
