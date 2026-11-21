import { getCurrentProfile } from "@/lib/auth";
import { getSuratPdfData } from "@/lib/data/admin-surat";
import { renderSuratPdf } from "@/lib/letters/render-surat";
import { suratFileName } from "@/lib/surat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.aktif || profile.peran !== "admin") {
    return new Response("Tidak berwenang.", { status: 403 });
  }

  const { id } = await params;
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
