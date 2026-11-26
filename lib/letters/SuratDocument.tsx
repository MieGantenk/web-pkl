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
    fontSize: 10.5,
    lineHeight: 1.45,
    paddingTop: 166,
    paddingBottom: 88,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
    color: "#111111",
  },
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
  npsnLine: {
    position: "absolute",
    top: 121,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 8,
    color: "#0f766e",
  },
  fallbackHeader: {
    position: "absolute",
    top: 20,
    left: 48,
    right: 48,
    borderBottomWidth: 2,
    borderBottomColor: "#0f766e",
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
    fontSize: 12.5,
    textAlign: "center",
    marginBottom: 4,
  },
  number: {
    textAlign: "center",
    marginBottom: 15,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 3,
    minHeight: 15,
  },
  fieldLabel: {
    width: 120,
  },
  fieldColon: {
    width: 12,
  },
  fieldValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    borderStyle: "dotted",
    paddingBottom: 1,
  },
  sectionGap: {
    height: 7,
  },
  signatureRight: {
    marginTop: 22,
    marginLeft: "48%",
    width: "48%",
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
  signatureBox: {
    width: 92,
    height: 48,
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
});

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldColon}>:</Text>
      <View style={styles.fieldValue}>
        <Text>{value || " "}</Text>
      </View>
    </View>
  );
}

function StudentFields({
  data,
}: {
  data: SuratPdfData;
}) {
  const student = data.students[0];

  if (!student) {
    return <Text>Data siswa belum tersedia.</Text>;
  }

  return (
    <>
      <Field label="Nama" value={student.nama} />
      <Field label="NIS" value={student.nis} />
      <Field label="Kelas" value={student.kelas} />
      <Field label="Jurusan" value={student.jurusan?.nama} />
    </>
  );
}

function PlacementFields({ data }: { data: SuratPdfData }) {
  const company = data.application.perusahaan;

  return (
    <>
      <Field label="Tempat PKL" value={company?.nama} />
      <Field label="Alamat Perusahaan" value={company?.alamat} />
      <Field
        label="Waktu Pelaksanaan"
        value={`${formatSuratDate(data.application.tanggalMulai)} s/d ${formatSuratDate(data.application.tanggalSelesai)}`}
      />
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
  const akreditasi = (data.school.akreditasi ?? "A").split(/[\s(]/)[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.school.kopDataUrl ? (
          <>
            <Image src={data.school.kopDataUrl} style={styles.kop} fixed />
            <Text style={styles.npsnLine} fixed>
              NPSN : 70044614 | TERAKREDITASI “{akreditasi}”
            </Text>
          </>
        ) : (
          <View style={styles.fallbackHeader} fixed>
            <Text style={styles.schoolName}>{data.school.nama}</Text>
            <Text style={styles.schoolMeta}>{data.school.alamat}</Text>
            <Text style={styles.schoolMeta}>
              {[data.school.telepon, data.school.email, data.school.website]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {data.school.akreditasi ? (
              <Text style={styles.schoolMeta}>
                Akreditasi {data.school.akreditasi}
              </Text>
            ) : null}
          </View>
        )}

        {data.school.footerDataUrl ? (
          <Image src={data.school.footerDataUrl} style={styles.footer} fixed />
        ) : (
          <Text style={styles.fallbackFooter} fixed>
            {data.school.nama} · {data.school.alamat}
          </Text>
        )}

        <Text style={styles.title}>{body.title}</Text>
        <Text style={styles.number}>
          Nomor: {data.surat.nomor ?? "—"}
        </Text>

        {isPengajuan ? (
          <>
            <Text>Kepada Yth.</Text>
            <Text>
              Bapak/Ibu Pimpinan {data.application.perusahaan?.nama ?? "Perusahaan"}
            </Text>
            <Text>Di tempat</Text>
            <View style={styles.sectionGap} />
            <Text>Dengan Hormat,</Text>
            <View style={styles.sectionGap} />
            <Text>Yang bertanda tangan di bawah ini:</Text>
            <StudentFields data={data} />
            <View style={styles.sectionGap} />
            <Text>Tempat PKL yang dituju:</Text>
            <PlacementFields data={data} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {isIzin ? (
          <>
            <Text>Yang bertanda tangan di bawah ini:</Text>
            <Field label="Nama Orang Tua/Wali" value="" />
            <Field label="Alamat" value="" />
            <Field label="No. HP" value="" />
            <Text>adalah orang tua/wali dari:</Text>
            <StudentFields data={data} />
            <View style={styles.sectionGap} />
            <Text>Dengan ini memberikan izin kepada putra kami untuk mengikuti Praktik Kerja Lapangan (PKL) pada:</Text>
            <PlacementFields data={data} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {isKeberangkatan ? (
          <>
            <Text>Yang bertanda tangan di bawah ini:</Text>
            <Field label="Nama" value={data.school.kepala} />
            <Field label="Jabatan" value="Kepala Sekolah" />
            <Field label="Sekolah" value={data.school.nama} />
            <Text>Dengan ini menerangkan bahwa:</Text>
            <StudentFields data={data} />
            <View style={styles.sectionGap} />
            <Text>
              adalah benar siswa SMK-IT As-Syifa Boarding School yang akan
              melaksanakan Praktik Kerja Lapangan (PKL) di:
            </Text>
            <PlacementFields data={data} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {isTugas ? (
          <>
            <Text>Yang bertanda tangan di bawah ini:</Text>
            <Field label="Nama" value={data.school.kepala} />
            <Field label="Jabatan" value="Kepala Sekolah" />
            <Field label="Unit Kerja" value={data.school.nama} />
            <Text>Dengan ini menugaskan kepada:</Text>
            <Field label="Nama" value={data.application.guru} />
            <Field label="Jabatan" value="Guru Pembimbing" />
            <Field label="Unit Kerja" value={data.school.nama} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

        {!isPengajuan && !isIzin && !isKeberangkatan && !isTugas ? (
          <>
            <StudentFields data={data} />
            <View style={styles.sectionGap} />
          </>
        ) : null}

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

        <View style={isIzin ? styles.signatureLeft : styles.signatureRight}>
          <Text>
            Subang, {tanggal}
          </Text>
          <Text>{body.signature},</Text>
          {isIzin ? <View style={styles.signatureBox} /> : <Text style={styles.signatureSpace}> </Text>}
          <Text style={styles.signatureName}>
            {body.signer || "................................"}
          </Text>
          {body.signature === "Kepala Sekolah" && data.school.nip ? (
            <Text>NIP. {data.school.nip}</Text>
          ) : null}
          {isIzin ? <Text>(tanda tangan dan nama jelas)</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
