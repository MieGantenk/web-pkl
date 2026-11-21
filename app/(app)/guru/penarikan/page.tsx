import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { GuruLetterPlacements } from "@/components/pkl/GuruLetterPlacements";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getGuruPenarikan } from "@/lib/data/guru-surat";

export const metadata: Metadata = {
  title: "Penarikan",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

export default async function GuruPenarikanPage() {
  const profile = await requireRole("guru");
  const data = await getGuruPenarikan(profile.id);

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Penarikan
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Surat penarikan untuk mengakhiri penempatan PKL siswa bimbingan.
          </p>
        </div>

        {data.context ? (
          <p className="text-sm text-muted lg:text-right">
            {data.context.jabatan ?? "Guru Pembimbing"}
            {data.context.nip ? ` · NIP ${data.context.nip}` : ""}
          </p>
        ) : null}
      </header>

      {!data.context ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Data guru belum terhubung"
            description="Akun ini belum memiliki data guru. Hubungi admin sekolah agar profil guru dihubungkan ke akun Anda."
          />
        </section>
      ) : data.placements.length === 0 ? (
        <section className={card}>
          <EmptyState
            icon={FileText}
            title="Belum ada penempatan berjalan"
            description="Halaman ini menampilkan penempatan PKL yang sedang berlangsung. Surat penarikan akan muncul setelah admin menerbitkannya."
            action={
              <Link
                href="/guru/siswa"
                prefetch={false}
                className={buttonVariants({ variant: "primary" })}
              >
                Lihat siswa bimbingan
              </Link>
            }
          />
        </section>
      ) : (
        <section aria-labelledby="daftar-penarikan-title">
          <div className="mb-3">
            <h2
              id="daftar-penarikan-title"
              className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
            >
              Penempatan bimbingan
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data.placements.length} penempatan · {data.issuedCount} surat
              penarikan terbit.
            </p>
          </div>

          <GuruLetterPlacements
            placements={data.placements}
            letterLabel="Surat penarikan"
            missingHint="Hubungi admin sekolah jika surat penarikan diperlukan."
          />
        </section>
      )}
    </div>
  );
}
