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
    lineHeight: 1.5,
    paddingTop: 112,
    paddingBottom: 72,
    paddingHorizontal: 48,
    color: "#111111",
  },
  kop: {
    position: "absolute",
    top: 18,
    left: 30,
    right: 30,
    height: 76,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 30,
    right: 30,
    height: 42,
    objectFit: "contain",
  },
  fallbackHeader: {
    position: "absolute",
    top: 28,
    left: 48,
    right: 48,
    borderBottomWidth: 2,
    borderBottomColor: "#111111",
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
    fontSize: 13,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 2,
  },
  number: {
    textAlign: "center",
    marginBottom: 18,
  },
  meta: {
    textAlign: "right",
    marginBottom: 12,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 9,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: "#777777",
    padding: 8,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  infoLabel: {
    width: 112,
    fontFamily: "Times-Bold",
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    marginTop: 8,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    fontFamily: "Times-Bold",
    fontSize: 9,
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
  signature: {
    marginTop: 28,
    marginLeft: "55%",
    textAlign: "center",
  },
  signatureSpace: {
    height: 44,
  },
  signatureName: {
    fontFamily: "Times-Bold",
  },
});

export function SuratDocument({ data }: { data: SuratPdfData }) {
  const body = getSuratContent(data);
  const tanggal = formatSuratDate(data.surat.tanggalTerbit);
  const company = data.application.perusahaan;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.school.kopDataUrl ? (
          <Image
            src={data.school.kopDataUrl}
            style={styles.kop}
            fixed
          />
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
          <Image
            src={data.school.footerDataUrl}
            style={styles.footer}
            fixed
          />
        ) : (
          <Text style={styles.fallbackFooter} fixed>
            {data.school.nama} · {data.school.alamat}
          </Text>
        )}

        <Text style={styles.title}>{body.title}</Text>
        <Text style={styles.number}>
          Nomor: {data.surat.nomor ?? "—"}
        </Text>

        <Text style={styles.meta}>Subang, {tanggal}</Text>

        {body.paragraphs.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sekolah</Text>
            <Text style={styles.infoValue}>{data.school.nama}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Perusahaan</Text>
            <Text style={styles.infoValue}>
              {company ? `${company.nama}, ${company.alamat}` : "—"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Periode PKL</Text>
            <Text style={styles.infoValue}>
              {data.application.periode?.nama ?? "—"} (
              {formatSuratDate(data.application.tanggalMulai)} –{" "}
              {formatSuratDate(data.application.tanggalSelesai)})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guru pembimbing</Text>
            <Text style={styles.infoValue}>
              {data.application.guru ?? "—"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instruktur</Text>
            <Text style={styles.infoValue}>
              {data.application.instruktur ?? "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Siswa</Text>
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

        <View style={styles.signature}>
          <Text>Subang, {tanggal}</Text>
          <Text>{body.signature},</Text>
          <Text style={styles.signatureSpace}> </Text>
          <Text style={styles.signatureName}>
            {body.signer || "................................"}
          </Text>
          {body.signature === "Kepala Sekolah" && data.school.nip ? (
            <Text>NIP. {data.school.nip}</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
