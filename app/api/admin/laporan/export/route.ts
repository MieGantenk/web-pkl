import { createClient } from "@/lib/supabase/server";
import { getLaporanExportRows } from "@/lib/data/admin-laporan";
import { jakartaToday } from "@/lib/date";
import { statusPengajuan } from "@/lib/status";
import { postgresUuidPattern } from "@/lib/validators/common";

function csvCell(value: string | number | null | undefined) {
  let text = String(value ?? "");

  // Cegah formula injection saat CSV dibuka di Excel/Sheets.
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.aktif || profile.peran !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const periode = url.searchParams.get("periode") ?? "";
  const perusahaan = url.searchParams.get("perusahaan") ?? "";
  const kelas = (url.searchParams.get("kelas") ?? "").slice(0, 30);
  const q = (url.searchParams.get("q") ?? "").slice(0, 100).trim();

  const rows = await getLaporanExportRows({
    periode:
      periode && postgresUuidPattern.test(periode) ? periode : "",
    perusahaan:
      perusahaan && postgresUuidPattern.test(perusahaan)
        ? perusahaan
        : "",
    kelas,
    q,
    page: 1,
  });

  const data = [
    [
      "NIS",
      "Nama",
      "Kelas",
      "Jurusan",
      "Perusahaan",
      "Kota",
      "Periode",
      "Status PKL",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Jumlah Jurnal",
      "Jurnal Terakhir",
    ],
    ...rows.map((row) => [
      row.nis,
      row.nama,
      row.kelas ?? "",
      row.jurusan ?? "",
      row.perusahaan ?? "",
      row.kota ?? "",
      row.periode ?? "",
      statusPengajuan[row.status].label,
      row.tanggalMulai ?? "",
      row.tanggalSelesai ?? "",
      row.jurnal,
      row.jurnalTerakhir ?? "",
    ]),
  ];

  const csv =
    "\uFEFF" +
    data.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-pkl-${jakartaToday()}.csv"`,
    },
  });
}
