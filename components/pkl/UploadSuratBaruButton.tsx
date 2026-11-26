"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { PengajuanBadge } from "@/components/pkl/StatusBadge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { uploadSuratForPengajuanAction } from "@/lib/actions/surat";
import { createClient } from "@/lib/supabase/client";
import type { SuratUploadOption } from "@/lib/data/admin-surat";
import {
  jenisSuratLabel,
  jenisSuratList,
  statusPengajuan,
  type JenisSurat,
} from "@/lib/status";
import { canIssueSuratForApplication } from "@/lib/surat";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;
const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
] as const;
const extensionByType: Record<(typeof allowedTypes)[number], string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function isEligibleJenis(option: SuratUploadOption, jenis: JenisSurat) {
  return canIssueSuratForApplication(
    jenis,
    option.status,
    option.documents,
  );
}

function firstJenisFor(option: SuratUploadOption | null) {
  if (!option) {
    return "";
  }

  return (
    jenisSuratList.find(
      (jenis) =>
        !option.letters[jenis] && isEligibleJenis(option, jenis),
    ) ??
    jenisSuratList.find((jenis) => Boolean(option.letters[jenis])) ??
    jenisSuratList[0]
  );
}

function applicationLabel(option: SuratUploadOption) {
  const students =
    option.students.map((student) => student.nama).join(", ") ||
    "Siswa tidak ditemukan";
  const meta = [option.perusahaan?.nama, statusPengajuan[option.status].label]
    .filter(Boolean)
    .join(" · ");

  return meta ? `${students} — ${meta}` : students;
}

export function UploadSuratBaruButton({
  options,
  tahun,
}: {
  options: SuratUploadOption[];
  tahun: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstApplication = options[0] ?? null;
  const [pengajuanId, setPengajuanId] = useState(
    firstApplication?.pengajuanId ?? "",
  );
  const [jenis, setJenis] = useState<JenisSurat | "">(
    firstJenisFor(firstApplication),
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedApplication =
    options.find((option) => option.pengajuanId === pengajuanId) ?? null;

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
      setError("Gunakan berkas PDF, DOCX, JPG, atau PNG.");
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

  function chooseApplication(nextId: string) {
    const next =
      options.find((option) => option.pengajuanId === nextId) ?? null;
    setPengajuanId(nextId);
    setJenis(firstJenisFor(next));
    setError(null);
  }

  async function upload() {
    if (!pengajuanId || !jenis) {
      setError("Pilih pengajuan dan jenis surat terlebih dahulu.");
      return;
    }

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
      const filePath = `surat/${tahun}/${jenis}/${crypto.randomUUID()}.${extension}`;

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

      const result = await uploadSuratForPengajuanAction({
        pengajuan_id: pengajuanId,
        jenis,
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
        onClick={() => dialogRef.current?.showModal()}
        disabled={!options.length}
        title={
          options.length
            ? undefined
            : "Belum ada pengajuan yang bisa diberi surat."
        }
        className="w-full sm:w-auto"
      >
        <Upload className="size-4" strokeWidth={1.75} aria-hidden />
        Unggah surat
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="unggah-surat-baru-title"
        aria-describedby="unggah-surat-baru-desc"
        onClose={() => {
          setFile(null);
          setError(null);
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[520px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id="unggah-surat-baru-title"
          className="text-xl font-semibold text-ink"
        >
          Unggah surat baru
        </h2>
        <p
          id="unggah-surat-baru-desc"
          className="mt-2 text-sm leading-[22px] text-ink-soft"
        >
          Pilih pengajuan dan jenis surat. Surat akan diterbitkan dan berkasnya
          muncul di halaman surat siswa.
        </p>

        <div className="mt-5 space-y-4">
          <Field
            label="Pengajuan"
            htmlFor="unggah-pengajuan"
            required
            error={error && !pengajuanId ? error : undefined}
          >
            <Select
              id="unggah-pengajuan"
              value={pengajuanId}
              onChange={(event) => chooseApplication(event.target.value)}
            >
              <option value="">Pilih pengajuan</option>
              {options.map((option) => (
                <option key={option.pengajuanId} value={option.pengajuanId}>
                  {applicationLabel(option)}
                </option>
              ))}
            </Select>
          </Field>

          {selectedApplication ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px] leading-[18px] text-muted">
              <span>
                {selectedApplication.students
                  .map((student) => `NIS ${student.nis}`)
                  .join(" · ") || "NIS belum tersedia"}
              </span>
              <PengajuanBadge status={selectedApplication.status} />
            </div>
          ) : null}

          <Field
            label="Jenis surat"
            htmlFor="unggah-jenis"
            required
            error={error && pengajuanId && !jenis ? error : undefined}
          >
            <Select
              id="unggah-jenis"
              value={jenis}
              onChange={(event) =>
                setJenis(event.target.value as JenisSurat | "")
              }
            >
              <option value="">Pilih jenis surat</option>
              {jenisSuratList.map((value) => {
                const existing = selectedApplication?.letters[value];
                const eligible = selectedApplication
                  ? isEligibleJenis(selectedApplication, value)
                  : false;
                const suffix = existing
                  ? ` · sudah terbit${existing.hasFile ? " · file sekolah" : ""}`
                  : eligible
                    ? " · siap diterbitkan"
                    : " · belum diterbitkan";

                return (
                  <option key={value} value={value}>
                    {jenisSuratLabel[value]}
                    {suffix}
                  </option>
                );
              })}
            </Select>
          </Field>

          {pengajuanId ? (
            <p className="text-[13px] leading-[18px] text-muted">
              Unggah berkas surat asli. Status pengajuan hanya maju setelah
              berkas tersimpan dan syarat dokumennya terpenuhi.
            </p>
          ) : null}

          <div>
            <label
              htmlFor="unggah-surat-baru-file"
              className={cn(
                "flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface px-4 py-5 text-center transition-colors duration-[var(--m-fast)] hover:border-brand-500 hover:bg-brand-50",
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
                PDF, DOCX, JPG, atau PNG · maksimal 5 MB
              </span>
              <input
                id="unggah-surat-baru-file"
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
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
          </div>

          {error ? (
            <p
              role="alert"
              className="text-[13px] leading-[18px] text-danger"
            >
              {error}
            </p>
          ) : null}
        </div>

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
            disabled={!file || !pengajuanId || !jenis || uploading}
          >
            Unggah surat
          </Button>
        </div>
      </dialog>
    </>
  );
}
