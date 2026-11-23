import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HeartHandshake, Users } from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { MutabaahHistory } from "@/components/pkl/MutabaahHistory";
import { MutabaahRing } from "@/components/pkl/MutabaahRing";
import { requireRole } from "@/lib/auth";
import {
  getOrtuMutabaah,
  type OrtuMutabaahChild,
} from "@/lib/data/ortu-mutabaah";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mutaba'ah",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const hubunganLabel: Record<OrtuMutabaahChild["hubungan"], string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
};

type OrtuMutabaahPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrtuMutabaahPage({
  searchParams,
}: OrtuMutabaahPageProps) {
  const profile = await requireRole("ortu");
  const params = await searchParams;
  const selectedChildId =
    typeof params.anak === "string" ? params.anak : undefined;
  const data = await getOrtuMutabaah(profile.id, selectedChildId);
  const child = data.activeChild;

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-muted">
          Orang Tua
        </p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
          Mutaba&apos;ah
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
          Pantau hasil mutaba&apos;ah harian anak. Pengisian dilakukan oleh
          siswa.
        </p>
      </div>

      {child ? (
        <p className="text-sm text-muted lg:text-right">
          {child.nama} · NIS {child.nis}
        </p>
      ) : null}
    </header>
  );

  return (
    <div>
      {header}

      {data.children.length > 1 ? (
        <nav aria-label="Pilih anak" className="mb-6 flex flex-wrap gap-2">
          {data.children.map((item) => {
            const active = item.id === child?.id;

            return (
              <Link
                key={item.id}
                href={`/ortu/mutabaah?anak=${item.id}`}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
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

      {!child ? (
        <section className={card}>
          <EmptyState
            icon={Users}
            title="Belum ada data anak"
            description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah agar relasi orang tua dan siswa dibuat."
          />
        </section>
      ) : !data.form ? (
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Form mutaba'ah belum aktif"
            description="Hasil mutaba'ah akan muncul di sini setelah admin mengaktifkan form untuk periode PKL."
          />
        </section>
      ) : !data.questions.length ? (
        <section className={card}>
          <EmptyState
            icon={HeartHandshake}
            title="Belum ada pertanyaan"
            description="Form mutaba'ah sudah aktif, tetapi belum memiliki pertanyaan. Hubungi admin sekolah."
          />
        </section>
      ) : (
        <>
          <section
            className={cn(card, "mb-6")}
            aria-labelledby="ringkasan-mutabaah-title"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[13px] font-medium leading-[18px] text-muted">
                  Anak
                </p>
                <h2
                  id="ringkasan-mutabaah-title"
                  className="mt-1 font-display text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink"
                >
                  {child.nama}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {[
                    hubunganLabel[child.hubungan],
                    child.kelas ?? "—",
                    child.jurusan?.nama ?? "—",
                    `NIS ${child.nis}`,
                  ].join(" · ")}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <MutabaahRing
                  value={data.week.filled}
                  total={data.week.total}
                />
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

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[13px] font-medium leading-[18px] text-muted">
                {format(parseISO(data.today), "EEEE, d MMMM yyyy", {
                  locale: localeId,
                })}
              </p>
              <p className="mt-1 font-display text-xl font-semibold leading-7 tracking-[-0.01em] text-ink">
                {data.form.nama}
              </p>
              {data.form.deskripsi ? (
                <p className="mt-1 max-w-[60ch] text-sm leading-[22px] text-muted">
                  {data.form.deskripsi}
                </p>
              ) : null}
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
                Hasil pengisian anak. Halaman ini hanya bisa dilihat.
              </p>
            </div>

            <MutabaahHistory history={data.history} />
          </section>
        </>
      )}
    </div>
  );
}
