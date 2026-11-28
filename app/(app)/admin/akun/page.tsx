import type { Metadata } from "next";

import { AccountPdfDownloadButton } from "@/components/pkl/AccountPdfDownloadButton";
import { accountExportRoles } from "@/lib/account-export";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Akun pengguna",
};

export default async function AdminAccountPage() {
  await requireRole("admin");

  const admin = createAdminClient();
  const { data: periods, error } = await admin
    .from("periode_pkl")
    .select("id, nama")
    .order("tanggal_mulai", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat periode PKL.");
  }

  const periodRoles = accountExportRoles.filter(
    ({ role }) => role === "siswa" || role === "ortu",
  );
  const staffRoles = accountExportRoles.filter(
    ({ role }) => role === "instruktur" || role === "guru",
  );

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <header className="border-b border-border pb-5">
        <h1 className="font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Akun pengguna
        </h1>
        <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-ink-soft">
          Unduh daftar akun berdasarkan periode PKL atau peran. PDF memuat
          nama, username, dan email tanpa kata sandi; simpan file dengan aman.
        </p>
      </header>

      <section
        aria-labelledby="account-export-period-title"
        className="mt-6 rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
      >
        <div>
          <h2
            id="account-export-period-title"
            className="text-base font-semibold text-ink"
          >
            Siswa dan orang tua
          </h2>
          <p className="mt-1 max-w-[65ch] text-sm leading-6 text-ink-soft">
            Pilih periode PKL. Setiap PDF memuat satu jenis akun dan
            mencantumkan periodenya.
          </p>
        </div>

        {periods.length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {periods.map((period) => (
              <li
                key={period.id}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <h3 className="text-sm font-semibold text-ink">
                  {period.nama}
                </h3>
                <div className="grid gap-2 sm:flex">
                  {periodRoles.map(({ role, label }) => (
                    <AccountPdfDownloadButton
                      key={role}
                      role={role}
                      label={label}
                      periodeId={period.id}
                      periodeLabel={period.nama}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-sm bg-surface-muted p-4 text-sm leading-6 text-ink-soft">
            Belum ada periode PKL untuk ekspor akun siswa dan orang tua.
          </p>
        )}
      </section>

      <section className="mt-8" aria-labelledby="account-export-staff-title">
        <div>
          <h2
            id="account-export-staff-title"
            className="text-base font-semibold text-ink"
          >
            Akun guru dan instruktur
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Daftar akun staf tidak dibagi berdasarkan periode.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {staffRoles.map(({ role, label }) => (
            <section
              key={role}
              aria-labelledby={`account-export-${role}`}
              className="flex flex-col items-start justify-between gap-3 rounded-md border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:p-5"
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
