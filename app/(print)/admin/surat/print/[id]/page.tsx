import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { PrintButton } from "@/components/pkl/PrintButton";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSuratPdfData } from "@/lib/data/admin-surat";
import {
  formatSuratDate,
  getSuratContent,
} from "@/lib/letters/content";

export const metadata: Metadata = {
  title: "Cetak Surat",
};

export const instant = false;

export default async function PrintSuratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;
  const data = await getSuratPdfData(id);

  if (!data) {
    notFound();
  }

  const content = getSuratContent(data);
  const tanggal = formatSuratDate(data.surat.tanggalTerbit);
  const company = data.application.perusahaan;

  return (
    <div className="min-h-dvh bg-surface-muted px-4 py-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { background: #fff; }
          .print-paper { box-shadow: none; margin: 0; min-height: 0; }
        }
      `}</style>

      <div className="print-toolbar mx-auto mb-4 flex max-w-[210mm] flex-col gap-3 rounded-md border border-border bg-surface p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/surat?jenis=${data.surat.jenis}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
            Kembali
          </Link>
          <p className="text-sm font-medium text-ink">Pratinjau cetak</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/surat/${data.surat.id}/pdf?download=1`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Unduh PDF
          </Link>
          <PrintButton />
        </div>
      </div>

      <main className="print-paper mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[18mm] py-[16mm] text-[11pt] leading-relaxed text-black shadow-md">
        <div style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {data.school.kopDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.school.kopDataUrl}
              alt="Kop surat sekolah"
              className="mb-8 w-full object-contain"
            />
          ) : (
            <header className="mb-8 border-b-2 border-black pb-3 text-center">
              <p className="text-[14pt] font-bold">{data.school.nama}</p>
              <p className="text-[9pt]">{data.school.alamat}</p>
              <p className="text-[9pt]">
                {[data.school.telepon, data.school.email, data.school.website]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {data.school.akreditasi ? (
                <p className="text-[9pt]">
                  Akreditasi {data.school.akreditasi}
                </p>
              ) : null}
            </header>
          )}

          <h1 className="mb-1 text-center text-[13pt] font-bold underline">
            {content.title}
          </h1>
          <p className="mb-5 text-center">
            Nomor: {data.surat.nomor ?? "—"}
          </p>

          <p className="mb-4 text-right">Subang, {tanggal}</p>

          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-3 text-justify">
              {paragraph}
            </p>
          ))}

          <table className="my-4 w-full border border-black text-[10pt]">
            <tbody>
              <tr>
                <th className="w-[30%] border-b border-black px-2 py-1 text-left align-top">
                  Sekolah
                </th>
                <td className="border-b border-black px-2 py-1">
                  {data.school.nama}
                </td>
              </tr>
              <tr>
                <th className="w-[30%] border-b border-black px-2 py-1 text-left align-top">
                  Perusahaan
                </th>
                <td className="border-b border-black px-2 py-1">
                  {company
                    ? `${company.nama}, ${company.alamat}`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th className="w-[30%] border-b border-black px-2 py-1 text-left align-top">
                  Periode PKL
                </th>
                <td className="border-b border-black px-2 py-1">
                  {data.application.periode?.nama ?? "—"} (
                  {formatSuratDate(data.application.tanggalMulai)} –{" "}
                  {formatSuratDate(data.application.tanggalSelesai)})
                </td>
              </tr>
              <tr>
                <th className="w-[30%] border-b border-black px-2 py-1 text-left align-top">
                  Guru pembimbing
                </th>
                <td className="border-b border-black px-2 py-1">
                  {data.application.guru ?? "—"}
                </td>
              </tr>
              <tr>
                <th className="w-[30%] px-2 py-1 text-left align-top">
                  Instruktur
                </th>
                <td className="px-2 py-1">
                  {data.application.instruktur ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>

          <h2 className="mb-2 mt-5 font-bold">Siswa</h2>
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="w-8 pb-1">No</th>
                <th className="pb-1">Nama</th>
                <th className="w-24 pb-1">NIS</th>
                <th className="w-44 pb-1">Kelas / Jurusan</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student, index) => (
                <tr key={student.id} className="border-b border-neutral-300">
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1">{student.nama}</td>
                  <td className="py-1">{student.nis}</td>
                  <td className="py-1">
                    {[student.kelas, student.jurusan?.nama]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-10 w-[45%] text-center">
            <p>Subang, {tanggal}</p>
            <p>{content.signature},</p>
            <div className="h-20" />
            <p className="font-bold">
              {content.signer || "................................"}
            </p>
            {content.signature === "Kepala Sekolah" && data.school.nip ? (
              <p>NIP. {data.school.nip}</p>
            ) : null}
          </div>

          {data.school.footerDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.school.footerDataUrl}
              alt="Footer surat sekolah"
              className="mt-10 w-full object-contain"
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
