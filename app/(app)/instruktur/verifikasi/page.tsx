import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Building2, ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { JurnalBadge } from "@/components/pkl/StatusBadge";
import { VerificationPanel } from "@/components/pkl/VerificationPanel";
import { verifyInstrukturJurnalAction } from "@/lib/actions/instruktur-verifikasi";
import { requireRole } from "@/lib/auth";
import { getInstrukturVerificationQueue } from "@/lib/data/instruktur";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi Jurnal",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

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

type InstrukturVerificationPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function InstrukturVerificationPage({
  searchParams,
}: InstrukturVerificationPageProps) {
  const profile = await requireRole("instruktur");
  const params = await searchParams;
  const selectedId =
    typeof params.jurnal === "string" ? params.jurnal : undefined;
  const data = await getInstrukturVerificationQueue(profile.id, selectedId);

  if (!data.context.companies.length) {
    return (
      <section className={card}>
        <EmptyState
          icon={Building2}
          title="Belum ada penugasan perusahaan"
          description="Akun ini belum ditugaskan ke perusahaan. Hubungi admin sekolah agar Anda dapat memverifikasi jurnal siswa."
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
            Instruktur Perusahaan
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Verifikasi Jurnal
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Verifikasi langkah 2. Jurnal yang sudah disetujui guru pembimbing
            dapat Anda setujui atau minta revisi.
          </p>
        </div>

        <p className="text-sm text-muted lg:text-right">
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {data.pending}
          </span>{" "}
          menunggu
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-ink">Antrean</h2>
            <span className="text-[13px] text-muted tabular-nums">
              {data.journals.length} jurnal
            </span>
          </div>

          {data.journals.length ? (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
              {data.journals.map((journal) => {
                const active = journal.id === selected?.id;

                return (
                  <li key={journal.id}>
                    <Link
                      href={`/instruktur/verifikasi?jurnal=${journal.id}`}
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
                description="Jurnal siswa perusahaan akan muncul di sini setelah diisi."
              />
            </div>
          )}
        </aside>

        <section>
          {!selected ? (
            <div className={card}>
              <EmptyState
                icon={ClipboardCheck}
                title="Tidak ada jurnal untuk diverifikasi"
                description="Pilih jurnal dari antrean atau tunggu guru pembimbing menyetujui jurnal siswa."
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
                    {selected.kelas ?? "—"} · {formatDay(selected.tanggal)}
                    {formatTime(selected.waktuMulai) &&
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
                ) : (
                  <p className="mt-4 text-sm text-muted">
                    Foto jurnal tidak tersedia.
                  </p>
                )}
              </div>

              {selected.guruVerification?.catatan ? (
                <div className="mt-5 rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-sm leading-[22px] text-ink-soft">
                  <span className="font-semibold text-ink">Catatan guru:</span>{" "}
                  {selected.guruVerification.catatan}
                </div>
              ) : null}

              <div className="mt-5 border-t border-border pt-4">
                <VerificationPanel
                  key={selected.id}
                  jurnalId={selected.id}
                  canVerify={selected.canVerify}
                  existingNote={
                    selected.instrukturVerification?.catatan ?? null
                  }
                  unavailableMessage={selected.unavailableMessage}
                  action={verifyInstrukturJurnalAction}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
