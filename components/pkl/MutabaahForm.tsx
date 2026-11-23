"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { saveMutabaahAction } from "@/lib/actions/mutabaah";
import type {
  MutabaahEntry,
  MutabaahQuestion,
} from "@/lib/data/siswa-mutabaah";
import { cn } from "@/lib/utils";

type AnswerValue = {
  teks: string;
  angka: string;
  boolean: boolean | null;
  opsi: string[];
};

function initialAnswers(
  questions: MutabaahQuestion[],
  entry: MutabaahEntry | null,
) {
  const values: Record<string, AnswerValue> = {};

  for (const question of questions) {
    const answer = entry?.answers.find(
      (item) => item.pertanyaanId === question.id,
    );

    values[question.id] = {
      teks: answer?.jawabanTeks ?? "",
      angka:
        answer?.jawabanAngka !== null && answer?.jawabanAngka !== undefined
          ? String(answer.jawabanAngka)
          : "",
      boolean: answer?.jawabanBoolean ?? null,
      opsi: answer?.opsiIds ?? [],
    };
  }

  return values;
}

function answered(question: MutabaahQuestion, value: AnswerValue) {
  if (question.tipe === "ya_tidak") {
    return value.boolean !== null;
  }

  if (question.tipe === "pilih_satu" || question.tipe === "pilih_banyak") {
    return value.opsi.length > 0;
  }

  if (question.tipe === "isian_angka") {
    return value.angka.trim() !== "" && Number.isFinite(Number(value.angka));
  }

  return value.teks.trim() !== "";
}

function Choice({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors duration-[var(--m-fast)] focus-within:ring-3 focus-within:ring-brand-100",
        checked
          ? "border-brand-600 bg-brand-50 text-ink"
          : "border-border bg-surface text-ink-soft hover:bg-surface-muted",
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-brand-600"
      />
      <span>{children}</span>
    </label>
  );
}

export function MutabaahForm({
  questions,
  todayEntry,
}: {
  questions: MutabaahQuestion[];
  todayEntry: MutabaahEntry | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    initialAnswers(questions, todayEntry),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const filled = questions.filter((question) =>
    answered(question, answers[question.id]),
  ).length;
  const percent = questions.length
    ? Math.round((filled / questions.length) * 100)
    : 0;

  function update(questionId: string, patch: Partial<AnswerValue>) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }));
    setErrors((current) => {
      if (!current[questionId]) return current;
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};

    for (const question of questions) {
      if (question.wajib && !answered(question, answers[question.id])) {
        nextErrors[question.id] = "Pertanyaan ini wajib diisi.";
      }
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.error("Lengkapi pertanyaan wajib terlebih dahulu.");

      const first = questions.find((question) => nextErrors[question.id]);
      if (first) {
        const target =
          document.getElementById(`q-${first.id}`) ??
          document.querySelector<HTMLInputElement>(
            `input[name="q-${first.id}"]`,
          );
        target?.focus();
      }
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const result = await saveMutabaahAction({
        answers: questions.map((question) => {
          const value = answers[question.id];

          return {
            pertanyaan_id: question.id,
            jawaban_teks:
              question.tipe === "isian_singkat" || question.tipe === "essay"
                ? value.teks.trim()
                : null,
            jawaban_angka:
              question.tipe === "isian_angka" && value.angka.trim() !== ""
                ? Number(value.angka)
                : null,
            jawaban_boolean:
              question.tipe === "ya_tidak" ? value.boolean : null,
            opsi_ids:
              question.tipe === "pilih_satu" ||
              question.tipe === "pilih_banyak"
                ? value.opsi
                : [],
          };
        }),
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success(
        todayEntry
          ? "Mutaba'ah hari ini diperbarui."
          : "Mutaba'ah hari ini tersimpan.",
      );
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan mutaba'ah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      noValidate
      className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
            Checklist hari ini
          </h2>
          <p className="mt-1 text-sm text-muted">
            {filled}/{questions.length} pertanyaan terjawab
          </p>
        </div>
        {todayEntry ? (
          <StatusBadge label="Sudah diisi" tone="success" icon={Check} />
        ) : null}
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-[var(--m-base)] ease-[var(--ease-out)]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-5 space-y-4">
        {questions.map((question, index) => {
          const value = answers[question.id];
          const error = errors[question.id];

          return (
            <fieldset
              key={question.id}
              className={cn(
                "min-w-0 rounded-md border p-4 sm:p-5",
                error ? "border-danger-border" : "border-border",
              )}
              aria-label={question.pertanyaan}
              aria-describedby={error ? `q-${question.id}-error` : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-medium text-ink">
                    {index + 1}. {question.pertanyaan}
                  </p>
                  {question.deskripsi ? (
                    <p className="mt-1 text-sm leading-[22px] text-muted">
                      {question.deskripsi}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {question.wajib ? "Wajib" : "Opsional"}
                </span>
              </div>

              <div className="mt-3">
                {question.tipe === "ya_tidak" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Choice
                      type="radio"
                      name={`q-${question.id}`}
                      checked={value.boolean === true}
                      onChange={() => update(question.id, { boolean: true })}
                    >
                      Ya
                    </Choice>
                    <Choice
                      type="radio"
                      name={`q-${question.id}`}
                      checked={value.boolean === false}
                      onChange={() => update(question.id, { boolean: false })}
                    >
                      Tidak
                    </Choice>
                  </div>
                ) : null}

                {question.tipe === "pilih_satu" ? (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <Choice
                        key={option.id}
                        type="radio"
                        name={`q-${question.id}`}
                        checked={value.opsi.includes(option.id)}
                        onChange={() => update(question.id, { opsi: [option.id] })}
                      >
                        {option.label}
                      </Choice>
                    ))}
                  </div>
                ) : null}

                {question.tipe === "pilih_banyak" ? (
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const checked = value.opsi.includes(option.id);

                      return (
                        <Choice
                          key={option.id}
                          type="checkbox"
                          name={`q-${question.id}`}
                          checked={checked}
                          onChange={() =>
                            update(question.id, {
                              opsi: checked
                                ? value.opsi.filter((id) => id !== option.id)
                                : [...value.opsi, option.id],
                            })
                          }
                        >
                          {option.label}
                        </Choice>
                      );
                    })}
                  </div>
                ) : null}

                {question.tipe === "isian_singkat" ? (
                  <Input
                    id={`q-${question.id}`}
                    value={value.teks}
                    maxLength={500}
                    aria-label={question.pertanyaan}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={
                      error ? `q-${question.id}-error` : undefined
                    }
                    onChange={(event) =>
                      update(question.id, { teks: event.target.value })
                    }
                  />
                ) : null}

                {question.tipe === "isian_angka" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id={`q-${question.id}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={question.minAngka ?? undefined}
                      max={question.maxAngka ?? undefined}
                      value={value.angka}
                      aria-label={question.pertanyaan}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={
                        error ? `q-${question.id}-error` : undefined
                      }
                      onChange={(event) =>
                        update(question.id, { angka: event.target.value })
                      }
                    />
                    {question.satuan ? (
                      <span className="shrink-0 text-sm text-muted">
                        {question.satuan}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {question.tipe === "essay" ? (
                  <Textarea
                    id={`q-${question.id}`}
                    rows={3}
                    maxLength={4000}
                    value={value.teks}
                    aria-label={question.pertanyaan}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={
                      error ? `q-${question.id}-error` : undefined
                    }
                    onChange={(event) =>
                      update(question.id, { teks: event.target.value })
                    }
                  />
                ) : null}
              </div>

              {!question.wajib && answered(question, value) ? (
                <button
                  type="button"
                  onClick={() =>
                    update(question.id, {
                      teks: "",
                      angka: "",
                      boolean: null,
                      opsi: [],
                    })
                  }
                  className="mt-2 inline-flex h-9 items-center text-[13px] font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Kosongkan jawaban
                </button>
              ) : null}

              {error ? (
                <p
                  id={`q-${question.id}-error`}
                  role="alert"
                  className="mt-2 text-xs leading-4 text-danger"
                >
                  {error}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-5 flex flex-col-reverse gap-2 border-t border-border bg-surface px-4 py-3 sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
        <p className="text-[13px] leading-[18px] text-muted">
          {todayEntry
            ? "Bisa diperbarui sampai pergantian hari."
            : "Isi sesuai kondisi hari ini."}
        </p>
        <Button
          type="submit"
          loading={saving}
          className="w-full sm:w-auto"
        >
          {todayEntry ? "Simpan perubahan" : "Simpan hari ini"}
        </Button>
      </div>
    </form>
  );
}
