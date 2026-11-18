import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-xs">
        <FileQuestion
          className="size-8 text-muted"
          strokeWidth={1.75}
          aria-hidden
        />
        <h1 className="mt-3 text-xl font-semibold text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-base leading-[26px] text-ink-soft">
          Tautan yang Anda buka belum tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "secondary" }), "mt-5")}
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
