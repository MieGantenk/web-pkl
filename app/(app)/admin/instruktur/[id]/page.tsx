import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { InstrukturAccountForm } from "@/components/pkl/InstrukturAccountForm";
import { InstrukturStatusButton } from "@/components/pkl/InstrukturStatusButton";
import { PenugasanManager } from "@/components/pkl/PenugasanManager";
import { AktifBadge } from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getInstrukturDetail } from "@/lib/data/admin-instruktur";
import { getPerusahaanOptions } from "@/lib/data/master";
import { postgresUuidPattern } from "@/lib/validators/common";
import type { InstrukturFormInput } from "@/lib/validators/instruktur";

export const metadata: Metadata = {
  title: "Detail instruktur",
};

export const instant = false;

export default async function AdminInstrukturDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;

  if (!postgresUuidPattern.test(id)) {
    notFound();
  }

  const [data, perusahaanOptions] = await Promise.all([
    getInstrukturDetail(id),
    getPerusahaanOptions(),
  ]);

  if (!data) {
    notFound();
  }

  const defaultValues: InstrukturFormInput = {
    nama_lengkap: data.nama,
    username: data.username,
    email: data.email,
    telepon: data.telepon ?? "",
    password: "",
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

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data instruktur
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {data.nama}
          </h1>
          <p className="mt-1 break-words text-sm text-muted">
            @{data.username} · {data.email}
          </p>
        </div>

        <AktifBadge aktif={data.aktif} />
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
            <InstrukturAccountForm
              penggunaId={data.id}
              defaultValues={defaultValues}
            />
          </section>

          <PenugasanManager
            penggunaId={data.id}
            penugasan={data.penugasan}
            perusahaanOptions={perusahaanOptions}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-xl font-semibold text-ink">Status akun</h2>
            <div className="mt-3">
              <AktifBadge aktif={data.aktif} />
            </div>
            <p className="mt-3 text-sm leading-[22px] text-ink-soft">
              {data.aktif
                ? "Instruktur dapat masuk dan memverifikasi jurnal siswa di perusahaannya."
                : "Instruktur tidak dapat masuk. Data penugasan tetap tersimpan."}
            </p>

            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-[13px] leading-[18px] text-muted">
                  Username
                </dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {data.username}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] leading-[18px] text-muted">
                  Email
                </dt>
                <dd className="mt-0.5 break-all font-medium text-ink">
                  {data.email}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <InstrukturStatusButton
                id={data.id}
                aktif={data.aktif}
                nama={data.nama}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
