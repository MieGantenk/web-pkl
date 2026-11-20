import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { InstrukturForm } from "@/components/pkl/InstrukturForm";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getPerusahaanOptions } from "@/lib/data/master";
import type { CreateInstrukturInput } from "@/lib/validators/instruktur";

export const metadata: Metadata = {
  title: "Tambah instruktur",
};

export const instant = false;

export default async function AdminInstrukturBaruPage() {
  await requireRole("admin");

  const perusahaanOptions = (await getPerusahaanOptions()).filter(
    (perusahaan) => perusahaan.aktif,
  );
  const defaultValues: CreateInstrukturInput = {
    nama_lengkap: "",
    username: "",
    email: "",
    telepon: "",
    password: "",
    perusahaan_id: perusahaanOptions[0]?.id ?? "",
    peran: "instruktur",
    jabatan: "",
    telepon_instruktur: "",
  };

  return (
    <div>
      <Link
        href="/admin/instruktur"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data instruktur
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Data master
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Tambah instruktur
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Buat akun dan hubungkan instruktur ke perusahaan mitra.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        {perusahaanOptions.length ? (
          <InstrukturForm
            perusahaanOptions={perusahaanOptions}
            defaultValues={defaultValues}
          />
        ) : (
          <EmptyState
            icon={Building2}
            title="Belum ada perusahaan aktif"
            description="Tambahkan dan aktifkan perusahaan terlebih dahulu sebelum membuat akun instruktur."
            action={
              <Link
                href="/admin/perusahaan/baru"
                prefetch={false}
                className={buttonVariants({ variant: "primary" })}
              >
                Tambah perusahaan
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
