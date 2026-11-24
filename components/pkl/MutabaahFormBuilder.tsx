"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import {
  publishFormAction,
  updateFormDraftAction,
} from "@/lib/actions/admin-mutabaah";
import type {
  AdminMutabaahFormDetail,
  AdminMutabaahPeriod,
} from "@/lib/data/admin-mutabaah";
import type { TipePertanyaan } from "@/lib/data/siswa-mutabaah";

const tipeOptions: Array<{ value: TipePertanyaan; label: string }> = [
  { value: "ya_tidak", label: "Ya / Tidak" },
  { value: "pilih_satu", label: "Pilih satu" },
  { value: "pilih_banyak", label: "Pilih banyak" },
  { value: "isian_singkat", label: "Isian singkat" },
  { value: "isian_angka", label: "Isian angka" },
  { value: "essay", label: "Essay" },
];

const choiceTypes = new Set<TipePertanyaan>(["pilih_satu", "pilih_banyak"]);

type OptionState = {
  key: string;
  label: string;
};

type QuestionState = {
  key: string;
  pertanyaan: string;
  deskripsi: string;
  tipe: TipePertanyaan;
  wajib: boolean;
  minAngka: string;
  maxAngka: string;
  satuan: string;
  options: OptionState[];
};

function newOption(label = ""): OptionState {
  return { key: crypto.randomUUID(), label };
}

function newQuestion(): QuestionState {
  return {
    key: crypto.randomUUID(),
    pertanyaan: "",
    deskripsi: "",
    tipe: "ya_tidak",
    wajib: true,
    minAngka: "",
    maxAngka: "",
    satuan: "",
    options: [],
  };
}

function initialQuestions(form: AdminMutabaahFormDetail): QuestionState[] {
  return form.questions.map((question) => ({
    key: question.id,
    pertanyaan: question.pertanyaan,
    deskripsi: question.deskripsi ?? "",
    tipe: question.tipe,
    wajib: question.wajib,
    minAngka:
      question.minAngka !== null ? String(question.minAngka) : "",
    maxAngka:
      question.maxAngka !== null ? String(question.maxAngka) : "",
    satuan: question.satuan ?? "",
    options: question.options.map((option) => ({
      key: option.id,
      label: option.label,
    })),
  }));
}

export function MutabaahFormBuilder({
  form,
  periods,
}: {
  form: AdminMutabaahFormDetail;
  periods: AdminMutabaahPeriod[];
}) {
  const router = useRouter();
  const [nama, setNama] = useState(form.nama);
  const [deskripsi, setDeskripsi] = useState(form.deskripsi ?? "");
  const [periodeId, setPeriodeId] = useState(form.periode?.id ?? "");
  const [questions, setQuestions] = useState<QuestionState[]>(() =>
    initialQuestions(form),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);

  function patchQuestion(key: string, patch: Partial<QuestionState>) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, ...patch } : question,
      ),
    );
  }

  function changeType(key: string, tipe: TipePertanyaan) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.key !== key) return question;

        const choice = choiceTypes.has(tipe);

        return {
          ...question,
          tipe,
          minAngka: tipe === "isian_angka" ? question.minAngka : "",
          maxAngka: tipe === "isian_angka" ? question.maxAngka : "",
          satuan: tipe === "isian_angka" ? question.satuan : "",
          options:
            choice && question.options.length === 0
              ? [newOption()]
              : question.options,
        };
      }),
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function buildPayload() {
    setError(null);

    if (!nama.trim()) {
      setError("Nama form wajib diisi.");
      return null;
    }

    if (!periodeId) {
      setError("Pilih periode PKL.");
      return null;
    }

    if (!questions.length) {
      setError("Tambahkan minimal satu pertanyaan.");
      return null;
    }

    const payloadQuestions = [];

    for (const [index, question] of questions.entries()) {
      if (!question.pertanyaan.trim()) {
        setError(`Pertanyaan ${index + 1} belum diisi.`);
        return null;
      }

      const choice = choiceTypes.has(question.tipe);
      const options = question.options.filter((option) =>
        option.label.trim(),
      );

      if (choice && options.length === 0) {
        setError(`Pertanyaan ${index + 1} belum punya opsi.`);
        return null;
      }

      const min = question.minAngka.trim()
        ? Number(question.minAngka)
        : null;
      const max = question.maxAngka.trim()
        ? Number(question.maxAngka)
        : null;

      if (
        question.tipe === "isian_angka" &&
        ((min !== null && !Number.isFinite(min)) ||
          (max !== null && !Number.isFinite(max)))
      ) {
        setError(`Angka pada pertanyaan ${index + 1} tidak valid.`);
        return null;
      }

      if (min !== null && max !== null && min > max) {
        setError(
          `Angka maksimal pertanyaan ${index + 1} harus lebih besar dari minimal.`,
        );
        return null;
      }

      payloadQuestions.push({
        pertanyaan: question.pertanyaan,
        deskripsi: question.deskripsi,
        tipe: question.tipe,
        wajib: question.wajib,
        min_angka: question.tipe === "isian_angka" ? min : null,
        max_angka: question.tipe === "isian_angka" ? max : null,
        satuan: question.tipe === "isian_angka" ? question.satuan : "",
        options: choice
          ? options.map((option) => ({ label: option.label }))
          : [],
      });
    }

    return {
      nama,
      deskripsi,
      periode_id: periodeId,
      questions: payloadQuestions,
    };
  }

  async function submit(mode: "save" | "publish") {
    const payload = buildPayload();

    if (!payload) return;

    setBusy(mode);

    try {
      const saved = await updateFormDraftAction(form.id, payload);

      if (!saved.ok) {
        setError(saved.message);
        toast.error(saved.message);
        return;
      }

      if (mode === "publish") {
        const published = await publishFormAction(form.id);

        if (!published.ok) {
          setError(published.message);
          toast.error(published.message);
          return;
        }

        toast.success("Form mutaba'ah dipublikasikan.");
      } else {
        toast.success("Draft mutaba'ah disimpan.");
      }

      router.refresh();
    } catch {
      setError("Form belum dapat disimpan. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit("save");
      }}
      className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Form mutaba&apos;ah
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink">
            {form.nama}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Versi {form.versi} · {form.periode?.nama ?? "Tanpa periode"}
          </p>
        </div>
        <StatusBadge label="Draft" tone="neutral" icon={FileText} />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Nama form" htmlFor="builder-nama" required>
          <Input
            id="builder-nama"
            value={nama}
            maxLength={150}
            onChange={(event) => setNama(event.target.value)}
          />
        </Field>

        <Field label="Periode PKL" htmlFor="builder-periode" required>
          <Select
            id="builder-periode"
            value={periodeId}
            onChange={(event) => setPeriodeId(event.target.value)}
          >
            <option value="">Pilih periode</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nama}
                {period.aktif ? " · aktif" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Deskripsi" htmlFor="builder-deskripsi">
          <Textarea
            id="builder-deskripsi"
            rows={3}
            value={deskripsi}
            maxLength={2000}
            onChange={(event) => setDeskripsi(event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-ink">Pertanyaan</h3>
            <p className="mt-1 text-sm text-muted">
              {questions.length} pertanyaan pada draft ini.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setQuestions((current) => [...current, newQuestion()])}
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Tambah pertanyaan
          </Button>
        </div>

        {questions.length === 0 ? (
          <p className="mt-4 rounded-sm border border-dashed border-border-strong bg-surface-muted px-4 py-5 text-sm text-muted">
            Belum ada pertanyaan. Tambahkan pertanyaan pertama.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {questions.map((question, index) => {
              const choice = choiceTypes.has(question.tipe);

              return (
                <fieldset
                  key={question.key}
                  className="min-w-0 rounded-md border border-border bg-surface-muted/40 p-4"
                >
                  <legend className="sr-only">
                    Pertanyaan {index + 1}
                  </legend>

                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Pertanyaan {index + 1}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Naikkan pertanyaan ${index + 1}`}
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, -1)}
                      >
                        <ArrowUp
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Turunkan pertanyaan ${index + 1}`}
                        disabled={index === questions.length - 1}
                        onClick={() => moveQuestion(index, 1)}
                      >
                        <ArrowDown
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus pertanyaan ${index + 1}`}
                        className="text-danger hover:bg-danger-bg hover:text-danger"
                        onClick={() =>
                          setQuestions((current) =>
                            current.filter(
                              (item) => item.key !== question.key,
                            ),
                          )
                        }
                      >
                        <Trash2
                          className="size-4"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-4">
                    <Field
                      label="Pertanyaan"
                      htmlFor={`q-${question.key}`}
                      required
                    >
                      <Input
                        id={`q-${question.key}`}
                        value={question.pertanyaan}
                        maxLength={255}
                        placeholder="Contoh: Shalat subuh berjamaah"
                        onChange={(event) =>
                          patchQuestion(question.key, {
                            pertanyaan: event.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field
                      label="Petunjuk"
                      htmlFor={`q-desc-${question.key}`}
                      hint="Opsional. Tampil sebagai petunjuk untuk siswa."
                    >
                      <Input
                        id={`q-desc-${question.key}`}
                        value={question.deskripsi}
                        maxLength={2000}
                        onChange={(event) =>
                          patchQuestion(question.key, {
                            deskripsi: event.target.value,
                          })
                        }
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Tipe jawaban"
                        htmlFor={`q-tipe-${question.key}`}
                        required
                      >
                        <Select
                          id={`q-tipe-${question.key}`}
                          value={question.tipe}
                          onChange={(event) =>
                            changeType(
                              question.key,
                              event.target.value as TipePertanyaan,
                            )
                          }
                        >
                          {tipeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <label className="flex min-h-11 items-center gap-2.5 self-end text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={question.wajib}
                          onChange={(event) =>
                            patchQuestion(question.key, {
                              wajib: event.target.checked,
                            })
                          }
                          className="size-4 accent-brand-600"
                        />
                        Wajib diisi
                      </label>
                    </div>

                    {question.tipe === "isian_angka" ? (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field
                          label="Minimal"
                          htmlFor={`q-min-${question.key}`}
                        >
                          <Input
                            id={`q-min-${question.key}`}
                            type="number"
                            step="any"
                            value={question.minAngka}
                            onChange={(event) =>
                              patchQuestion(question.key, {
                                minAngka: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field
                          label="Maksimal"
                          htmlFor={`q-max-${question.key}`}
                        >
                          <Input
                            id={`q-max-${question.key}`}
                            type="number"
                            step="any"
                            value={question.maxAngka}
                            onChange={(event) =>
                              patchQuestion(question.key, {
                                maxAngka: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field
                          label="Satuan"
                          htmlFor={`q-satuan-${question.key}`}
                          hint="Contoh: halaman, menit"
                        >
                          <Input
                            id={`q-satuan-${question.key}`}
                            value={question.satuan}
                            maxLength={30}
                            onChange={(event) =>
                              patchQuestion(question.key, {
                                satuan: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                    ) : null}

                    {choice ? (
                      <div className="rounded-sm border border-border bg-surface p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-semibold text-ink">
                            Opsi jawaban
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              patchQuestion(question.key, {
                                options: [
                                  ...question.options,
                                  newOption(),
                                ],
                              })
                            }
                          >
                            <Plus
                              className="size-4"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            Opsi
                          </Button>
                        </div>

                        {question.options.length ? (
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={option.key}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={option.label}
                                  maxLength={150}
                                  aria-label={`Opsi ${optionIndex + 1} untuk pertanyaan ${index + 1}`}
                                  placeholder={`Opsi ${optionIndex + 1}`}
                                  onChange={(event) =>
                                    patchQuestion(question.key, {
                                      options: question.options.map(
                                        (item) =>
                                          item.key === option.key
                                            ? {
                                                ...item,
                                                label: event.target.value,
                                              }
                                            : item,
                                      ),
                                    })
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Hapus opsi ${optionIndex + 1}`}
                                  className="text-danger hover:bg-danger-bg hover:text-danger"
                                  onClick={() =>
                                    patchQuestion(question.key, {
                                      options: question.options.filter(
                                        (item) => item.key !== option.key,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2
                                    className="size-4"
                                    strokeWidth={1.75}
                                    aria-hidden
                                  />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-muted">
                            Tambahkan minimal satu opsi.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2 text-sm leading-[22px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex flex-col gap-2 border-t border-border bg-surface px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[13px] leading-[18px] text-muted">
          Draft belum terlihat oleh siswa.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="submit"
            variant="secondary"
            loading={busy === "save"}
            disabled={busy !== null}
          >
            Simpan draft
          </Button>
          <Button
            type="button"
            loading={busy === "publish"}
            disabled={busy !== null}
            onClick={() => void submit("publish")}
          >
            Publikasikan
          </Button>
        </div>
      </div>
    </form>
  );
}
