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
          "Saya selaku orang tua/wali memahami bahwa kegiatan PKL ini merupakan bagian dari program pendidikan sekolah, serta menyetujui putra kami untuk mengikuti kegiatan tersebut dengan penuh tanggung jawab.",
          "Demikian surat izin ini dibuat dengan sebenarnya, untuk digunakan sebagaimana mestinya.",
        ],
        signature: "Orang Tua/Wali",
        signer: "",
      };
    case "pengajuan":
      return {
        title: "SURAT PENGAJUAN TEMPAT PKL",
        paragraphs: [
          "Sesuai dengan Permendikbud No. 50 Tahun 2020 tentang Praktik Kerja Lapangan (PKL) bagi peserta didik, bahwa proses pembelajaran di SMK harus melibatkan Dunia Industri dalam pembimbingan PKL.",
          "Dengan ini kami bermaksud mengajukan permohonan Praktik Kerja Lapangan di perusahaan/instansi/industri yang Bapak/Ibu pimpin. Demikian surat ini disampaikan dan besar harapan kami agar siswa kami dapat diterima di industri yang Bapak/Ibu pimpin.",
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
          `Untuk melakukan monitoring pelaksanaan PKL siswa di ${company} pada ${dates}.`,
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
