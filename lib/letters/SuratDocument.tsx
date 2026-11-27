/* eslint-disable jsx-a11y/alt-text */
import "server-only";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { SuratPdfData } from "@/lib/data/admin-surat";
import { formatSuratDate, getSuratContent } from "./content";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.25,
    paddingTop: 166,
    paddingBottom: 88,
    paddingHorizontal: 72,
    backgroundColor: "#ffffff",
    color: "#111111",
  },
  izinPage: { paddingTop: 184 },
  pengajuanPage: { paddingTop: 158 },
  keberangkatanPage: { paddingTop: 142 },
  tugasPage: { paddingTop: 147 },
  kop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595.28,
    height: 139,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 595.28,
    height: 74,
    objectFit: "contain",
  },
  fallbackHeader: {
    position: "absolute",
    top: 20,
    left: 72,
    right: 72,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 8,
    textAlign: "center",
  },
  schoolName: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
  },
  schoolMeta: {
    fontSize: 8.5,
    textAlign: "center",
    marginTop: 2,
  },
  fallbackFooter: {
    position: "absolute",
    bottom: 18,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#999999",
    paddingTop: 4,
    fontSize: 8,
    textAlign: "center",
    color: "#555555",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  number: {
    textAlign: "center",
    marginBottom: 15,
  },
  numberLeft: {
    marginBottom: 14,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 8,
  },
  indented: {
    marginLeft: 36,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
    minHeight: 16,
  },
  fieldLabel: {
    width: 64,
  },
  fieldColon: {
    width: 12,
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  fieldValue: {
    flex: 1,
  },
  sectionGap: {
    height: 7,
  },
  signatureRight: {
    marginTop: 22,
    marginLeft: "65%",
    width: "35%",
    textAlign: "center",
  },
  signatureTask: {
    marginTop: 22,
    marginLeft: "50%",
    width: "50%",
    textAlign: "center",
  },
  signatureLeft: {
    marginTop: 22,
    width: "48%",
    textAlign: "left",
  },
  signatureSpace: {
    height: 40,
  },
  signatureName: {
    fontFamily: "Times-Bold",
  },
  referenceSignatureName: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    textDecoration: "underline",
  },
  signatureBox: {
    width: 72,
    height: 40,
    borderWidth: 0.5,
    borderColor: "#111111",
    marginTop: 8,
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginTop: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    paddingVertical: 3,
    fontSize: 9,
  },
  colNo: { width: 22 },
  colName: { flex: 2 },
  colNis: { width: 65 },
  colClass: { flex: 1.2 },
  dudiTable: {
    marginTop: 16,
    borderWidth: 0.7,
    borderColor: "#111111",
  },
  dudiTableRow: {
    flexDirection: "row",
  },
  dudiHeaderCell: {
    borderRightWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: "#111111",
    paddingVertical: 5,
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 10,
  },
  dudiBodyCell: {
    height: 68,
    borderRightWidth: 0.7,
    borderColor: "#111111",
  },
  dudiCellLast: {
    borderRightWidth: 0,
  },
  dudiDateColumn: { width: "25%" },
  dudiCompanyColumn: { width: "42%" },
  dudiSignatureColumn: { width: "33%" },
});

function Field({
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
    <View style={[styles.fieldRow, indent ? { marginLeft: indent } : undefined]}>
      <Text style={[styles.fieldLabel, { width: labelWidth }]}>{label}</Text>
      {showColon ? <Text style={styles.fieldColon}>:</Text> : null}
      <View style={styles.fieldValue}>
        <Text>{value || " "}</Text>
      </View>
    </View>
  );
}

function StudentFields({
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
    return <Text>Data siswa belum tersedia.</Text>;
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
        <Field
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

function PlacementFields({
  data,
  labelWidths = [76, 96, 108],
  showDateRange = false,
}: {
  data: SuratPdfData;
  labelWidths?: [number, number, number];
  showDateRange?: boolean;
}) {
  const company = data.application.perusahaan;
  const start = formatSuratDate(data.application.tanggalMulai);
  const end = formatSuratDate(data.application.tanggalSelesai);

  return (
    <>
      <Field label="Tempat PKL" value={company?.nama} labelWidth={labelWidths[0]} />
      <Field
        label="Alamat Perusahaan"
        value={company?.alamat}
        labelWidth={labelWidths[1]}
      />
      {showDateRange ? (
        <Field
          label="Waktu Pelaksanaan"
          value={`${start} s/d ${end}`}
          labelWidth={labelWidths[2]}
        />
      ) : null}
    </>
  );
}

export function SuratDocument({ data }: { data: SuratPdfData }) {
  const body = getSuratContent(data);
  const tanggal = formatSuratDate(data.surat.tanggalTerbit);
  const jenis = data.surat.jenis;
  const isIzin = jenis === "izin_orang_tua";
  const isPengajuan = jenis === "pengajuan";
  const isKeberangkatan = jenis === "keberangkatan";
  const isTugas = jenis === "tugas_monitoring";
  const isReferenceTemplate = isIzin || isPengajuan || isKeberangkatan || isTugas;
  const akreditasi = (data.school.akreditasi ?? "A").split(/[\s(]/)[0];
  const year =
    data.surat.tanggalTerbit?.slice(0, 4) ?? String(new Date().getFullYear());
  const nomor =
    data.surat.nomor ?? "....../SMK-IT/AS-SYIFA/........../2026";
  const dateRange = `${formatSuratDate(data.application.tanggalMulai)} s/d ${formatSuratDate(data.application.tanggalSelesai)}`;
  const schoolUnit = /subang$/i.test(data.school.nama.trim())
    ? data.school.nama
    : `${data.school.nama} Subang`;
  const pageStyle = isIzin
    ? styles.izinPage
    : isPengajuan
      ? styles.pengajuanPage
      : isKeberangkatan
        ? styles.keberangkatanPage
        : isTugas
          ? styles.tugasPage
          : undefined;

  return (
    <Document>
      <Page size="A4" style={[styles.page, pageStyle]}>
        {data.school.kopDataUrl ? (
          <Image src={data.school.kopDataUrl} style={styles.kop} fixed />
        ) : (
          <View style={styles.fallbackHeader} fixed>
            <Text style={styles.schoolName}>{data.school.nama}</Text>
            <Text style={styles.schoolMeta}>{data.school.alamat}</Text>
            <Text style={styles.schoolMeta}>
              {[data.school.telepon, data.school.email, data.school.website]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <Text style={styles.schoolMeta}>
              NPSN : 70044614 | TERAKREDITASI “{akreditasi}”
            </Text>
          </View>
        )}

        {data.school.footerDataUrl ? (
          <Image src={data.school.footerDataUrl} style={styles.footer} fixed />
        ) : (
          <Text style={styles.fallbackFooter} fixed>
            {data.school.nama} · {data.school.alamat}
          </Text>
        )}

        {isReferenceTemplate ? (
          <>
            <Text style={styles.title}>{body.title}</Text>

            {isPengajuan ? (
              <>
                <View style={styles.numberLeft}>
                  <Text>Nomor : {data.surat.nomor ?? ""}</Text>
                  <Text>Lamp  : -</Text>
                  <Text>Perihal : Pengajuan Tempat PKL</Text>
                </View>
                <Text>Kepada Yth :</Text>
                <Text>
                  Bapak/Ibu Pimpinan{" "}
                  {data.application.perusahaan?.nama ?? "Perusahaan/instansi"}
                </Text>
                <Text>Di tempat</Text>
                <View style={styles.sectionGap} />
                <Text>Dengan Hormat,</Text>
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>{body.paragraphs[0]}</Text>
                <Text style={[styles.paragraph, styles.indented]}>
                  Saya yang bertandatangan di bawah ini :
                </Text>
                <StudentFields
                  data={data}
                  labelWidth={40}
                  indent={36}
                  order="jurusan-first"
                />
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>{body.paragraphs[1]}</Text>
              </>
            ) : null}

            {isIzin ? (
              <>
                <Text>Yang bertanda tangan di bawah ini:</Text>
                <Field label="Nama Orang Tua/Wali" value="" labelWidth={108} />
                <Field label="Alamat" value="" labelWidth={108} />
                <Field label="No. HP" value="" labelWidth={108} />
                <View style={styles.sectionGap} />
                <Text>{body.paragraphs[0]}</Text>
                <StudentFields data={data} labelWidth={102} />
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>
                  Dengan ini memberikan <Text style={styles.bold}>izin</Text>{" "}
                  kepada putra kami untuk mengikuti{" "}
                  <Text style={styles.bold}>
                    Praktik Kerja Lapangan (PKL)
                  </Text>{" "}
                  yang diselenggarakan oleh{" "}
                  <Text style={styles.bold}>
                    SMK-IT As-Syifa Boarding School
                  </Text>{" "}
                  pada:
                </Text>
                <PlacementFields
                  data={data}
                  labelWidths={[88, 98, 120]}
                  showDateRange
                />
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>{body.paragraphs[1]}</Text>
                <Text style={styles.paragraph}>{body.paragraphs[2]}</Text>
              </>
            ) : null}

            {isKeberangkatan ? (
              <>
                <Text style={styles.number}>
                  Nomor: {data.surat.nomor ?? "....../SMK-IT/AS-SYIFA/........../2026"}
                </Text>
                <Text>Yang bertanda tangan di bawah ini:</Text>
                <Field label="Nama" value={data.school.kepala} />
                <Field label="Jabatan" value="Kepala Sekolah" />
                <Field
                  label="Sekolah"
                  value="SMK-IT As-Syifa Boarding School"
                />
                <View style={styles.sectionGap} />
                <Text>Dengan ini menerangkan bahwa:</Text>
                <StudentFields data={data} />
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>{body.paragraphs[0]}</Text>
                <PlacementFields
                  data={data}
                  labelWidths={[76, 96, 108]}
                />
                <View style={styles.sectionGap} />
                <Text style={styles.paragraph}>
                  {body.paragraphs[1]} {dateRange}.
                </Text>
                <Text style={styles.paragraph}>{body.paragraphs[2]}</Text>
                <Text style={styles.paragraph}>{body.paragraphs[3]}</Text>
              </>
            ) : null}

            {isTugas ? (
              <>
                <Text style={styles.number}>Nomor : {nomor}</Text>
                <Text>Yang bertanda tangan di bawah ini :</Text>
                <Field
                  label="Nama"
                  value={data.school.kepala}
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="NIY"
                  value={data.school.niy}
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="Jabatan"
                  value="Kepala Sekolah"
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="Unit Kerja"
                  value={schoolUnit}
                  labelWidth={96}
                  indent={36}
                />
                <Text>Dengan ini menugaskan kepada :</Text>
                <Field
                  label="Nama"
                  value={data.application.guru}
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="NIY"
                  value=""
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="Jabatan"
                  value="Guru"
                  labelWidth={96}
                  indent={36}
                />
                <Field
                  label="Unit Kerja"
                  value={schoolUnit}
                  labelWidth={96}
                  indent={36}
                />
                <Text style={styles.paragraph}>{body.paragraphs[0]}</Text>
                <Text style={styles.paragraph}>{body.paragraphs[1]}</Text>
              </>
            ) : null}

            <View
              style={
                isIzin
                  ? styles.signatureLeft
                  : isTugas
                    ? styles.signatureTask
                    : styles.signatureRight
              }
            >
              {isIzin ? (
                <>
                  <Text>
                    .................................., ................. {year}
                  </Text>
                  <Text>{body.signature}</Text>
                  <View style={styles.signatureBox} />
                  <Text>(tanda tangan dan nama jelas)</Text>
                </>
              ) : (
                <>
                  <Text>Subang, {tanggal}</Text>
                  <Text>{body.signature}</Text>
                  <Text style={styles.signatureSpace}> </Text>
                  <Text style={styles.referenceSignatureName}>
                    {body.signer}
                  </Text>
                  <Text>NIY. {data.school.niy}</Text>
                </>
              )}
            </View>

            {isTugas ? (
              <View style={styles.dudiTable}>
                <View style={styles.dudiTableRow}>
                  <Text style={[styles.dudiHeaderCell, styles.dudiDateColumn]}>
                    Hari/Tanggal
                  </Text>
                  <Text
                    style={[
                      styles.dudiHeaderCell,
                      styles.dudiCompanyColumn,
                    ]}
                  >
                    Pihak DUDI
                  </Text>
                  <Text
                    style={[
                      styles.dudiHeaderCell,
                      styles.dudiSignatureColumn,
                      styles.dudiCellLast,
                    ]}
                  >
                    Tanda Tangan dan Cap
                  </Text>
                </View>
                <View style={styles.dudiTableRow}>
                  <View
                    style={[
                      styles.dudiBodyCell,
                      styles.dudiDateColumn,
                    ]}
                  />
                  <View
                    style={[
                      styles.dudiBodyCell,
                      styles.dudiCompanyColumn,
                    ]}
                  />
                  <View
                    style={[
                      styles.dudiBodyCell,
                      styles.dudiSignatureColumn,
                      styles.dudiCellLast,
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.title}>{body.title}</Text>
            <Text style={styles.number}>Nomor: {data.surat.nomor ?? "—"}</Text>

            <StudentFields data={data} />
            <View style={styles.sectionGap} />

            {body.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}

            {data.students.length > 1 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.colNo}>No</Text>
                  <Text style={styles.colName}>Nama</Text>
                  <Text style={styles.colNis}>NIS</Text>
                  <Text style={styles.colClass}>Kelas / Jurusan</Text>
                </View>
                {data.students.map((student, index) => (
                  <View key={student.id} style={styles.tableRow}>
                    <Text style={styles.colNo}>{index + 1}</Text>
                    <Text style={styles.colName}>{student.nama}</Text>
                    <Text style={styles.colNis}>{student.nis}</Text>
                    <Text style={styles.colClass}>
                      {[student.kelas, student.jurusan?.nama]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            <View
              style={isIzin ? styles.signatureLeft : styles.signatureRight}
            >
              <Text>Subang, {tanggal}</Text>
              <Text>{body.signature}</Text>
              {isIzin ? (
                <View style={styles.signatureBox} />
              ) : (
                <Text style={styles.signatureSpace}> </Text>
              )}
              <Text style={styles.signatureName}>
                {body.signer || "................................"}
              </Text>
              {body.signature.includes("Kepala Sekolah") ? (
                <Text>NIY. {data.school.niy}</Text>
              ) : null}
              {isIzin ? (
                <Text>(tanda tangan dan nama jelas)</Text>
              ) : null}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}
