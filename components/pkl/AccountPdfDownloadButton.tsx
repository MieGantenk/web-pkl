"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AccountExportRole } from "@/lib/account-export";

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

export function AccountPdfDownloadButton({
  role,
  label,
}: {
  role: AccountExportRole;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function downloadPdf() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/akun/export?role=${encodeURIComponent(role)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        toast.error(getErrorMessage(error));
        return;
      }

      if (response.headers.get("content-type") !== "application/pdf") {
        toast.error(`PDF akun ${label} tidak valid. Coba lagi.`);
        return;
      }

      const pdf = await response.blob();
      if (!pdf.size) {
        toast.error(`PDF akun ${label} kosong dan tidak dapat diunduh.`);
        return;
      }

      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `akun-${role}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`PDF akun ${label} berhasil diunduh.`);
    } catch {
      toast.error(
        `Tidak dapat mengunduh PDF akun ${label}. Periksa koneksi lalu coba lagi.`,
      );
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
      Unduh PDF {label}
    </Button>
  );
}
