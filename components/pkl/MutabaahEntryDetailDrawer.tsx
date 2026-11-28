"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { X } from "lucide-react";

import { MutabaahAnswerReview } from "@/components/pkl/MutabaahAnswerReview";
import type { AdminMutabaahEntryDetail } from "@/lib/data/admin-mutabaah-history";

function formatDate(value: string) {
  return format(parseISO(value), "EEEE, d MMMM yyyy", { locale: localeId });
}

export function MutabaahEntryDetailDrawer({
  entry,
  closeHref,
}: {
  entry: AdminMutabaahEntryDetail;
  closeHref: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    const previousBodyOverflow = document.body.style.overflow;

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  function closeDetail() {
    router.push(closeHref, { scroll: false });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="mutabaah-entry-drawer-title"
      className="app-detail-drawer"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDetail();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        closeDetail();
      }}
    >
      <div className="flex h-full flex-col border-l border-border bg-surface text-ink shadow-md">
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[13px] text-muted">
              {formatDate(entry.tanggal)}
            </p>
            <h2
              id="mutabaah-entry-drawer-title"
              className="mt-1 font-display text-xl font-semibold leading-7 tracking-[-0.02em] text-ink"
            >
              {entry.form.nama} · v{entry.form.versi}
            </h2>
            <p className="mt-1 text-sm leading-5 text-ink-soft">
              {entry.siswa.nama} · NIS {entry.siswa.nis}
              {entry.siswa.kelas ? ` · ${entry.siswa.kelas}` : ""}
            </p>
            {entry.form.deskripsi ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted">
                {entry.form.deskripsi}
              </p>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDetail}
            aria-label="Tutup detail jawaban"
            className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {entry.catatan ? (
            <p className="mb-4 whitespace-pre-wrap rounded-sm bg-surface-muted p-3 text-sm leading-5 text-ink-soft">
              <span className="font-semibold text-ink">Catatan siswa: </span>
              {entry.catatan}
            </p>
          ) : null}

          {entry.questions.length ? (
            <MutabaahAnswerReview
              questions={entry.questions}
              answers={entry.answers}
            />
          ) : (
            <p className="text-sm leading-6 text-muted">
              Form ini tidak memiliki pertanyaan.
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
