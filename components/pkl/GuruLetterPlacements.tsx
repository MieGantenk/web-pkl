import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  Users,
} from "lucide-react";

import { PengajuanBadge, SuratBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import type { GuruSuratPlacement } from "@/lib/data/guru-surat";

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMMM yyyy", { locale: localeId })
    : "—";
}

export function GuruLetterPlacements({
  placements,
  letterLabel,
  missingHint,
}: {
  placements: GuruSuratPlacement[];
  letterLabel: string;
  missingHint: string;
}) {
  return (
    <div className="grid gap-4">
      {placements.map((placement) => (
        <article key={placement.pengajuanId} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Tempat PKL
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold leading-7 text-ink">
                {placement.perusahaan?.nama ?? "Tempat PKL belum ditetapkan"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {[placement.perusahaan?.kota, placement.periode?.nama]
                  .filter(Boolean)
                  .join(" · ") || "Menunggu penempatan dari sekolah"}
              </p>
            </div>
            <PengajuanBadge status={placement.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <CalendarDays
                className="size-4 text-muted"
                strokeWidth={1.75}
                aria-hidden
              />
              {formatDate(placement.tanggalMulai)} –{" "}
              {formatDate(placement.tanggalSelesai)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users
                className="size-4 text-muted"
                strokeWidth={1.75}
                aria-hidden
              />
              {placement.students.length} siswa
            </span>
          </div>

          <div className="mt-4 rounded-sm bg-surface-muted p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Siswa
            </p>
            <ul className="mt-2 space-y-1.5">
              {placement.students.map((student) => {
                const meta =
                  [student.kelas, student.jurusan?.nama]
                    .filter(Boolean)
                    .join(" · ") || "—";

                return (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-baseline gap-x-2 text-sm"
                  >
                    <span className="font-medium text-ink">{student.nama}</span>
                    <span className="text-muted tabular-nums">
                      {student.nis} · {meta}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-medium leading-[18px] text-muted">
                  {letterLabel}
                </p>
                {placement.letter ? (
                  <SuratBadge status={placement.letter.status} />
                ) : null}
              </div>

              {placement.letter ? (
                <p className="mt-1 text-sm text-ink-soft">
                  <span className="font-medium text-ink tabular-nums">
                    {placement.letter.nomor ?? "Nomor belum tersedia"}
                  </span>{" "}
                  <span className="text-border-strong" aria-hidden>
                    ·
                  </span>{" "}
                  {formatDate(placement.letter.tanggalTerbit)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  Belum diterbitkan oleh sekolah.
                </p>
              )}
            </div>

            {placement.letter ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/api/surat/${placement.letter.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <Eye className="size-4" strokeWidth={1.75} aria-hidden />
                  Lihat
                </Link>
                <Link
                  href={`/api/surat/${placement.letter.id}/pdf?download=1`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  <Download
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  Unduh
                </Link>
              </div>
            ) : (
              <p className="flex items-start gap-2 text-[13px] leading-[18px] text-muted">
                <FileText
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {missingHint}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
