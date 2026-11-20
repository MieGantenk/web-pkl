import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { PerusahaanForm } from "@/components/pkl/PerusahaanForm";
import { PerusahaanStatusButton } from "@/components/pkl/PerusahaanStatusButton";
import { AktifBadge } from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getPerusahaanDetail } from "@/lib/data/admin-perusahaan";
import { postgresUuidPattern } from "@/lib/validators/common";
import type { PerusahaanFormInput } from "@/lib/validators/perusahaan";

export const metadata: Metadata = {
  title: "Detail perusahaan",
};

export const instant = false;

const peranLabel = {
  instruktur: "Instruktur",
  pembimbing: "Pembimbing",
} as const;

export default async function AdminPerusahaanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;

  if (!postgresUuidPattern.test(id)) {
    notFound();
  }

  const data = await getPerusahaanDetail(id);

  if (!data) {
    notFound();
  }

  const defaultValues: PerusahaanFormInput = {
    nama: data.nama,
    alamat: data.alamat,
    kota: data.kota ?? "",
    telepon: data.telepon ?? "",
    email: data.email ?? "",
    website: data.website ?? "",
  };

  return (
    <div>
      <Link
        href="/admin/perusahaan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data perusahaan
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data perusahaan
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {data.nama}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {data.kota ?? "Kota belum diisi"}
            {data.website ? ` · ${data.website}` : ""}
          </p>
        </div>

        <AktifBadge aktif={data.aktif} />
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
          <PerusahaanForm
            mode="edit"
            perusahaanId={data.id}
            defaultValues={defaultValues}
          />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-xl font-semibold text-ink">Status perusahaan</h2>
            <div className="mt-3">
              <AktifBadge aktif={data.aktif} />
            </div>
            <p className="mt-3 text-sm leading-[22px] text-ink-soft">
              {data.aktif
                ? "Perusahaan aktif dan bisa dipilih pada pengajuan PKL."
                : "Perusahaan tidak muncul di pilihan pengajuan PKL."}
            </p>

            <div className="mt-4">
              <PerusahaanStatusButton
                id={data.id}
                aktif={data.aktif}
                nama={data.nama}
              />
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">Instruktur</h2>
              <Users
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            <p className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.02em] text-ink tabular-nums">
              {data.instruktur.length}
            </p>
            <p className="mt-1 text-sm leading-[22px] text-ink-soft">
              instruktur terhubung dengan perusahaan ini.
            </p>

            {data.instruktur.length ? (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {data.instruktur.map((instruktur) => (
                  <li
                    key={instruktur.id}
                    className="py-3 first:pt-3 last:pb-0"
                  >
                    <p className="text-sm font-medium leading-[22px] text-ink">
                      {instruktur.nama}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                      {peranLabel[instruktur.peran]}
                      {instruktur.jabatan ? ` · ${instruktur.jabatan}` : ""}
                    </p>
                    <div className="mt-2">
                      <AktifBadge aktif={instruktur.aktif} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 border-t border-border pt-4">
                <EmptyState
                  icon={Users}
                  title="Belum ada instruktur"
                  description="Instruktur yang dihubungkan ke perusahaan akan muncul di sini."
                />
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
