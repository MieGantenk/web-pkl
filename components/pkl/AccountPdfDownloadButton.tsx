"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "PDF akun belum dapat diunduh. Coba lagi.";
}

export function AccountPdfDownloadButton() {
  const [loading, setLoading] = useState(false);

  async function downloadPdf() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/akun/export", {
        cache: "no-store",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        toast.error(getErrorMessage(error));
        return;
      }

      const pdf = await response.blob();
      if (!pdf.size) {
        toast.error("PDF akun kosong dan tidak dapat diunduh.");
        return;
      }

      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = "akun-pengguna.pdf";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("PDF akun berhasil diunduh.");
    } catch {
      toast.error("Tidak dapat mengunduh PDF akun. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      loading={loading}
      onClick={downloadPdf}
    >
      <Download className="size-4" strokeWidth={1.75} aria-hidden />
      Unduh PDF akun
    </Button>
  );
}
