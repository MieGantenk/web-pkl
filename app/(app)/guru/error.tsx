"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GuruError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-xs">
        <CircleAlert
          className="size-8 text-danger"
          strokeWidth={1.75}
          aria-hidden
        />
        <h1 className="mt-3 text-xl font-semibold text-ink">
          Data guru belum dapat dimuat
        </h1>
        <p className="mt-2 text-base leading-[26px] text-ink-soft">
          Periksa koneksi Anda, lalu coba lagi. Jika masih gagal, hubungi admin
          sekolah.
        </p>
        <Button onClick={reset} className="mt-5 w-full sm:w-auto">
          Coba lagi
        </Button>
      </div>
    </div>
  );
}
