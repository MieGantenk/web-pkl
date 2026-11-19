import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CircleDashed,
  FileText,
} from "lucide-react";

import { EmptyState } from "@/components/pkl/EmptyState";
import { SiswaForm } from "@/components/pkl/SiswaForm";
import { SiswaStatusButton } from "@/components/pkl/SiswaStatusButton";
import {
  AkunBadge,
  JurnalBadge,
  PengajuanBadge,
  StatusBadge,
} from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getJurusanOptions, getSiswaDetail } from "@/lib/data/admin-siswa";
import {
  postgresUuidPattern,
  type SiswaFormInput,
} from "@/lib/validators/siswa";

export const metadata: Metadata = {
  title: "Detail siswa",
};

export const instant = false;

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMM yyyy", { locale: localeId })
    : "—";
}

export default async function AdminSiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;

  if (!postgresUuidPattern.test(id)) {
    notFound();
  }

  const [data, jurusanOptions] = await Promise.all([
    getSiswaDetail(id),
    getJurusanOptions(),
  ]);

  if (!data) {
    notFound();
  }

  const defaultValues: SiswaFormInput = {
    nama_lengkap: data.pengguna.nama_lengkap,
    username: data.pengguna.username,
    email: data.pengguna.email,
    nis: data.nis,
    nisn: data.nisn ?? "",
    kelas: data.kelas ?? "",
    jurusan_id: data.jurusan_id ?? "",
    telepon: data.telepon ?? "",
    alamat: data.alamat ?? "",
    nama_orangtua: data.nama_orangtua ?? "",
    telepon_orangtua: data.telepon_orangtua ?? "",
    password: "",
  };

  return (
    <div>
      <Link
        href="/admin/siswa"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Kembali ke data siswa
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Data siswa
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            {data.pengguna.nama_lengkap}
          </h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            NIS {data.nis}
            {data.kelas ? ` · ${data.kelas}` : ""}
            {data.jurusan ? ` · ${data.jurusan.nama}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AkunBadge aktif={data.pengguna.aktif} />
          {data.pengajuan ? (
            <PengajuanBadge status={data.pengajuan.status} />
          ) : (
            <StatusBadge
              label="Belum ada pengajuan"
              tone="neutral"
              icon={CircleDashed}
            />
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
          <SiswaForm
            mode="edit"
            siswaId={data.id}
            jurusanOptions={jurusanOptions}
            defaultValues={defaultValues}
          />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-xl font-semibold text-ink">Status akun</h2>
            <div className="mt-3">
              <AkunBadge aktif={data.pengguna.aktif} />
            </div>
            <p className="mt-3 text-sm leading-[22px] text-ink-soft">
              {data.pengguna.aktif
                ? "Siswa dapat masuk dan mengisi jurnal."
                : "Siswa tidak dapat masuk. Data tetap tersimpan."}
            </p>
            <div className="mt-4">
              <SiswaStatusButton
                id={data.id}
                aktif={data.pengguna.aktif}
                nama={data.pengguna.nama_lengkap}
              />
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">
                Penempatan PKL
              </h2>
              <Building2
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            {data.pengajuan ? (
              <div className="mt-3 space-y-4">
                <PengajuanBadge status={data.pengajuan.status} />

                <div>
                  <p className="text-[13px] leading-[18px] text-muted">
                    Perusahaan
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink">
                    {data.pengajuan.perusahaan?.nama ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[13px] leading-[18px] text-muted">
                    Periode
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink">
                    {data.pengajuan.periode?.nama ?? "—"}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Mulai
                    </dt>
                    <dd className="mt-0.5 tabular-nums text-ink-soft">
                      {formatDate(data.pengajuan.tanggal_mulai)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] leading-[18px] text-muted">
                      Selesai
                    </dt>
                    <dd className="mt-0.5 tabular-nums text-ink-soft">
                      {formatDate(data.pengajuan.tanggal_selesai)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={FileText}
                  title="Belum ada pengajuan"
                  description="Siswa belum memiliki pengajuan PKL."
                />
              </div>
            )}
          </section>

          <section className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">
                Jurnal terakhir
              </h2>
              <BookOpen
                className="size-5 shrink-0 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>

            {data.jurnal.length ? (
              <ul className="mt-4 divide-y divide-border">
                {data.jurnal.map((journal) => (
                  <li
                    key={journal.id}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <p className="text-[13px] leading-[18px] text-muted tabular-nums">
                      {formatDate(journal.tanggal)}
                    </p>
                    <p className="mt-0.5 text-sm font-medium leading-[22px] text-ink">
                      {journal.kegiatan}
                    </p>
                    <div className="mt-2">
                      <JurnalBadge status={journal.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={BookOpen}
                  title="Belum ada jurnal"
                  description="Jurnal yang diisi siswa akan muncul di sini."
                />
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
