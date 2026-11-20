"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { recordDokumenAction } from "@/lib/actions/pengajuan";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;
const allowedTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
const extensionByType: Record<(typeof allowedTypes)[number], string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function PengajuanUpload({
  pengajuanId,
  jenis,
  label,
  description,
}: {
  pengajuanId: string;
  jenis: "izin_orang_tua_ttd" | "surat_balasan_perusahaan";
  label: string;
  description: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputId = `dokumen-${jenis}`;

  function chooseFile(nextFile: File | null) {
    setError(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (
      !allowedTypes.includes(
        nextFile.type as (typeof allowedTypes)[number],
      )
    ) {
      setError("Gunakan berkas PDF, JPG, atau PNG.");
      setFile(null);
      return;
    }

    if (nextFile.size > MAX_SIZE) {
      setError("Ukuran berkas maksimal 5 MB. Kompres atau pilih berkas lain.");
      setFile(null);
      return;
    }

    setFile(nextFile);
  }

  async function upload() {
    if (!file) {
      setError("Pilih berkas terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const extension =
        extensionByType[file.type as (typeof allowedTypes)[number]];
      const filePath = `${pengajuanId}/${jenis}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("dokumen")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError("Berkas belum dapat diunggah. Coba lagi.");
        return;
      }

      const result = await recordDokumenAction({
        pengajuan_id: pengajuanId,
        jenis,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        ukuran: file.size,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      toast.success("Dokumen berhasil diunggah.");
      setFile(null);
      router.refresh();
    } catch {
      setError("Tidak dapat mengunggah berkas. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-[13px] font-medium leading-[18px] text-ink">{label}</p>
      <p className="mt-1 text-[13px] leading-[18px] text-muted">
        {description}
      </p>

      <label
        htmlFor={inputId}
        className={cn(
          "mt-3 flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface px-4 py-5 text-center transition-colors duration-[var(--m-fast)] hover:border-brand-500 hover:bg-brand-50",
          error && "border-danger-border bg-danger-bg",
        )}
      >
        <Upload
          className="size-6 text-brand-600"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="mt-2 text-sm font-semibold text-ink">
          {file ? file.name : "Pilih berkas"}
        </span>
        <span className="mt-1 text-[12px] leading-4 text-muted">
          PDF, JPG, atau PNG · maksimal 5 MB
        </span>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => {
            chooseFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </label>

      {file ? (
        <p className="mt-2 text-[12px] leading-4 text-muted tabular-nums">
          {Math.max(1, Math.round(file.size / 1024))} KB
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-2 text-[13px] leading-[18px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-3">
        <Button
          type="button"
          onClick={upload}
          loading={uploading}
          disabled={!file}
        >
          Unggah dokumen
        </Button>
      </div>
    </div>
  );
}
