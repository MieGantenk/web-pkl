import { createClient } from "@/lib/supabase/server";
import { statusJurnal } from "@/lib/status";

function csvCell(value: string | null | undefined) {
  return `"${(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  if (!profile?.aktif || profile.peran !== "guru") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: siswa, error: siswaError } = await supabase
    .from("siswa")
    .select("nis, kelas, pengguna:pengguna_id(nama_lengkap)")
    .eq("id", id)
    .maybeSingle();

  if (siswaError || !siswa) {
    return new Response("Siswa tidak ditemukan atau bukan bimbingan Anda.", {
      status: 404,
    });
  }

  const { data: journals, error: journalsError } = await supabase
    .from("jurnal")
    .select(
      "tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, status",
    )
    .eq("siswa_id", id)
    .order("tanggal", { ascending: true });

  if (journalsError) {
    return new Response("Gagal memuat jurnal.", { status: 500 });
  }

  const rows = [
    ["Tanggal", "Mulai", "Selesai", "Kegiatan", "Deskripsi", "Status"],
    ...(journals ?? []).map((journal) => [
      journal.tanggal,
      journal.waktu_mulai?.slice(0, 5) ?? "",
      journal.waktu_selesai?.slice(0, 5) ?? "",
      journal.kegiatan,
      journal.deskripsi ?? "",
      statusJurnal[journal.status].label,
    ]),
  ];

  const csv =
    "\uFEFF" +
    rows
      .map((row) => row.map((cell) => csvCell(String(cell))).join(","))
      .join("\r\n");

  const nis = siswa.nis.replace(/[^a-z0-9_-]/gi, "-");

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jurnal-${nis}.csv"`,
    },
  });
}
