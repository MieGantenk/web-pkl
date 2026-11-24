import Link from "next/link";

import { cn } from "@/lib/utils";

export function MutabaahTabs({
  active,
}: {
  active: "riwayat" | "pertanyaan";
}) {
  return (
    <nav
      aria-label="Bagian mutaba'ah"
      className="mb-6 flex flex-wrap gap-1 border-b border-border"
    >
      <Link
        href="/admin/mutabaah"
        aria-current={active === "riwayat" ? "page" : undefined}
        className={cn(
          "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-[var(--m-fast)]",
          active === "riwayat"
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted hover:text-ink",
        )}
      >
        Riwayat
      </Link>
      <Link
        href="/admin/mutabaah/pertanyaan"
        aria-current={active === "pertanyaan" ? "page" : undefined}
        className={cn(
          "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-[var(--m-fast)]",
          active === "pertanyaan"
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted hover:text-ink",
        )}
      >
        Pertanyaan
      </Link>
    </nav>
  );
}
