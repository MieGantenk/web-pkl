import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Check,
  CircleDashed,
  ClipboardList,
  HeartHandshake,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahHistory } from "@/components/pkl/MutabaahHistory";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getGuruMutabaah } from "@/lib/data/guru-mutabaah";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mutaba'ah Siswa",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatDay(value: string) {
  return format(parseISO(value), "EEEE, d MMMM yyyy", {
    locale: localeId,
  });
}

export default async function GuruMutabaahPage({
  searchParams,
}: PageProps) {
  const profile = await requireRole("guru");
  const params = await searchParams;
  const selectedStudentId =
    typeof params.siswa === "string" ? params.siswa : undefined;
  const selectedFormId =
    typeof params.form === "string" ? params.form : undefined;
  const data = await getGuruMutabaah(
    profile.id,
    selectedStudentId,
    selectedFormId,
  );
  const student = data.activeStudent;
  const review = data.review;
  const form = review?.data.form ?? null;
  const history = review?.data.history ?? [];
  const forms = review?.forms ?? [];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Guru Pembimbing
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Mutaba&apos;ah Siswa
          </h1>
          <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
            Periksa hasil pengisian mutaba&apos;ah siswa bimbingan. Halaman ini
            hanya bisa dilihat.
          </p>
        </div>

        {student ? (
          <p className="text-sm text-muted lg:text-right">
            {student.nama} · NIS {student.nis}
          </p>
        ) : null}
      </header>

      {data.students.length > 1 ? (
        <nav aria-label="Pilih siswa" className="mb-6 flex flex-wrap gap-2">
          {data.students.map((item) => {
            const active = item.id === student?.id;

            return (
              <Link
                key={item.id}
                href={`/guru/mutabaah?siswa=${item.id}`}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                  active
                    ? "border-brand-700 bg-brand-50 text-brand-700"
                    : "border-border bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                {item.nama}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {!data.context ? (
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Data guru belum terhubung"
            description="Akun ini belum memiliki data guru. Hubungi admin sekolah agar profil guru dihubungkan ke akun Anda."
          />
        </section>
      ) : !student ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada siswa bimbingan"
            description="Siswa akan muncul di sini setelah admin menetapkan Anda sebagai guru pembimbing."
          />
        </section>
      ) : !forms.length ? (
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Mutaba'ah belum aktif"
            description="Hasil mutaba'ah akan muncul setelah admin mengaktifkan form untuk periode PKL siswa."
          />
        </section>
      ) : (
        <>
          <section
            className={cn(card, "mb-6")}
            aria-labelledby="daftar-mutabaah-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="daftar-mutabaah-title"
                  className="text-xl font-semibold text-ink"
                >
                  Mutaba&apos;ah aktif
                </h2>
                <p className="mt-1 text-sm leading-[22px] text-muted">
                  Pilih form untuk melihat jawaban siswa.
                </p>
              </div>
              <ClipboardList
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {forms.map((item) => {
                const active = item.id === review?.selectedFormId;

                return (
                  <Link
                    key={item.id}
                    href={`/guru/mutabaah?siswa=${student.id}&form=${item.id}`}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md border p-4 transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100",
                      active
                        ? "border-brand-700 bg-brand-50"
                        : "border-border bg-surface hover:bg-surface-muted",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-base font-semibold text-ink">
                        {item.nama}
                      </p>
                      {item.todayFilled ? (
                        <StatusBadge
                          label="Sudah diisi"
                          tone="success"
                          icon={Check}
                        />
                      ) : (
                        <StatusBadge
                          label="Belum diisi"
                          tone="warning"
                          icon={CircleDashed}
                        />
                      )}
                    </div>
                    <p className="mt-2 text-[12px] leading-4 text-muted tabular-nums">
                      {item.questionCount} pertanyaan · {item.week.filled}/7
                      hari terisi
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {form && review ? (
            <>
              <section
                className={cn(card, "mb-6")}
                aria-labelledby="ringkasan-mutabaah-title"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[13px] font-medium leading-[18px] text-muted">
                      {student.nama} · {formatDay(review.today)}
                    </p>
                    <h2
                      id="ringkasan-mutabaah-title"
                      className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
                    >
                      {form.nama}
                    </h2>
                    {form.deskripsi ? (
                      <p className="mt-1 max-w-[60ch] text-sm leading-[22px] text-muted">
                        {form.deskripsi}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4">
                    <MutabaahRing
                      value={review.data.week.filled}
                      total={review.data.week.total}
                    />
                    <div>
                      <p className="text-[13px] font-medium leading-[18px] text-muted">
                        Minggu ini
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-ink">
                        {review.data.week.filled}/{review.data.week.total} hari
                        terisi
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {review.data.todayEntry
                          ? "Sudah diisi hari ini."
                          : "Belum diisi hari ini."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-6 sm:mt-8" aria-labelledby="riwayat-title">
                <div className="mb-3">
                  <h2
                    id="riwayat-title"
                    className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
                  >
                    Riwayat 7 hari
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Jawaban siswa bimbingan. Klik “Lihat jawaban” pada tiap
                    tanggal.
                  </p>
                </div>

                <MutabaahHistory history={history} />
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
