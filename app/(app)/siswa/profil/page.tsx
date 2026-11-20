import type { Metadata } from "next";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Ban,
  CheckCircle2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { ChangePasswordForm } from "@/components/pkl/ChangePasswordForm";
import { EmptyState } from "@/components/pkl/EmptyState";
import { SiswaProfileForm } from "@/components/pkl/SiswaProfileForm";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { changeSiswaPasswordAction } from "@/lib/actions/siswa-profile";
import { requireRole } from "@/lib/auth";
import { getSiswaProfile } from "@/lib/data/siswa-profile";

export const metadata: Metadata = {
  title: "Profil",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return format(parseISO(value), "d MMMM yyyy", { locale: localeId });
}

export default async function SiswaProfilePage() {
  const sessionProfile = await requireRole("siswa");
  const data = await getSiswaProfile(sessionProfile.id);

  if (!data) {
    return (
      <section className={card}>
        <EmptyState
          icon={UserRound}
          title="Data siswa belum terhubung"
          description="Akun ini belum memiliki data siswa. Hubungi admin sekolah agar profil siswa dihubungkan ke akun Anda."
        />
      </section>
    );
  }

  const { profile, siswa } = data;
  const initial = profile.nama_lengkap.trim().charAt(0).toUpperCase() || "S";
  const active = profile.aktif && siswa.aktif;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Siswa PKL
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Profil
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Data diri, kontak, dan keamanan akun.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={card} aria-labelledby="profil-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.nama_lengkap}
                className="size-16 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-2xl font-semibold text-brand-700">
                {initial}
              </span>
            )}

            <div className="min-w-0">
              <h2
                id="profil-title"
                className="font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
              >
                {profile.nama_lengkap}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {[siswa.kelas, siswa.jurusan?.nama]
                  .filter(Boolean)
                  .join(" · ") || "Siswa PKL"}
              </p>
              <StatusBadge
                label={active ? "Aktif" : "Nonaktif"}
                tone={active ? "success" : "neutral"}
                icon={active ? CheckCircle2 : Ban}
                className="mt-2"
              />
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Info label="Username" value={profile.username} />
            <Info label="Email" value={profile.email} />
            <Info label="NIS" value={siswa.nis} />
            <Info label="NISN" value={siswa.nisn ?? "—"} />
            <Info label="Kelas" value={siswa.kelas ?? "—"} />
            <Info label="Jurusan" value={siswa.jurusan?.nama ?? "—"} />
            <Info label="Tempat lahir" value={siswa.tempat_lahir ?? "—"} />
            <Info
              label="Tanggal lahir"
              value={formatDate(siswa.tanggal_lahir)}
            />
          </dl>

          <p className="mt-3 text-xs leading-4 text-muted">
            Nama, NIS, NISN, kelas, jurusan, dan data lahir dikelola admin
            sekolah.
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-base font-semibold text-ink">Ubah kontak</h3>
            <p className="mt-1 text-sm text-muted">
              Perbarui nomor telepon dan alamat yang dipakai sekolah untuk
              menghubungi Anda.
            </p>
            <div className="mt-4">
              <SiswaProfileForm
                initial={{
                  telepon: siswa.telepon,
                  alamat: siswa.alamat,
                }}
              />
            </div>
          </div>
        </section>

        <section className={card} aria-labelledby="keamanan-title">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="size-5 text-brand-600"
              strokeWidth={1.75}
              aria-hidden
            />
            <h2
              id="keamanan-title"
              className="text-xl font-semibold text-ink"
            >
              Keamanan akun
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Ganti kata sandi untuk menjaga akun tetap aman.
          </p>

          <div className="mt-5">
            <ChangePasswordForm action={changeSiswaPasswordAction} />
          </div>

          <div className="mt-5 rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-xs leading-4 text-muted">
            Setelah kata sandi diubah, gunakan kata sandi baru saat masuk
            berikutnya.
          </div>
        </section>
      </div>
    </div>
  );
}
