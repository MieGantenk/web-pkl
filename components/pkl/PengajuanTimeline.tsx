import { Check } from "lucide-react";

import {
  statusPengajuanStage,
  type StatusPengajuan,
} from "@/lib/status";
import { cn } from "@/lib/utils";

const steps = [
  {
    label: "Pengajuan",
    description: "Tempat PKL dan surat izin",
  },
  {
    label: "Persetujuan",
    description: "Surat balasan dan keberangkatan",
  },
  {
    label: "Pelaksanaan",
    description: "Jurnal dan mutaba'ah",
  },
  {
    label: "Penarikan",
    description: "Surat penarikan dan selesai",
  },
];

export function PengajuanTimeline({
  status,
}: {
  status: StatusPengajuan;
}) {
  const stage = statusPengajuanStage[status];

  if (stage === 0) {
    return null;
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-4 sm:gap-3">
      {steps.map((step, index) => {
        const number = index + 1;
        const done = stage > number || stage === 5;
        const active = !done && stage === number;

        return (
          <li
            key={step.label}
            aria-current={active ? "step" : undefined}
            className="flex items-start gap-3 sm:block"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold",
                done && "border-brand-700 bg-brand-700 text-white",
                active && "border-brand-500 bg-brand-50 text-brand-700",
                !done && !active && "border-border bg-surface text-muted",
              )}
            >
              {done ? (
                <Check className="size-4" strokeWidth={2} aria-hidden />
              ) : (
                number
              )}
            </span>
            <div className="min-w-0 sm:mt-3">
              <p
                className={cn(
                  "text-[13px] font-semibold leading-[18px]",
                  active || done ? "text-ink" : "text-muted",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
