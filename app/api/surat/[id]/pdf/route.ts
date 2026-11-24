import { getCurrentProfile } from "@/lib/auth";
import { getSuratPdfData } from "@/lib/data/admin-surat";
import { renderSuratPdf } from "@/lib/letters/render-surat";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const download = new URL(request.url).searchParams.get("download") === "1";

  if (data.surat.filePath) {
    const admin = createAdminClient();
    const { data: file, error } = await admin.storage
      .from("surat")
      .download(data.surat.filePath);

    if (!error && file) {
      const extension =
        data.surat.filePath.split(".").pop()?.toLowerCase() ?? "pdf";
      const contentType =
        extension === "pdf"
          ? "application/pdf"
          : extension === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : extension === "png"
              ? "image/png"
              : extension === "jpg" || extension === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream";
      const baseName = suratFileName(
        data.surat.jenis,
        data.surat.nomor,
      ).replace(/\.pdf$/i, "");
      const filename = `${baseName}.${extension}`;

      const forceDownload = extension === "docx";

      return new Response(await file.arrayBuffer(), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `${download || forceDownload ? "attachment" : "inline"}; filename="${filename}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
  }

  const buffer = await renderSuratPdf(data);
  const filename = suratFileName(data.surat.jenis, data.surat.nomor);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
