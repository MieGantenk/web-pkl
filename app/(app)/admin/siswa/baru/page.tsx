import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiswaForm } from "@/components/pkl/SiswaForm";
import { requireRole } from "@/lib/auth";
import { getJurusanOptions } from "@/lib/data/admin-siswa";
import type { SiswaFormInput } from "@/lib/validators/siswa";

export const metadata: Metadata = {
  title: "Tambah siswa",
};

export const instant = false;

const emptyValues: SiswaFormInput = {
  nama_lengkap: "",
  username: "",
  email: "",
  nis: "",
  nisn: "",
  kelas: "",
  jurusan_id: "",
  telepon: "",
  alamat: "",
  nama_orangtua: "",
  telepon_orangtua: "",
  password: "",
  confirmPassword: "",
};

export default async function AdminSiswaBaruPage() {
  await requireRole("admin");
  const jurusanOptions = await getJurusanOptions();

  return (
    <div>
      <Link
        href="/admin/siswa"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data siswa
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Data master
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Tambah siswa
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Buat data siswa sekaligus akun untuk masuk ke sistem PKL.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        <SiswaForm
          mode="create"
          jurusanOptions={jurusanOptions}
          defaultValues={emptyValues}
        />
      </section>
    </div>
  );
}
