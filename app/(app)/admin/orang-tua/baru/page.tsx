import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { OrangTuaForm } from "@/components/pkl/OrangTuaForm";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSiswaOptions } from "@/lib/data/master";
import type { CreateOrangTuaInput } from "@/lib/validators/orang-tua";

export const metadata: Metadata = {
  title: "Tambah orang tua",
};

export const instant = false;

export default async function AdminOrangTuaBaruPage() {
  await requireRole("admin");

  const siswaOptions = (await getSiswaOptions()).filter(
    (siswa) => siswa.aktif,
  );
  const defaultValues: CreateOrangTuaInput = {
    nama_lengkap: "",
    username: "",
    email: "",
    telepon: "",
    password: "",
    siswa_id: "",
    hubungan: "wali",
  };

  return (
    <div>
      <Link
        href="/admin/orang-tua"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data orang tua
      </Link>

      <header className="mt-3">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Data master
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Tambah orang tua
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Buat akun dan hubungkan orang tua ke anaknya.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
        {siswaOptions.length ? (
          <OrangTuaForm
            siswaOptions={siswaOptions}
            defaultValues={defaultValues}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Belum ada siswa aktif"
            description="Tambahkan dan aktifkan siswa terlebih dahulu sebelum membuat akun orang tua."
            action={
              <Link
                href="/admin/siswa/baru"
                prefetch={false}
                className={buttonVariants({ variant: "primary" })}
              >
                Tambah siswa
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
