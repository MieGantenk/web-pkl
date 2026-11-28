import { Check } from "lucide-react";

import type {
  MutabaahAnswer,
  MutabaahQuestion,
} from "@/lib/data/siswa-mutabaah";

function hasAnswer(question: MutabaahQuestion, answer: MutabaahAnswer | undefined) {
  if (!answer) return false;

  if (question.tipe === "ya_tidak") {
    return answer.jawabanBoolean !== null;
  }

  if (question.tipe === "pilih_satu" || question.tipe === "pilih_banyak") {
    return answer.opsiIds.length > 0;
  }

  if (question.tipe === "isian_angka") {
    return answer.jawabanAngka !== null;
  }

  return Boolean(answer.jawabanTeks?.trim());
}

function answerText(
  question: MutabaahQuestion,
  answer: MutabaahAnswer | undefined,
) {
  if (!answer) return "Belum dijawab";

  if (question.tipe === "isian_angka" && answer.jawabanAngka !== null) {
    return `${answer.jawabanAngka}${question.satuan ? ` ${question.satuan}` : ""}`;
  }

  return answer.jawabanTeks?.trim() || "Belum dijawab";
}

export function MutabaahAnswerReview({
  questions,
  answers,
}: {
  questions: MutabaahQuestion[];
  answers: MutabaahAnswer[];
}) {
  const answersByQuestion = new Map(
    answers.map((answer) => [answer.pertanyaanId, answer]),
  );

  return (
    <ol className="space-y-3">
      {questions.map((question, index) => {
        const answer = answersByQuestion.get(question.id);
        const answered = hasAnswer(question, answer);
        const choices =
          question.tipe === "ya_tidak"
            ? [
                { id: "ya", label: "Ya" },
                { id: "tidak", label: "Tidak" },
              ]
            : question.options;
        const isChoice =
          question.tipe === "ya_tidak" ||
          question.tipe === "pilih_satu" ||
          question.tipe === "pilih_banyak";

        return (
          <li
            key={question.id}
            className="rounded-sm border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-5 text-ink">
                  {index + 1}. {question.pertanyaan}
                </h3>
                {question.deskripsi ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted">
                    {question.deskripsi}
                  </p>
                ) : null}
                {question.tipe === "isian_angka" &&
                (question.minAngka !== null ||
                  question.maxAngka !== null) ? (
                  <p className="mt-1 text-xs leading-4 text-muted">
                    {question.minAngka !== null
                      ? `Minimum ${question.minAngka}`
                      : null}
                    {question.minAngka !== null &&
                    question.maxAngka !== null
                      ? " · "
                      : null}
                    {question.maxAngka !== null
                      ? `Maksimum ${question.maxAngka}`
                      : null}
                    {question.satuan ? ` ${question.satuan}` : ""}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {question.wajib ? "Wajib" : "Opsional"}
              </span>
            </div>

            {isChoice ? (
              <>
                {!answered ? (
                  <p className="mt-3 text-sm text-muted">Belum dijawab</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {choices.map((choice) => {
                    const selected =
                      question.tipe === "ya_tidak"
                        ? (choice.id === "ya" &&
                            answer?.jawabanBoolean === true) ||
                          (choice.id === "tidak" &&
                            answer?.jawabanBoolean === false)
                        : answer?.opsiIds.includes(choice.id) ?? false;

                    return (
                      <li
                        key={choice.id}
                        className={`flex min-h-11 items-center justify-between gap-3 rounded-sm border px-3 py-2 text-sm ${
                          selected
                            ? "border-brand-600 bg-brand-50 text-ink"
                            : "border-border bg-surface text-ink-soft"
                        }`}
                      >
                        <span className="min-w-0 break-words">
                          {choice.label}
                        </span>
                        <span
                          className={`flex shrink-0 items-center gap-1 text-xs font-medium ${
                            selected ? "text-brand-700" : "text-muted"
                          }`}
                        >
                          {selected ? (
                            <>
                              <Check
                                className="size-3.5"
                                strokeWidth={2}
                                aria-hidden
                              />
                              Dipilih
                            </>
                          ) : (
                            "Tidak dipilih"
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="mt-3 rounded-sm bg-surface-muted p-3">
                <p className="text-xs font-medium text-muted">Jawaban siswa</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-ink">
                  {answerText(question, answer)}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
