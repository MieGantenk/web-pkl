import { getCurrentProfile } from "@/lib/auth";
import { getSuratPdfData } from "@/lib/data/admin-surat";
import { renderSuratPdf } from "@/lib/letters/render-surat";
import { createClient } from "@/lib/supabase/server";
import { suratFileName } from "@/lib/surat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  if (!profile || !profile.aktif) {
    return new Response("Tidak berwenang.", { status: 403 });
  }

  // Admin boleh melihat semua surat. Peran lain hanya surat terbit yang
  // lolos RLS surat_select (siswa sendiri, wali, guru/instruktur terkait).
  if (profile.peran !== "admin") {
    const supabase = await createClient();
    const { data: surat, error } = await supabase
      .from("surat")
      .select("id")
      .eq("id", id)
      .eq("status", "terbit")
      .maybeSingle();

    if (error || !surat) {
      return new Response("Tidak berwenang.", { status: 403 });
    }
  }

  const data = await getSuratPdfData(id);

  if (!data) {
    return new Response("Surat tidak ditemukan.", { status: 404 });
  }

  const buffer = await renderSuratPdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = suratFileName(data.surat.jenis, data.surat.nomor);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
