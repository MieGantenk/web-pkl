import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Check, CircleDashed } from "lucide-react";

import { StatusBadge } from "@/components/pkl/StatusBadge";
import type {
  MutabaahAnswer,
  MutabaahHistoryDay,
} from "@/lib/data/siswa-mutabaah";

function formatAnswer(answer: MutabaahAnswer) {
  if (answer.jawabanBoolean !== null) {
    return answer.jawabanBoolean ? "Ya" : "Tidak";
  }

  if (answer.jawabanAngka !== null) {
    return `${answer.jawabanAngka}${
      answer.satuan ? ` ${answer.satuan}` : ""
    }`;
  }

  if (answer.opsiLabels.length) {
    return answer.opsiLabels.join(", ");
  }

  return answer.jawabanTeks ?? "—";
}

export function MutabaahHistory({
  history,
}: {
  history: MutabaahHistoryDay[];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
      <ul className="divide-y divide-border">
        {history.map((day) => {
          const entry = day.entry;

          return (
            <li key={day.tanggal} className="px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-medium text-ink">
                    {format(parseISO(day.tanggal), "EEEE, d MMMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                    {entry
                      ? entry.answers.length
                        ? `${entry.answers.length} jawaban tersimpan`
                        : "Tersimpan tanpa jawaban"
                      : "Belum diisi"}
                  </p>
                </div>
                <StatusBadge
                  label={entry ? "Terisi" : "Belum diisi"}
                  tone={entry ? "success" : "neutral"}
                  icon={entry ? Check : CircleDashed}
                />
              </div>

              {entry?.answers.length ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline">
                    Lihat jawaban
                  </summary>
                  <dl className="mt-3 space-y-2.5">
                    {entry.answers.map((answer) => (
                      <div key={answer.pertanyaanId}>
                        <dt className="text-[13px] font-medium leading-[18px] text-muted">
                          {answer.label}
                        </dt>
                        <dd className="mt-0.5 text-sm leading-[22px] text-ink">
                          {formatAnswer(answer)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
