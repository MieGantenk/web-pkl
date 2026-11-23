import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  CircleAlert,
  Clock,
  FileText,
} from "lucide-react";

import { AnggotaKelompok } from "@/components/pkl/AnggotaKelompok";
import { EmptyState } from "@/components/pkl/EmptyState";
import { PengajuanForm } from "@/components/pkl/PengajuanForm";
import { PengajuanTimeline } from "@/components/pkl/PengajuanTimeline";
import { PengajuanUpload } from "@/components/pkl/PengajuanUpload";
import { SubmitPengajuanButton } from "@/components/pkl/SubmitPengajuanButton";
import {
  DokumenBadge,
  PengajuanBadge,
  SuratBadge,
} from "@/components/pkl/StatusBadge";
import { requireRole } from "@/lib/auth";
import {
  getSiswaPengajuan,
  type PengajuanDokumen,
} from "@/lib/data/siswa-pengajuan";
import {
  jenisSuratLabel,
  statusPengajuanNextStep,
} from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pengajuan PKL",
};

export const instant = false;

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

const documentLabels: Record<PengajuanDokumen["jenis"], string> = {
  izin_orang_tua_ttd: "Scan izin orang tua",
  surat_balasan_perusahaan: "Surat balasan perusahaan",
  surat_pernyataan: "Surat pernyataan",
  dokumen_pendukung: "Dokumen pendukung",
  lainnya: "Dokumen lain",
};

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMM yyyy", { locale: localeId })
    : "—";
}

function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy · HH.mm", {
    locale: localeId,
  });
}

function formatSize(value: number | null) {
  if (!value) return null;

  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export default async function SiswaPengajuanPage() {
  const profile = await requireRole("siswa");
  const data = await getSiswaPengajuan(profile.id);

  if (!data.siswa) {
    return (
      <section className={card}>
        <EmptyState
          icon={CircleAlert}
          title="Profil siswa belum lengkap"
          description="Akun ini belum terhubung ke data siswa. Hubungi admin sekolah untuk melengkapi profil."
        />
      </section>
    );
  }

  const pengajuan = data.pengajuan;
  const isDraft = pengajuan?.status === "draft";
  const isOwner = Boolean(pengajuan?.isOwner);
  const canCreate =
    !pengajuan ||
    pengajuan.status === "ditolak" ||
    pengajuan.status === "dibatalkan";
  const hasOptions = data.options.periode.length > 0;
  const canEditDraft = isDraft && isOwner;
  const canUploadIzin = pengajuan?.status === "izin_ortu_terbit";
  const canUploadBalasan = pengajuan?.status === "pengajuan_terbit";
  const canShowTimeline =
    pengajuan &&
    pengajuan.status !== "ditolak" &&
    pengajuan.status !== "dibatalkan";

  const createDefaults = {
    perusahaan_id: "",
    perusahaan_nama: "",
    perusahaan_alamat: "",
    periode_id: data.options.periode[0]?.id ?? "",
  };
  const editDefaults = {
    perusahaan_id: pengajuan?.perusahaan?.id ?? "",
    perusahaan_nama: "",
    perusahaan_alamat: "",
    periode_id: pengajuan?.periode?.id ?? "",
  };

  return (
    <div className="max-w-[960px]">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium leading-[18px] text-muted">
            Pengajuan PKL
          </p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink">
            Pengajuan PKL
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-[26px] text-ink-soft">
            {pengajuan
              ? "Pantau status pengajuan dan lengkapi dokumen yang diminta."
              : "Ajukan tempat PKL, lengkapi dokumen, dan pantau statusnya di sini."}
          </p>
        </div>

        {pengajuan ? <PengajuanBadge status={pengajuan.status} /> : null}
      </header>

      {pengajuan ? (
        <section className={cn(card, "mb-6")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                Status pengajuan
              </h2>
              <p className="mt-1 max-w-[60ch] text-sm leading-[22px] text-ink-soft">
                {statusPengajuanNextStep[pengajuan.status]}
              </p>
            </div>
            <PengajuanBadge status={pengajuan.status} />
          </div>

          {pengajuan.status === "ditolak" ? (
            <div className="mt-4 flex items-start gap-2 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger">
              <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <div>
                <p className="font-semibold">Pengajuan ditolak.</p>
                <p className="mt-1">
                  {pengajuan.alasanPenolakan ||
                    "Hubungi admin sekolah untuk informasi lebih lanjut."}
                </p>
              </div>
            </div>
          ) : null}

          {isDraft ? (
            <div className="mt-4 border-t border-border pt-4">
              {isOwner ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-[60ch] text-sm leading-[22px] text-ink-soft">
                    Periksa data perusahaan, periode, dan anggota kelompok
                    sebelum mengirim.
                  </p>
                  <SubmitPengajuanButton pengajuanId={pengajuan.id} />
                </div>
              ) : (
                <p className="text-sm leading-[22px] text-ink-soft">
                  Pengajuan masih draft. Ketua kelompok perlu mengirim
                  pengajuan sebelum diproses sekolah.
                </p>
              )}
            </div>
          ) : null}

          {canUploadIzin ? (
            <PengajuanUpload
              pengajuanId={pengajuan.id}
              jenis="izin_orang_tua_ttd"
              label="Unggah izin orang tua bertanda tangan"
              description="Minta tanda tangan orang tua atau wali, lalu unggah scan surat izin yang sudah ditandatangani."
            />
          ) : null}

          {canUploadBalasan ? (
            <PengajuanUpload
              pengajuanId={pengajuan.id}
              jenis="surat_balasan_perusahaan"
              label="Unggah surat balasan perusahaan"
              description="Serahkan surat pengajuan ke perusahaan, lalu unggah surat balasan yang Anda terima."
            />
          ) : null}

          {pengajuan.status === "izin_ortu_diunggah" ||
          pengajuan.status === "balasan_diunggah" ? (
            <div className="mt-4 flex items-start gap-2 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-sm leading-[22px] text-warning">
              <Clock
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>
                Dokumen sedang menunggu verifikasi admin sekolah. Anda akan
                melihat perubahan status di halaman ini.
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      {canShowTimeline && pengajuan ? (
        <section className={cn(card, "mb-6")}>
          <h2 className="text-xl font-semibold text-ink">Tahapan pengajuan</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Tahapan dari pengajuan sampai PKL selesai.
          </p>
          <div className="mt-5">
            <PengajuanTimeline status={pengajuan.status} />
          </div>
        </section>
      ) : null}

      {canEditDraft && pengajuan ? (
        <section className={cn(card, "mb-6")}>
          <h2 className="text-xl font-semibold text-ink">Ubah draft</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Perubahan hanya bisa dilakukan sebelum pengajuan dikirim.
          </p>
          <div className="mt-5">
            <PengajuanForm
              mode="edit"
              pengajuan={pengajuan}
              options={data.options}
              defaultValues={editDefaults}
            />
          </div>
        </section>
      ) : null}

      {canCreate ? (
        <section className={cn(card, "mb-6")}>
          <h2 className="text-xl font-semibold text-ink">
            {pengajuan ? "Ajukan ulang" : "Ajukan tempat PKL"}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-[22px] text-muted">
            Pilih perusahaan yang sudah terdaftar atau tambahkan perusahaan
            baru, lalu pilih periode PKL. Pengajuan disimpan sebagai draft
            terlebih dahulu.
          </p>

          {hasOptions ? (
            <div className="mt-5">
              <PengajuanForm
                mode="create"
                options={data.options}
                defaultValues={createDefaults}
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={CircleAlert}
                title="Pengajuan belum bisa dibuat"
                description="Belum ada periode PKL aktif. Hubungi admin sekolah."
              />
            </div>
          )}
        </section>
      ) : null}

      {pengajuan ? (
        <>
          <section className={cn(card, "mb-6")}>
            <h2 className="text-xl font-semibold text-ink">
              Detail pengajuan
            </h2>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Perusahaan
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {pengajuan.perusahaan?.nama ?? "Belum dipilih"}
                </dd>
                {pengajuan.perusahaan?.kota ? (
                  <dd className="mt-0.5 text-[13px] leading-[18px] text-muted">
                    {pengajuan.perusahaan.kota}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Periode PKL
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {pengajuan.periode
                    ? `${pengajuan.periode.nama} · ${pengajuan.periode.tahun_ajaran}`
                    : "Belum dipilih"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Tanggal PKL
                </dt>
                <dd className="mt-0.5 text-sm text-ink tabular-nums">
                  {formatDate(pengajuan.tanggalMulai)} –{" "}
                  {formatDate(pengajuan.tanggalSelesai)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Peran Anda
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {pengajuan.peran === "ketua" ? "Ketua kelompok" : "Anggota"}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted">
                  Diajukan pada
                </dt>
                <dd className="mt-0.5 text-sm text-ink tabular-nums">
                  {formatDateTime(pengajuan.createdAt)}
                </dd>
              </div>
              {pengajuan.catatan ? (
                <div className="sm:col-span-2">
                  <dt className="text-[13px] font-medium text-muted">
                    Catatan sekolah
                  </dt>
                  <dd className="mt-0.5 text-sm leading-[22px] text-ink">
                    {pengajuan.catatan}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className={cn(card, "mb-6")}>
            <AnggotaKelompok
              pengajuanId={pengajuan.id}
              anggota={pengajuan.anggota}
              canManage={Boolean(canEditDraft)}
            />
          </section>

          <section className={cn(card, "mb-6")} id="dokumen">
            <div className="flex items-center gap-2">
              <FileText
                className="size-5 text-brand-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <h2 className="text-xl font-semibold text-ink">Dokumen</h2>
            </div>

            {pengajuan.dokumen.length ? (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {pengajuan.dokumen.map((dokumen) => (
                  <li
                    key={dokumen.id}
                    className="flex flex-col gap-2 py-3 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {documentLabels[dokumen.jenis]}
                      </p>
                      <p className="mt-0.5 break-words text-[13px] leading-[18px] text-muted">
                        {dokumen.fileName ?? "Tanpa nama berkas"}
                        {formatSize(dokumen.ukuran)
                          ? ` · ${formatSize(dokumen.ukuran)}`
                          : ""}
                        {` · ${formatDateTime(dokumen.diunggahPada)}`}
                      </p>
                      {dokumen.catatan ? (
                        <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">
                          Catatan: {dokumen.catatan}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      {dokumen.fileUrl ? (
                        <a
                          href={dokumen.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Lihat berkas
                        </a>
                      ) : null}
                      <DokumenBadge status={dokumen.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={FileText}
                  title="Belum ada dokumen"
                  description="Dokumen yang Anda unggah akan muncul di sini."
                />
              </div>
            )}
          </section>

          {pengajuan.surat.length ? (
            <section className={cn(card, "mb-6")}>
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="size-5 text-brand-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h2 className="text-xl font-semibold text-ink">Surat</h2>
              </div>

              <ul className="mt-4 divide-y divide-border border-t border-border">
                {pengajuan.surat.map((surat) => (
                  <li
                    key={surat.id}
                    className="flex flex-col gap-2 py-3 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {jenisSuratLabel[surat.jenis]}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted tabular-nums">
                        {surat.nomor ?? "Nomor belum tersedia"}
                        {surat.tanggalTerbit
                          ? ` · ${formatDate(surat.tanggalTerbit)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      {surat.fileUrl ? (
                        <a
                          href={surat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Unduh
                        </a>
                      ) : (
                        <span className="text-[12px] leading-4 text-muted">
                          Berkas belum tersedia
                        </span>
                      )}
                      <SuratBadge status={surat.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {pengajuan ? (
        <p className="text-[13px] leading-[18px] text-muted">
          Butuh bantuan?{" "}
          <Link
            href="/siswa/profil"
            className="font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
          >
            Periksa profil Anda
          </Link>{" "}
          atau hubungi admin sekolah.
        </p>
      ) : null}
    </div>
  );
}
