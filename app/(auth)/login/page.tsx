import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { getCurrentProfile } from "@/lib/auth";
import { roleHome } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Masuk",
};

// Halaman ini membaca sesi untuk redirect; jangan diprerender.
export const instant = false;

export default async function LoginPage() {
  const profile = await getCurrentProfile();

  if (profile?.aktif) {
    redirect(roleHome[profile.peran]);
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const startYear = month >= 7 ? year : year - 1;
  const schoolYear = `${startYear}/${startYear + 1}`;
  const semester = month >= 7 ? "ganjil" : "genap";

  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr] bg-surface lg:grid-cols-[13fr_12fr] lg:grid-rows-1">
      <aside className="relative isolate overflow-hidden bg-sidebar px-5 py-6 text-sidebar-text sm:px-8 lg:px-14 lg:py-14 xl:px-20">
        <Image
          src="/brand/school-login.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-sidebar/90 via-brand-600/80 to-sidebar/85 dark:from-sidebar/95 dark:via-sidebar/85 dark:to-sidebar/90"
        />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm ring-1 ring-white/30">
              <Image
                src="/brand/smk-logo.jpg"
                alt=""
                width={80}
                height={80}
                className="size-full rounded-full object-cover"
              />
            </span>
            <div>
              <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">
                SMK-IT As-Syifa
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                <span className="h-px w-3.5 bg-gold-400" aria-hidden />
                Sistem PKL
              </p>
            </div>
          </div>

          <div className="hidden max-w-[480px] lg:block">
            <p className="font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] xl:text-[48px] xl:leading-[52px]">
              Buku kerja PKL, dari pengajuan sampai penarikan.
            </p>
            <p className="mt-5 max-w-[34ch] text-base leading-[26px] text-sidebar-muted">
              Jurnal harian, mutaba&apos;ah, dan surat resmi sekolah dalam satu
              tempat.
            </p>
          </div>

          <div className="hidden border-t border-white/15 pt-5 text-[13px] leading-[18px] text-sidebar-muted lg:block">
            <p className="font-medium text-sidebar-text">
              SMK-IT As-Syifa Boarding School
            </p>
            <p className="mt-1">Sistem Informasi Praktik Kerja Lapangan</p>
            <p className="mt-1 tabular-nums">
              Tahun ajaran {schoolYear} · Semester {semester}
            </p>
          </div>
        </div>
      </aside>

      <section className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <header className="mb-8">
            <p className="text-[13px] font-medium leading-[18px] text-brand-700">
              Sistem Informasi PKL
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
              Masuk ke sistem
            </h1>
            <p className="mt-2 text-base leading-[26px] text-ink-soft">
              Gunakan akun yang diberikan admin sekolah.
            </p>
          </header>

          <LoginForm />

          <div className="mt-8 border-t border-border pt-5">
            <p className="text-[13px] font-semibold leading-[18px] text-ink-soft">
              Lupa kata sandi?
            </p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted">
              Hubungi admin sekolah untuk mengatur ulang kata sandi Anda.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
