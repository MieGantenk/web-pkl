import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

import type { SuratPdfData } from "@/lib/data/admin-surat";

export function formatSuratDate(value: string | null) {
  return value
    ? format(parseISO(value), "d MMMM yyyy", { locale: localeId })
    : "—";
}

export function getSuratContent(data: SuratPdfData) {
  const company = data.application.perusahaan?.nama ?? "perusahaan";
  const dates = `${formatSuratDate(
    data.application.tanggalMulai,
  )} – ${formatSuratDate(data.application.tanggalSelesai)}`;
  const student = data.students[0]?.nama ?? "siswa";

  switch (data.surat.jenis) {
    case "izin_orang_tua":
      return {
        title: "SURAT IZIN ORANG TUA/WALI",
        paragraphs: [
          "adalah orang tua/wali dari:",
          "Saya selaku orang tua/wali memahami bahwa kegiatan PKL ini merupakan bagian dari program pendidikan sekolah, serta menyetujui putra kami untuk mengikuti kegiatan tersebut dengan penuh tanggung jawab.",
          "Demikian surat izin ini dibuat dengan sebenarnya, untuk digunakan sebagaimana mestinya.",
        ],
        signature: "Orang Tua/Wali,",
        signer: "",
      };
    case "pengajuan":
      return {
        title: "SURAT PENGAJUAN TEMPAT PKL",
        paragraphs: [
          "Sesuai dengan Permendikbud No. 50 Tahun 2020 Tentang tentang Praktik Kerja Lapangan (PKL) bagi peserta didik, bahwa proses pembelajaran di SMK harus melibatkan Dunia Industri dalam pembimbingan PKL.",
          "Dengan ini bermaksud mengajukan pemohonan Praktik Kerja Lapangan di Perusahaan/instansi/industri yang bapa / ibu pimpin. Demikian surat ini disampaikan dan besar harapan agar kami bisa diterima di Industri yang Bapak/Ibu pimpin.",
        ],
        signature: "Mengetahui,\nKepala SMK-IT As-Syifa\nBoarding School,",
        signer: data.school.kepala ?? "",
      };
    case "keberangkatan":
      return {
        title: "SURAT PENGANTAR KEBERANGKATAN",
        paragraphs: [
          "adalah benar siswa SMK-IT As-Syifa Boarding School yang akan melaksanakan Praktik Kerja Lapangan (PKL) di:",
          "Adapun pelaksanaan PKL akan dilaksanakan mulai tanggal:",
          "Sehubungan dengan itu, Besar harapan kami agar Bapak/Ibu berkenan memberikan kesempatan kepada siswa kami untuk menimba ilmu dan pengalaman melalui program PKL di perusahaan yang Bapak/Ibu pimpin. Demikian permohonan ini kami sampaikan. Atas perhatian serta kesempatan yang diberikan, kami ucapkan terima kasih.",
          "Wassalamu’alaikum Wr. Wb.",
        ],
        signature: "Kepala SMK-IT\nAs-Syifa Boarding School",
        signer: data.school.kepala ?? "",
      };
    case "tugas_monitoring":
      return {
        title: "SURAT TUGAS",
        paragraphs: [
          `Untuk mengantarkan siswa ke tempat PKL di ${company} pada tanggal${data.application.tanggalMulai ? ` ${formatSuratDate(data.application.tanggalMulai)}` : " ................"}.`,
          "Demikian surat pengantar tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.",
        ],
        signature: "Kepala Sekolah\nSMK-IT As-Syifa Boarding School",
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
          `Dengan surat ini, kami menarik siswa yang tercantum pada surat ini dari perusahaan, terhitung sejak ${formatSuratDate(
            data.application.tanggalSelesai,
          )}.`,
          "Kami mengucapkan terima kasih atas bimbingan dan kerja sama yang diberikan selama kegiatan PKL.",
        ],
        signature: "Kepala Sekolah",
        signer: data.school.kepala ?? "",
      };
  }
}
