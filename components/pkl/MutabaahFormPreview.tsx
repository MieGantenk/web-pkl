import {
  Archive,
  Check,
  FileText,
} from "lucide-react";

import { MutabaahFormActions } from "@/components/pkl/MutabaahFormActions";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import type { AdminMutabaahFormDetail } from "@/lib/data/admin-mutabaah";
import type { TipePertanyaan } from "@/lib/data/siswa-mutabaah";

const tipeLabel: Record<TipePertanyaan, string> = {
  ya_tidak: "Ya / Tidak",
  pilih_satu: "Pilih satu",
  pilih_banyak: "Pilih banyak",
  isian_singkat: "Isian singkat",
  isian_angka: "Isian angka",
  essay: "Essay",
};

const statusMeta = {
  draft: { label: "Draft", tone: "neutral" as const, icon: FileText },
  aktif: { label: "Aktif", tone: "success" as const, icon: Check },
  arsip: { label: "Arsip", tone: "neutral" as const, icon: Archive },
};

export function MutabaahFormPreview({
  form,
}: {
  form: AdminMutabaahFormDetail;
}) {
  const meta = statusMeta[form.status];

  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Form mutaba&apos;ah
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink">
            {form.nama}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Versi {form.versi} · {form.periode?.nama ?? "Tanpa periode"} ·{" "}
            {form.questionCount} pertanyaan
          </p>
        </div>
        <StatusBadge label={meta.label} tone={meta.tone} icon={meta.icon} />
      </div>

      {form.deskripsi ? (
        <p className="mt-3 max-w-[68ch] text-sm leading-[22px] text-muted">
          {form.deskripsi}
        </p>
      ) : null}

      {form.hasAnswers ? (
        <p className="mt-4 rounded-sm border border-border bg-surface-muted px-3 py-2 text-[13px] leading-[18px] text-muted">
          Form ini sudah memiliki jawaban siswa. Untuk mengubah pertanyaan,
          buat versi baru.
        </p>
      ) : null}

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="text-xl font-semibold text-ink">Pertanyaan</h3>

        {form.questions.length ? (
          <ol className="mt-3 space-y-3">
            {form.questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-sm border border-border bg-surface-muted/40 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {index + 1}. {question.pertanyaan}
                  </p>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {question.wajib ? "Wajib" : "Opsional"}
                  </span>
                </div>

                <p className="mt-1 text-[13px] leading-[18px] text-muted">
                  {tipeLabel[question.tipe]}
                  {question.tipe === "isian_angka" &&
                  (question.minAngka !== null ||
                    question.maxAngka !== null ||
                    question.satuan) ? (
                    <>
                      {" · "}
                      {question.minAngka ?? "—"}–{question.maxAngka ?? "—"}
                      {question.satuan ? ` ${question.satuan}` : ""}
                    </>
                  ) : null}
                </p>

                {question.options.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {question.options.map((option) => (
                      <li
                        key={option.id}
                        className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-ink-soft"
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">Belum ada pertanyaan.</p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <MutabaahFormActions
          formId={form.id}
          formName={form.nama}
          status={form.status}
        />
      </div>
    </article>
  );
}
