import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  HeartHandshake,
  MapPin,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import {
  JurnalBadge,
  PengajuanBadge,
} from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getGuruStudentDetail } from "@/lib/data/guru";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail siswa",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM yyyy", {
    locale: localeId,
  });
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMM yyyy", { locale: localeId })
    : "—";
}

type GuruStudentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuruStudentDetailPage({
  params,
}: GuruStudentDetailPageProps) {
  const profile = await requireRole("guru");
  const { id } = await params;
  const data = await getGuruStudentDetail(profile.id, id);

  if (!data) {
    return (
      <div>
        <Link
          href="/guru/siswa"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          Kembali ke siswa bimbingan
        </Link>

        <section className={cn(card, "mt-4")}>
          <EmptyState
            icon={Users}
            title="Siswa tidak ditemukan"
            description="Siswa ini bukan bimbingan Anda atau datanya sudah tidak aktif."
            action={
              <Link
                href="/guru/siswa"
                prefetch={false}
                className={buttonVariants({ variant: "secondary" })}
              >
                Lihat siswa bimbingan
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  const { student, profile: studentProfile, journals } = data;
  const totalJournals = student.jurnal.total;
  const verifiedPercent = totalJournals
    ? Math.round((student.jurnal.terverifikasi / totalJournals) * 100)
    : 0;

  return (
    <div>
      <Link
        href="/guru/siswa"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke siswa bimbingan
      </Link>

      <header className="mt-4 mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            {student.nis} · {student.kelas ?? "—"} ·{" "}
            {student.jurusan?.nama ?? "—"}
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {student.nama}
          </h1>
          <p className="mt-2 text-base leading-[26px] text-ink-soft">
            {student.perusahaan?.nama ?? "Belum ada penempatan PKL"}
          </p>
        </div>
        <PengajuanBadge status={student.pengajuanStatus} />
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={card} aria-labelledby="profil-title">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-5 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <h2
                id="profil-title"
                className="text-xl font-semibold text-ink"
              >
                Profil siswa
              </h2>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-medium text-muted">Telepon</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {student.telepon ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Orang tua / wali
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {studentProfile?.namaOrangTua ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Telepon orang tua
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {studentProfile?.teleponOrangTua ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Tempat & tanggal lahir
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {[studentProfile?.tempatLahir, formatDate(studentProfile?.tanggalLahir ?? null)]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[13px] font-medium text-muted">Alamat</dt>
                <dd className="mt-0.5 text-sm leading-[22px] text-ink">
                  {studentProfile?.alamat ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className={card} aria-labelledby="penempatan-title">
            <div className="flex items-center gap-2">
              <Building2
                className="size-5 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <h2
                id="penempatan-title"
                className="text-xl font-semibold text-ink"
              >
                Penempatan PKL
              </h2>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Perusahaan
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {student.perusahaan?.nama ?? "Belum ditetapkan"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">Kota</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {student.perusahaan?.kota ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">Periode</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {student.periode?.nama ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Tanggal PKL
                </dt>
                <dd className="mt-0.5 text-sm text-ink tabular-nums">
                  {formatDate(student.tanggalMulai)} –{" "}
                  {formatDate(student.tanggalSelesai)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Guru pembimbing
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {profile.nama_lengkap}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Instruktur perusahaan
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {data.instrukturNama ?? "Belum ditetapkan"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Pembimbing lapangan
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {data.pembimbingNama ?? "Belum ditetapkan"}
                </dd>
              </div>
            </dl>
          </section>

          <section className={card} aria-labelledby="jurnal-title">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="size-5 text-brand-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h2
                  id="jurnal-title"
                  className="text-xl font-semibold text-ink"
                >
                  Jurnal terbaru
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`/api/guru/jurnal/${student.id}/export`}
                  className="inline-flex h-11 items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Ekspor CSV
                </a>
              </div>
            </div>

            {journals.length ? (
              <ul className="mt-4 divide-y divide-border">
                {journals.map((journal) => (
                  <li key={journal.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[13px] leading-[18px] text-muted">
                          {formatDay(journal.tanggal)}
                          {formatTime(journal.waktuMulai) &&
                          formatTime(journal.waktuSelesai)
                            ? ` · ${formatTime(journal.waktuMulai)}–${formatTime(journal.waktuSelesai)}`
                            : ""}
                        </p>
                        <p className="mt-0.5 text-base font-medium text-ink">
                          {journal.kegiatan}
                        </p>
                        {journal.deskripsi ? (
                          <p className="mt-1 text-sm leading-[22px] text-ink-soft">
                            {journal.deskripsi}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {journal.fotoUrl ? (
                          <a
                            href={journal.fotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                          >
                            Lihat foto
                          </a>
                        ) : null}
                        <JurnalBadge status={journal.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={BookOpen}
                  title="Belum ada jurnal"
                  description="Jurnal harian siswa akan muncul di sini setelah diisi."
                />
              </div>
            )}
          </section>

        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className="text-xl font-semibold text-ink">Ringkasan</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Status PKL</span>
                <PengajuanBadge status={student.pengajuanStatus} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted">Perusahaan</span>
                <span className="text-right font-medium text-ink">
                  {student.perusahaan?.nama ?? "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted">Periode</span>
                <span className="text-right font-medium text-ink">
                  {student.periode?.nama ?? "—"}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">Jurnal terverifikasi</span>
                <span className="font-medium text-ink tabular-nums">
                  {student.jurnal.terverifikasi}/{student.jurnal.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${verifiedPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] leading-[18px] text-muted">
                {student.jurnal.menunggu} menunggu, {student.jurnal.revisi}{" "}
                revisi.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
              <MutabaahRing
                value={student.mutabaah.terisi}
                total={student.mutabaah.totalHari}
              />
              <div>
                <p className="text-[13px] font-medium text-ink-soft">
                  Mutaba&apos;ah minggu ini
                </p>
                <p className="mt-1 text-sm text-muted">
                  {student.mutabaah.terisi} dari{" "}
                  {student.mutabaah.totalHari} hari terisi.
                </p>
              </div>
            </div>

          </section>

          <section className={cn(card, "text-sm")}>
            <div className="flex items-center gap-2 text-muted">
              <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
              <span>{student.perusahaan?.kota ?? "Kota belum diisi"}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-muted">
              <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="tabular-nums">
                {formatDate(student.tanggalMulai)} –{" "}
                {formatDate(student.tanggalSelesai)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-muted">
              <Phone className="size-4" strokeWidth={1.75} aria-hidden />
              <span>{student.telepon ?? "Telepon belum diisi"}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-muted">
              <HeartHandshake
                className="size-4"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>{student.mutabaah.terisi} hari mutaba&apos;ah minggu ini</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
