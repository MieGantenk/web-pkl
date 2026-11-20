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
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

import type { SuratPdfData } from "@/lib/data/admin-surat";

function formatDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMMM yyyy", { locale: localeId })
    : "—";
}

function letterBody(data: SuratPdfData) {
  const company = data.application.perusahaan?.nama ?? "perusahaan";
  const dates = `${formatDate(data.application.tanggalMulai)} – ${formatDate(
    data.application.tanggalSelesai,
  )}`;
  const guru = data.application.guru ?? "guru pembimbing";
  const student = data.students[0]?.nama ?? "siswa";

  switch (data.surat.jenis) {
    case "izin_orang_tua":
      return {
        title: "SURAT IZIN ORANG TUA/WALI",
        paragraphs: [
          "Yang bertanda tangan di bawah ini, orang tua/wali dari siswa yang tercantum pada surat ini, memberikan izin kepada putra/putri kami untuk mengikuti Praktik Kerja Lapangan (PKL).",
          `Kegiatan dilaksanakan di ${company} pada ${dates}. Kami memahami bahwa PKL merupakan bagian dari program pendidikan sekolah dan menyetujui kegiatan tersebut dengan penuh tanggung jawab.`,
          "Demikian surat izin ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.",
        ],
        signature: "Orang Tua/Wali",
        signer: "",
      };
    case "pengajuan":
      return {
        title: "SURAT PENGAJUAN TEMPAT PKL",
        paragraphs: [
          `Kepada Yth. Pimpinan ${company} di tempat.`,
          "Dengan hormat, kami mengajukan permohonan agar siswa yang tercantum pada surat ini dapat melaksanakan Praktik Kerja Lapangan (PKL) di perusahaan Bapak/Ibu.",
          "Demikian surat pengajuan ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
    case "keberangkatan":
      return {
        title: "SURAT PENGANTAR KEBERANGKATAN PKL",
        paragraphs: [
          `Dengan hormat, kami memberitahukan bahwa siswa yang tercantum pada surat ini akan melaksanakan Praktik Kerja Lapangan (PKL) di ${company}.`,
          `Kegiatan berlangsung pada ${dates}. Kami mohon kesediaan perusahaan untuk menerima dan membimbing siswa tersebut sesuai ketentuan yang berlaku.`,
          "Demikian surat pemberitahuan ini dibuat. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
    case "tugas_monitoring":
      return {
        title: "SURAT TUGAS MONITORING PKL",
        paragraphs: [
          `Kepada Yth. ${guru},`,
          `Dengan ini kami menugaskan Bapak/Ibu untuk melakukan monitoring pelaksanaan PKL siswa di ${company} pada ${dates}.`,
          "Kami mohon Bapak/Ibu memantau kegiatan siswa, memeriksa jurnal, dan memberikan bimbingan selama masa PKL.",
          "Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
    case "pernyataan":
      return {
        title: "SURAT PERNYATAAN SISWA",
        paragraphs: [
          "Yang bertanda tangan di bawah ini, siswa yang tercantum pada surat ini, menyatakan bersedia mengikuti Praktik Kerja Lapangan (PKL) dengan sungguh-sungguh.",
          `Pernyataan ini dibuat sehubungan dengan pelaksanaan PKL di ${company} pada ${dates}.`,
          "Saya akan mematuhi peraturan sekolah, perusahaan, serta menjaga nama baik almamater selama mengikuti kegiatan.",
          "Demikian surat pernyataan ini dibuat dengan sebenarnya.",
        ],
        signature: "Siswa",
        signer: student,
      };
    case "perjanjian":
      return {
        title: "PERJANJIAN KERJA SAMA PKL",
        paragraphs: [
          `Perjanjian kerja sama ini dibuat antara ${data.school.nama} dan ${company} untuk penyelenggaraan Praktik Kerja Lapangan (PKL) siswa.`,
          `Kegiatan dilaksanakan pada ${dates}. Kedua pihak sepakat menjalankan hak dan kewajiban sesuai ketentuan yang berlaku.`,
          "Perjanjian ini dibuat untuk kepentingan pendidikan dan pengembangan kompetensi siswa.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
    case "penarikan":
      return {
        title: "SURAT PENARIKAN SISWA PKL",
        paragraphs: [
          `Dengan hormat, kami memberitahukan bahwa masa Praktik Kerja Lapangan (PKL) siswa di ${company} telah berakhir.`,
          `Dengan surat ini, kami menarik siswa yang tercantum pada surat ini dari perusahaan, terhitung sejak ${formatDate(
            data.application.tanggalSelesai,
          )}.`,
          "Kami mengucapkan terima kasih atas bimbingan dan kerja sama yang diberikan selama kegiatan PKL.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
  }
}

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
  const body = letterBody(data);
  const tanggal = formatDate(data.surat.tanggalTerbit);
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
              {formatDate(data.application.tanggalMulai)} –{" "}
              {formatDate(data.application.tanggalSelesai)})
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
