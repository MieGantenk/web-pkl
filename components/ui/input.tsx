import type * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-ink shadow-xs transition-[border-color,box-shadow] duration-[var(--m-fast)] ease-[var(--ease-out)] placeholder:text-disabled hover:border-brand-600 focus:border-brand-500 focus:ring-3 focus:ring-brand-100 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger-bg sm:h-11",
        className,
      )}
      {...props}
    />
  );
}
