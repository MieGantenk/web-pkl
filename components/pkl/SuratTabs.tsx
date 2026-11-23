import Link from "next/link";

import { cn } from "@/lib/utils";

export function SuratTabs({ active }: { active: "sekolah" | "siswa" }) {
  return (
    <nav
      aria-label="Bagian surat"
      className="mb-6 flex flex-wrap gap-1 border-b border-border"
    >
      <Link
        href="/admin/surat"
        aria-current={active === "sekolah" ? "page" : undefined}
        className={cn(
          "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-[var(--m-fast)]",
          active === "sekolah"
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted hover:text-ink",
        )}
      >
        Surat Sekolah
      </Link>
      <Link
        href="/admin/surat/siswa"
        aria-current={active === "siswa" ? "page" : undefined}
        className={cn(
          "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-[var(--m-fast)]",
          active === "siswa"
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted hover:text-ink",
        )}
      >
        Surat dari Siswa
      </Link>
    </nav>
  );
}
