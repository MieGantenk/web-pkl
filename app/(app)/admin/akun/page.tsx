import type { Metadata } from "next";

import { AccountPdfDownloadButton } from "@/components/pkl/AccountPdfDownloadButton";
import { accountExportRoles } from "@/lib/account-export";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Akun pengguna",
};

export default async function AdminAccountPage() {
  await requireRole("admin");

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <header className="border-b border-border pb-5">
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink sm:text-[28px] sm:leading-9">
          Akun pengguna
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          Unduh daftar akun siswa, instruktur, guru, dan orang tua.
        </p>
      </header>

      <section
        aria-labelledby="account-export-title"
        className="mt-6 rounded-md border border-border bg-surface p-5"
      >
        <h2
          id="account-export-title"
          className="text-base font-semibold text-ink"
        >
          Daftar akun
        </h2>
        <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-ink-soft">
          PDF berisi nama lengkap, username, dan email. Kata sandi tidak
          disertakan. Dokumen memuat data pribadi; simpan dan bagikan dengan
          aman.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {accountExportRoles.map(({ role, label }) => (
            <section
              key={role}
              aria-labelledby={`account-export-${role}`}
              className="flex flex-col items-start gap-3 rounded-sm border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <h3
                id={`account-export-${role}`}
                className="text-sm font-semibold text-ink"
              >
                {label}
              </h3>
              <AccountPdfDownloadButton role={role} label={label} />
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
