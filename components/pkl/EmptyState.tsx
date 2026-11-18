import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <Icon className="size-8 text-muted" strokeWidth={1.75} aria-hidden />
      <div>
        <p className="text-xl font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-[52ch] text-base text-ink-soft">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
