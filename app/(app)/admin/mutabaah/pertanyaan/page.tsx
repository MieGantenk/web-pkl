import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  Check,
  FileText,
  Plus,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahCreateForm } from "@/components/pkl/MutabaahCreateForm";
import { MutabaahFormBuilder } from "@/components/pkl/MutabaahFormBuilder";
import { MutabaahFormPreview } from "@/components/pkl/MutabaahFormPreview";
import { MutabaahTabs } from "@/components/pkl/MutabaahTabs";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import {
  getAdminMutabaah,
  type StatusForm,
} from "@/lib/data/admin-mutabaah";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Form Mutaba'ah",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const statusMeta: Record<
  StatusForm,
  { label: string; tone: "neutral" | "success"; icon: typeof FileText }
> = {
  draft: { label: "Draft", tone: "neutral", icon: FileText },
  aktif: { label: "Aktif", tone: "success", icon: Check },
  arsip: { label: "Arsip", tone: "neutral", icon: Archive },
};

type PageProps = {
  searchParams: Promise<{ form?: string }>;
};

export default async function AdminMutabaahFormPage({
  searchParams,
}: PageProps) {
  await requireRole("admin");

  const params = await searchParams;
  const selectedId =
    typeof params.form === "string" ? params.form : undefined;
  const isNew = selectedId === "baru";
  const data = await getAdminMutabaah(isNew ? undefined : selectedId);
  const selected = isNew ? null : data.selected;

  return (
    <div>
      <header className="mb-6">
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Admin Sekolah
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Mutaba&apos;ah
        </h1>
        <p className="mt-2 max-w-[68ch] text-base leading-[26px] text-ink-soft">
          Kelola form, pertanyaan, dan status publikasi mutaba&apos;ah harian
          siswa.
        </p>
      </header>

      <MutabaahTabs active="pertanyaan" />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className={card}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Daftar form</h2>
              <p className="mt-1 text-[13px] text-muted">
                {data.forms.length} form tersimpan
              </p>
            </div>
            <Link
              href="/admin/mutabaah/pertanyaan?form=baru"
              prefetch={false}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Plus className="size-4" strokeWidth={1.75} aria-hidden />
              Baru
            </Link>
          </div>

          {data.forms.length ? (
            <ul className="mt-4 space-y-2">
              {data.forms.map((form) => {
                const active = !isNew && selected?.id === form.id;
                const meta = statusMeta[form.status];

                return (
                  <li key={form.id}>
                    <Link
                      href={`/admin/mutabaah/pertanyaan?form=${form.id}`}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-sm border p-3 transition-colors duration-[var(--m-fast)]",
                        active
                          ? "border-brand-700 bg-brand-50"
                          : "border-border bg-surface hover:bg-surface-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-semibold text-ink">
                          {form.nama}
                        </p>
                        <StatusBadge
                          label={meta.label}
                          tone={meta.tone}
                          icon={meta.icon}
                        />
                      </div>
                      <p className="mt-1 text-[12px] leading-4 text-muted">
                        Versi {form.versi} · {form.questionCount} pertanyaan
                      </p>
                      <p className="mt-0.5 text-[12px] leading-4 text-muted">
                        {form.periode?.nama ?? "Tanpa periode"}
                        {form.hasAnswers ? " · ada jawaban" : ""}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-[22px] text-muted">
              Belum ada form. Buat form pertama untuk mulai menyusun
              pertanyaan.
            </p>
          )}
        </aside>

        <div>
          {isNew ? (
            <MutabaahCreateForm
              periods={data.periods}
              activePeriodId={data.activePeriodId}
            />
          ) : selected ? (
            selected.status === "draft" ? (
              <MutabaahFormBuilder form={selected} periods={data.periods} />
            ) : (
              <MutabaahFormPreview form={selected} />
            )
          ) : (
            <section className={card}>
              <EmptyState
                icon={FileText}
                title="Belum ada form mutaba'ah"
                description="Buat form pertama, tambahkan pertanyaan, lalu publikasikan agar siswa bisa mengisi."
                action={
                  <Link
                    href="/admin/mutabaah/pertanyaan?form=baru"
                    prefetch={false}
                    className={buttonVariants({ variant: "primary" })}
                  >
                    Buat form
                  </Link>
                }
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
