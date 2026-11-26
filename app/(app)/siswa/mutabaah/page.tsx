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
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { MutabaahForm } from "@/components/pkl/MutabaahForm";
import { MutabaahHistory } from "@/components/pkl/MutabaahHistory";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import { requireRole } from "@/lib/auth";
import { getSiswaMutabaah } from "@/lib/data/siswa-mutabaah";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mutaba'ah",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type PageProps = {
  searchParams: Promise<{ form?: string }>;
};

export default async function SiswaMutabaahPage({
  searchParams,
}: PageProps) {
  const profile = await requireRole("siswa");
  const params = await searchParams;
  const selectedFormId =
    typeof params.form === "string" ? params.form : undefined;
  const data = await getSiswaMutabaah(profile.id, selectedFormId);

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Ibadah harian
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Mutaba&apos;ah Yaumiyyah
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Isi checklist ibadah harian dengan jujur dan rutin setiap hari.
        </p>
      </div>

      {data.student ? (
        <p className="text-sm text-muted lg:text-right">
          {data.student.nis} · {data.student.kelas ?? "—"}
          {data.student.jurusan?.nama
            ? ` · ${data.student.jurusan.nama}`
            : ""}
        </p>
      ) : null}
    </header>
  );

  if (!data.student) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Data siswa belum terhubung"
            description="Akun ini belum memiliki data siswa. Hubungi admin sekolah agar profil siswa dihubungkan ke akun Anda."
          />
        </section>
      </div>
    );
  }

  if (!data.pklAktif) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Mutaba'ah belum dapat diisi"
            description="Mutaba'ah tersedia selama masa PKL berlangsung. Hubungi guru atau admin jika status atau tanggal PKL Anda belum sesuai."
            action={
              <Link
                href="/siswa/pengajuan"
                className={buttonVariants({ variant: "secondary" })}
              >
                Periksa pengajuan PKL
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  if (!data.form) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Form mutaba'ah belum aktif"
            description="Form mutaba'ah akan muncul di sini setelah admin mengaktifkannya untuk periode PKL."
          />
        </section>
      </div>
    );
  }

  if (!data.questions.length) {
    return (
      <div>
        {header}
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Belum ada pertanyaan"
            description="Form mutaba'ah sudah aktif, tetapi belum memiliki pertanyaan. Hubungi admin sekolah."
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      {header}

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
              Semua mutaba&apos;ah di bawah ini harus dikerjakan hari ini.
            </p>
          </div>
          <ClipboardList
            className="size-5 shrink-0 text-brand-600"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.forms.map((form) => {
            const active = form.id === data.selectedFormId;

            return (
              <Link
                key={form.id}
                href={`/siswa/mutabaah?form=${form.id}`}
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
                    {form.nama}
                  </p>
                  {form.todayFilled ? (
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
                {form.deskripsi ? (
                  <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-muted">
                    {form.deskripsi}
                  </p>
                ) : null}
                <p className="mt-2 text-[12px] leading-4 text-muted tabular-nums">
                  {form.questionCount} pertanyaan · {form.week.filled}/7 hari
                  terisi
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className={cn(card, "mb-6")}
        aria-labelledby="mutabaah-summary-title"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium leading-[18px] text-muted">
              {format(parseISO(data.today), "EEEE, d MMMM yyyy", {
                locale: localeId,
              })}
            </p>
            <h2
              id="mutabaah-summary-title"
              className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
            >
              {data.form.nama}
            </h2>
            {data.form.deskripsi ? (
              <p className="mt-1 max-w-[60ch] text-sm leading-[22px] text-muted">
                {data.form.deskripsi}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <MutabaahRing value={data.week.filled} total={data.week.total} />
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                Minggu ini
              </p>
              <p className="mt-0.5 text-base font-semibold text-ink">
                {data.week.filled}/{data.week.total} hari terisi
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {data.todayEntry
                  ? "Sudah diisi hari ini."
                  : "Belum diisi hari ini."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MutabaahForm
        formId={data.form.id}
        questions={data.questions}
        todayEntry={data.todayEntry}
      />

      <section className="mt-6 sm:mt-8" aria-labelledby="riwayat-title">
        <div className="mb-3">
          <h2
            id="riwayat-title"
            className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink"
          >
            Riwayat 7 hari
          </h2>
          <p className="mt-1 text-sm text-muted">
            Hari sebelumnya hanya bisa dilihat dan tidak bisa diubah.
          </p>
        </div>

        <MutabaahHistory history={data.history} />
      </section>
    </div>
  );
}
