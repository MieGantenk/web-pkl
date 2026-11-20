import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ChangePasswordForm } from "@/components/pkl/ChangePasswordForm";
import { EmptyState } from "@/components/pkl/EmptyState";
import { ProfileIdentityForm } from "@/components/pkl/ProfileIdentityForm";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { requireRole } from "@/lib/auth";
import { getOrtuProfile } from "@/lib/data/ortu-profile";

export const metadata: Metadata = {
  title: "Profil",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const hubunganLabel = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
} as const;

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function OrtuProfilePage() {
  const sessionProfile = await requireRole("ortu");
  const data = await getOrtuProfile(sessionProfile.id);
  const { profile, children } = data;
  const initial = profile.nama_lengkap.trim().charAt(0).toUpperCase() || "O";
  const childLabel = children.length
    ? `${children.length} anak terhubung`
    : "Belum ada anak terhubung";

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Orang Tua
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Profil
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            Data diri, anak terkait, dan keamanan akun.
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
              <p className="mt-1 text-sm text-muted">{childLabel}</p>
              <StatusBadge
                label={profile.aktif ? "Aktif" : "Nonaktif"}
                tone={profile.aktif ? "success" : "neutral"}
                icon={profile.aktif ? CheckCircle2 : Ban}
                className="mt-2"
              />
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Info label="Username" value={profile.username} />
            <Info label="Email" value={profile.email} />
            <Info label="Telepon" value={profile.telepon ?? "—"} />
            <Info label="Anak terkait" value={childLabel} />
          </dl>

          <p className="mt-3 text-xs leading-4 text-muted">
            Username, email, dan relasi anak dikelola admin sekolah.
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <HeartHandshake
                className="size-5 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <h3 className="text-base font-semibold text-ink">
                Anak terkait
              </h3>
            </div>

            {children.length ? (
              <ul className="mt-4 divide-y divide-border rounded-sm border border-border">
                {children.map((child) => (
                  <li
                    key={child.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/ortu?anak=${child.id}`}
                        prefetch={false}
                        className="text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {child.nama}
                      </Link>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                        {child.nis} · {child.kelas ?? "—"} ·{" "}
                        {child.jurusan?.nama ?? "—"}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                        {hubunganLabel[child.hubungan]}
                      </p>
                    </div>
                    <StatusBadge
                      label={child.aktif ? "Aktif" : "Nonaktif"}
                      tone={child.aktif ? "success" : "neutral"}
                      icon={child.aktif ? CheckCircle2 : Ban}
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={Users}
                  title="Belum ada anak terhubung"
                  description="Hubungi admin sekolah agar akun Anda dihubungkan ke data anak."
                />
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-base font-semibold text-ink">Ubah data</h3>
            <p className="mt-1 text-sm text-muted">
              Perbarui nama dan nomor telepon yang tampil di sistem.
            </p>
            <div className="mt-4">
              <ProfileIdentityForm
                action={updateProfileAction}
                initial={{
                  nama_lengkap: profile.nama_lengkap,
                  telepon: profile.telepon,
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
            <ChangePasswordForm action={changePasswordAction} />
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
