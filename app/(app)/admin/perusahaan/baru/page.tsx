import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PerusahaanForm } from "@/components/pkl/PerusahaanForm";
import { requireRole } from "@/lib/auth";
import type { PerusahaanFormInput } from "@/lib/validators/perusahaan";

export const metadata: Metadata = {
  title: "Tambah perusahaan",
};

export const instant = false;

const emptyValues: PerusahaanFormInput = {
  nama: "",
  alamat: "",
  kota: "",
  telepon: "",
  email: "",
  website: "",
};

export default async function AdminPerusahaanBaruPage() {
  await requireRole("admin");

  return (
    <div>
      <Link
        href="/admin/perusahaan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data perusahaan
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Data master
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Tambah perusahaan
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Simpan data tempat PKL agar bisa dipilih siswa saat mengajukan.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        <PerusahaanForm mode="create" defaultValues={emptyValues} />
      </section>
    </div>
  );
}
