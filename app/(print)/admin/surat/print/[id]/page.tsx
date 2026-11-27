import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { PrintButton } from "@/components/pkl/PrintButton";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSuratPdfData, type SuratPdfData } from "@/lib/data/admin-surat";
import {
  formatSuratDate,
  getSuratContent,
} from "@/lib/letters/content";

export const metadata: Metadata = {
  title: "Cetak Surat",
};

export const instant = false;

function PrintField({
  label,
  value,
  labelWidth = 64,
  indent = 0,
  showColon = true,
}: {
  label: string;
  value: string | null | undefined;
  labelWidth?: number;
  indent?: number;
  showColon?: boolean;
}) {
  return (
    <div
      className="mb-[2pt] flex min-h-[16pt] items-end"
      style={{ marginLeft: `${indent}pt` }}
    >
      <span className="shrink-0" style={{ width: `${labelWidth}pt` }}>
        {label}
      </span>
      {showColon ? <span className="w-[12pt] shrink-0">:</span> : null}
      <span className="min-w-0 flex-1 border-b border-dotted border-black pb-px">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

function PrintStudentFields({
  data,
  labelWidth = 64,
  indent = 0,
  order = "kelas-first",
}: {
  data: SuratPdfData;
  labelWidth?: number;
  indent?: number;
  order?: "kelas-first" | "jurusan-first";
}) {
  const student = data.students[0];

  if (!student) {
    return <p>Data siswa belum tersedia.</p>;
  }

  const fields = [
    { label: "Nama", value: student.nama },
    { label: "NIS", value: student.nis },
    { label: "Kelas", value: student.kelas },
    { label: "Jurusan", value: student.jurusan?.nama },
  ];
  const orderedFields =
    order === "jurusan-first"
      ? [fields[0], fields[1], fields[3], fields[2]]
      : fields;

  return (
    <>
      {orderedFields.map((field) => (
        <PrintField
          key={field.label}
          label={field.label}
          value={field.value}
          labelWidth={labelWidth}
          indent={indent}
        />
      ))}
    </>
  );
}

function PrintPlacementFields({
  data,
  labelWidths = [76, 96, 108],
  splitDateRange = false,
}: {
  data: SuratPdfData;
  labelWidths?: [number, number, number];
  splitDateRange?: boolean;
}) {
  const start = data.application.tanggalMulai
    ? formatSuratDate(data.application.tanggalMulai)
    : "................";
  const end = data.application.tanggalSelesai
    ? formatSuratDate(data.application.tanggalSelesai)
    : "................";

  return (
    <>
      <PrintField
        label="Tempat PKL"
        value={data.application.perusahaan?.nama}
        labelWidth={labelWidths[0]}
      />
      <PrintField
        label="Alamat Perusahaan"
        value={data.application.perusahaan?.alamat}
        labelWidth={labelWidths[1]}
      />
      {splitDateRange ? (
        <>
          <PrintField
            label="Waktu Pelaksanaan"
            value={`${start} s/d`}
            labelWidth={labelWidths[2]}
          />
          <PrintField
            label=""
            value={end}
            labelWidth={0}
            showColon={false}
          />
        </>
      ) : null}
    </>
  );
}

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
  const jenis = data.surat.jenis;
  const isIzin = jenis === "izin_orang_tua";
  const isPengajuan = jenis === "pengajuan";
  const isKeberangkatan = jenis === "keberangkatan";
  const isTugas = jenis === "tugas_monitoring";
  const isReferenceTemplate = isIzin || isPengajuan || isKeberangkatan || isTugas;
  const accreditation = (data.school.akreditasi ?? "A").split(/[\s(]/)[0];
  const year =
    data.surat.tanggalTerbit?.slice(0, 4) ?? String(new Date().getFullYear());
  const number =
    data.surat.nomor ?? "....../SMK-IT/AS-SYIFA/........../2026";
  const dateRange = `${data.application.tanggalMulai ? formatSuratDate(data.application.tanggalMulai) : "................"} s/d ${data.application.tanggalSelesai ? formatSuratDate(data.application.tanggalSelesai) : "................"}`;
  const schoolUnit = /subang$/i.test(data.school.nama.trim())
    ? data.school.nama
    : `${data.school.nama} Subang`;
  const pageTopClass = isIzin
    ? "pt-[65mm]"
    : isPengajuan
      ? "pt-[56mm]"
      : isKeberangkatan
        ? "pt-[50mm]"
        : isTugas
          ? "pt-[52mm]"
          : "pt-[58mm]";

  return (
    <div className="min-h-dvh bg-surface-muted px-4 py-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { background: #fff; }
          .print-paper { box-shadow: none; margin: 0; width: 210mm; max-width: 210mm; }
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

      <main
        className={`print-paper relative mx-auto min-h-[297mm] w-full max-w-[210mm] overflow-hidden bg-white px-[25mm] pb-[31mm] text-[12pt] leading-[1.25] text-black shadow-md ${pageTopClass}`}
      >
        {data.school.kopDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.school.kopDataUrl}
            alt="Kop surat sekolah"
            className="absolute left-0 top-0 h-[49mm] w-full object-contain"
          />
        ) : (
          <header className="absolute left-[25mm] right-[25mm] top-[6mm] border-b-2 border-black pb-2 text-center">
            <p className="text-[14pt] font-bold">{data.school.nama}</p>
            <p className="text-[9pt]">{data.school.alamat}</p>
            <p className="text-[9pt]">
              {[data.school.telepon, data.school.email, data.school.website]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="text-[9pt]">
              NPSN : 70044614 | TERAKREDITASI “{accreditation}”
            </p>
          </header>
        )}

        {data.school.footerDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.school.footerDataUrl}
            alt="Footer surat sekolah"
            className="absolute bottom-0 left-0 h-[26mm] w-full object-contain"
          />
        ) : (
          <footer className="absolute bottom-[5mm] left-[25mm] right-[25mm] border-t border-neutral-400 pt-1 text-center text-[8pt] text-neutral-700">
            {data.school.nama} · {data.school.alamat}
          </footer>
        )}

        <div
          className="relative z-10"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {isReferenceTemplate ? (
            <>
              <h1 className="mb-2 text-center text-[12pt] font-bold">
                {content.title}
              </h1>

              {isPengajuan ? (
                <>
                  <div className="mb-4">
                    <p>Nomor : {data.surat.nomor ?? ""}</p>
                    <p>Lamp&nbsp;&nbsp;: -</p>
                    <p>Perihal : Pengajuan Tempat PKL</p>
                  </div>
                  <p>Kepada Yth :</p>
                  <p>
                    Bapak/Ibu Pimpinan{" "}
                    {company?.nama ?? "Perusahaan/instansi"}
                  </p>
                  <p>Di tempat</p>
                  <p className="mb-4 mt-4">Dengan Hormat,</p>
                  <p className="mb-3 text-justify">{content.paragraphs[0]}</p>
                  <p className="mb-1 ml-[12mm]">
                    Saya yang bertandatangan di bawah ini :
                  </p>
                  <PrintStudentFields
                    data={data}
                    labelWidth={40}
                    indent={36}
                    order="jurusan-first"
                  />
                  <p className="mb-3 mt-4 text-justify">
                    {content.paragraphs[1]}
                  </p>
                </>
              ) : null}

              {isIzin ? (
                <>
                  <p>Yang bertanda tangan di bawah ini:</p>
                  <PrintField
                    label="Nama Orang Tua/Wali"
                    value=""
                    labelWidth={108}
                  />
                  <PrintField label="Alamat" value="" labelWidth={108} />
                  <PrintField label="No. HP" value="" labelWidth={108} />
                  <p className="mb-1 mt-2">{content.paragraphs[0]}</p>
                  <PrintStudentFields data={data} labelWidth={102} />
                  <p className="mb-3 mt-3 text-justify">
                    Dengan ini memberikan <strong>izin</strong> kepada putra
                    kami untuk mengikuti{" "}
                    <strong>Praktik Kerja Lapangan (PKL)</strong> yang
                    diselenggarakan oleh{" "}
                    <strong>SMK-IT As-Syifa Boarding School</strong> pada:
                  </p>
                  <PrintPlacementFields
                    data={data}
                    labelWidths={[88, 98, 120]}
                    splitDateRange
                  />
                  <p className="mb-3 mt-3 text-justify">
                    {content.paragraphs[1]}
                  </p>
                  <p className="mb-3 text-justify">{content.paragraphs[2]}</p>
                </>
              ) : null}

              {isKeberangkatan ? (
                <>
                  <p className="mb-3 text-center">Nomor: {number}</p>
                  <p>Yang bertanda tangan di bawah ini:</p>
                  <PrintField label="Nama" value={data.school.kepala} />
                  <PrintField label="Jabatan" value="Kepala Sekolah" />
                  <PrintField
                    label="Sekolah"
                    value="SMK-IT As-Syifa Boarding School"
                  />
                  <p className="mb-1 mt-3">
                    Dengan ini menerangkan bahwa:
                  </p>
                  <PrintStudentFields data={data} />
                  <p className="mb-3 mt-3 text-justify">
                    {content.paragraphs[0]}
                  </p>
                  <PrintPlacementFields
                    data={data}
                    labelWidths={[76, 96, 108]}
                  />
                  <p className="mb-3 mt-3 text-justify">
                    {content.paragraphs[1]} {dateRange}.
                  </p>
                  <p className="mb-3 text-justify">{content.paragraphs[2]}</p>
                  <p className="mb-3">{content.paragraphs[3]}</p>
                </>
              ) : null}

              {isTugas ? (
                <>
                  <p className="mb-3 text-center">Nomor : {number}</p>
                  <p>Yang bertanda tangan di bawah ini :</p>
                  <PrintField
                    label="Nama"
                    value={data.school.kepala}
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="NIY"
                    value={data.school.niy}
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="Jabatan"
                    value="Kepala Sekolah"
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="Unit Kerja"
                    value={schoolUnit}
                    labelWidth={96}
                    indent={36}
                  />
                  <p className="mb-1 mt-2">Dengan ini menugaskan kepada :</p>
                  <PrintField
                    label="Nama"
                    value={data.application.guru}
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="NIY"
                    value=""
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="Jabatan"
                    value="Guru"
                    labelWidth={96}
                    indent={36}
                  />
                  <PrintField
                    label="Unit Kerja"
                    value={schoolUnit}
                    labelWidth={96}
                    indent={36}
                  />
                  <p className="mb-2 mt-2 text-justify">
                    {content.paragraphs[0]}
                  </p>
                  <p className="text-justify">{content.paragraphs[1]}</p>
                </>
              ) : null}

              <div
                className={`text-center ${
                  isIzin
                    ? "mt-4 w-[48%] text-left"
                    : isTugas
                      ? "ml-auto mt-6 w-[50%]"
                      : "ml-auto mt-8 w-[35%]"
                }`}
              >
                {isIzin ? (
                  <>
                    <p>.................................., ................. {year}</p>
                    <p>{content.signature}</p>
                    <div className="mb-1 mt-3 h-[14mm] w-[25mm] border border-black" />
                    <p>(tanda tangan dan nama jelas)</p>
                  </>
                ) : (
                  <>
                    <p>Subang, {tanggal}</p>
                    {content.signature.split("\n").map((line, index) => (
                      <p key={`${index}-${line}`}>{line}</p>
                    ))}
                    <div className="h-[11mm]" />
                    <p className="text-[11pt] font-bold underline">
                      {content.signer}
                    </p>
                    <p>NIY. {data.school.niy}</p>
                  </>
                )}
              </div>

              {isTugas ? (
                <table className="mt-4 w-full table-fixed border-collapse border border-black text-[10pt]">
                  <thead>
                    <tr className="font-bold">
                      <th className="w-[25%] border border-black px-2 py-1 text-center">
                        Hari/Tanggal
                      </th>
                      <th className="w-[42%] border border-black px-2 py-1 text-center">
                        Pihak DUDI
                      </th>
                      <th className="w-[33%] border border-black px-2 py-1 text-center">
                        Tanda Tangan dan Cap
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="h-[24mm] border border-black" />
                      <td className="border border-black" />
                      <td className="border border-black" />
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="mb-1 text-center text-[12pt] font-bold">
                {content.title}
              </h1>
              <p className="mb-5 text-center">
                Nomor: {data.surat.nomor ?? "—"}
              </p>

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
                      {company ? `${company.nama}, ${company.alamat}` : "—"}
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

              <div className="ml-auto mt-10 w-[35%] text-center">
                <p>Subang, {tanggal}</p>
                <p>{content.signature}</p>
                <div className="h-20" />
                <p className="font-bold">
                  {content.signer || "................................"}
                </p>
                {content.signature.includes("Kepala Sekolah") ? (
                  <p>NIY. {data.school.niy}</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
