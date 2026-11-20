import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PeriodeForm } from "@/components/pkl/PeriodeForm";
import { requireRole } from "@/lib/auth";
import type { PeriodeFormInput } from "@/lib/validators/periode";

export const metadata: Metadata = {
  title: "Tambah periode",
};

export const instant = false;

const emptyValues: PeriodeFormInput = {
  nama: "",
  tahun_ajaran: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
};

export default async function AdminPeriodeBaruPage() {
  await requireRole("admin");

  return (
    <div>
      <Link
        href="/admin/periode"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke periode PKL
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Data master
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Tambah periode
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Tentukan nama, tahun ajaran, dan rentang tanggal PKL.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        <PeriodeForm mode="create" defaultValues={emptyValues} />
      </section>
    </div>
  );
}
