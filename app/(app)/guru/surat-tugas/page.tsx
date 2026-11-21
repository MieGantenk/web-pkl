import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { GuruLetterPlacements } from "@/components/pkl/GuruLetterPlacements";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getGuruSuratTugas } from "@/lib/data/guru-surat";

export const metadata: Metadata = {
  title: "Surat tugas",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

export default async function GuruSuratTugasPage() {
  const profile = await requireRole("guru");
  const data = await getGuruSuratTugas(profile.id);

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Surat Tugas
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Surat tugas monitoring untuk kunjungan ke tempat PKL siswa
            bimbingan.
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
            icon={ScrollText}
            title="Belum ada penempatan aktif"
            description="Surat tugas monitoring akan muncul setelah admin menetapkan Anda sebagai guru pembimbing pada penempatan PKL."
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
        <section aria-labelledby="daftar-surat-title">
          <div className="mb-3">
            <h2
              id="daftar-surat-title"
              className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
            >
              Penempatan bimbingan
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data.placements.length} penempatan aktif · {data.issuedCount}{" "}
              surat tugas terbit.
            </p>
          </div>

          <GuruLetterPlacements
            placements={data.placements}
            letterLabel="Surat tugas monitoring"
            missingHint="Hubungi admin sekolah jika surat tugas diperlukan."
          />
        </section>
      )}
    </div>
  );
}
