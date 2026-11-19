import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { GuruForm } from "@/components/pkl/GuruForm";
import { GuruStatusButton } from "@/components/pkl/GuruStatusButton";
import { AkunBadge } from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getGuruDetail } from "@/lib/data/admin-guru";
import { getJurusanOptions } from "@/lib/data/master";
import { postgresUuidPattern } from "@/lib/validators/common";
import type { GuruFormInput } from "@/lib/validators/guru";

export const metadata: Metadata = {
  title: "Detail guru",
};

export const instant = false;

export default async function AdminGuruDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;

  if (!postgresUuidPattern.test(id)) {
    notFound();
  }

  const [data, jurusanOptions] = await Promise.all([
    getGuruDetail(id),
    getJurusanOptions(),
  ]);

  if (!data) {
    notFound();
  }

  const defaultValues: GuruFormInput = {
    nama_lengkap: data.pengguna.nama_lengkap,
    username: data.pengguna.username,
    email: data.pengguna.email,
    telepon: data.pengguna.telepon ?? "",
    nip: data.nip ?? "",
    nuptk: data.nuptk ?? "",
    jabatan: data.jabatan ?? "",
    jurusan_id: data.jurusan_id ?? "",
    password: "",
  };

  return (
    <div>
      <Link
        href="/admin/guru"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data guru
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data guru
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {data.pengguna.nama_lengkap}
          </h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {data.nip ? `NIP ${data.nip}` : "NIP belum diisi"}
            {data.nuptk ? ` · NUPTK ${data.nuptk}` : ""}
            {data.jurusan ? ` · ${data.jurusan.nama}` : ""}
          </p>
        </div>

        <AkunBadge aktif={data.pengguna.aktif} />
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
          <GuruForm
            mode="edit"
            guruId={data.id}
            jurusanOptions={jurusanOptions}
            defaultValues={defaultValues}
          />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-xl font-semibold text-ink">Status akun</h2>
            <div className="mt-3">
              <AkunBadge aktif={data.pengguna.aktif} />
            </div>
            <p className="mt-3 text-sm leading-[22px] text-ink-soft">
              {data.pengguna.aktif
                ? "Guru dapat masuk dan memverifikasi jurnal."
                : "Guru tidak dapat masuk. Data bimbingan tetap tersimpan."}
            </p>

            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-[13px] leading-[18px] text-muted">
                  Username
                </dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {data.pengguna.username}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] leading-[18px] text-muted">
                  Email
                </dt>
                <dd className="mt-0.5 break-all font-medium text-ink">
                  {data.pengguna.email}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <GuruStatusButton
                id={data.id}
                aktif={data.pengguna.aktif}
                nama={data.pengguna.nama_lengkap}
              />
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">Bimbingan PKL</h2>
              <Users
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            <p className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.02em] text-ink tabular-nums">
              {data.bimbinganCount}
            </p>
            <p className="mt-1 text-sm leading-[22px] text-ink-soft">
              {data.bimbinganCount > 0
                ? "siswa tercatat dalam bimbingan."
                : "Belum ada siswa bimbingan."}
            </p>
            <p className="mt-3 text-[13px] leading-[18px] text-muted">
              Penempatan guru diatur dari halaman penempatan PKL.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
