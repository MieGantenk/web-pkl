import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

export type PeriodeChipOption = {
  id: string;
  nama: string;
  count: number;
};

export function PeriodeChips({
  options,
  selected,
  hrefFor,
}: {
  options: PeriodeChipOption[];
  selected: string;
  hrefFor: (periodeId: string) => string;
}) {
  if (!options.length) {
    return null;
  }

  return (
    <nav aria-label="Filter periode PKL" className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[13px] font-medium leading-[18px] text-muted">
          <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
          Periode PKL
        </span>

        <Link
          href={hrefFor("")}
          aria-current={!selected ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-3 text-[13px] font-medium transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100",
            !selected
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : "border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink",
          )}
        >
          Semua periode
        </Link>

        {options.map((option) => {
          const active = selected === option.id;

          return (
            <Link
              key={option.id}
              href={hrefFor(option.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100",
                active
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong hover:text-ink",
              )}
            >
              <span className="min-w-0 truncate">{option.nama}</span>
              <span
                className={cn(
                  "shrink-0 tabular-nums text-[12px]",
                  active ? "text-brand-700" : "text-muted",
                )}
              >
                {option.count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
