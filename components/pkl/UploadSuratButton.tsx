"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { recordSuratFileAction } from "@/lib/actions/surat";
import { createClient } from "@/lib/supabase/client";
import type { JenisSurat } from "@/lib/status";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;
const allowedTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
const extensionByType: Record<(typeof allowedTypes)[number], string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function UploadSuratButton({
  suratId,
  jenis,
  jenisLabel,
  nomor,
  hasFile,
  tahun,
}: {
  suratId: string;
  jenis: JenisSurat;
  jenisLabel: string;
  nomor: string | null;
  hasFile: boolean;
  tahun: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      const filePath = `surat/${tahun}/${jenis}/${suratId}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("surat")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError("Berkas belum dapat diunggah. Coba lagi.");
        return;
      }

      const result = await recordSuratFileAction({
        surat_id: suratId,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        ukuran: file.size,
      });

      if (!result.ok) {
        await supabase.storage.from("surat").remove([filePath]);
        setError(result.message);
        return;
      }

      toast.success("Surat berhasil diunggah.");
      setFile(null);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Tidak dapat mengunggah berkas. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Upload className="size-4" strokeWidth={1.75} aria-hidden />
        {hasFile ? "Ganti" : "Unggah"}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`unggah-surat-${suratId}-title`}
        aria-describedby={`unggah-surat-${suratId}-desc`}
        onClose={() => {
          setFile(null);
          setError(null);
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[480px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id={`unggah-surat-${suratId}-title`}
          className="text-xl font-semibold text-ink"
        >
          Unggah surat
        </h2>
        <p
          id={`unggah-surat-${suratId}-desc`}
          className="mt-2 text-sm leading-[22px] text-ink-soft"
        >
          {jenisLabel}
          {nomor ? ` · ${nomor}` : ""}. Berkas ini akan muncul di halaman surat
          siswa.
        </p>

        <label
          htmlFor={`surat-file-${suratId}`}
          className={cn(
            "mt-4 flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface px-4 py-5 text-center transition-colors duration-[var(--m-fast)] hover:border-brand-500 hover:bg-brand-50",
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
            id={`surat-file-${suratId}`}
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

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={upload}
            loading={uploading}
            disabled={!file || uploading}
          >
            Unggah surat
          </Button>
        </div>
      </dialog>
    </>
  );
}
