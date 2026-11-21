"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJurnalAction } from "@/lib/actions/jurnal";
import { createClient } from "@/lib/supabase/client";
import { jurnalFormSchema, type JurnalFormInput } from "@/lib/validators/jurnal";
import { cn } from "@/lib/utils";

const MAX_ORIGINAL = 15 * 1024 * 1024;
const MAX_UPLOAD = 5 * 1024 * 1024;

function fileSize(value: number) {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export function JournalForm({
  siswaId,
  minDate,
  maxDate,
  defaultDate,
}: {
  siswaId: string;
  minDate: string | null;
  maxDate: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JurnalFormInput>({
    resolver: zodResolver(jurnalFormSchema),
    defaultValues: {
      tanggal: defaultDate,
      waktu_mulai: "",
      waktu_selesai: "",
      kegiatan: "",
      deskripsi: "",
    },
  });

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  function updatePhoto(next: File | null) {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (!next) {
      setPhoto(null);
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPhoto(next);
    setPreviewUrl(url);
  }

  async function chooseFile(file: File | null) {
    setPhotoError(null);

    if (!file) {
      updatePhoto(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Gunakan foto JPG atau PNG.");
      return;
    }

    if (file.size > MAX_ORIGINAL) {
      setPhotoError("Ukuran foto asli maksimal 15 MB.");
      return;
    }

    setProcessingPhoto(true);

    try {
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.82,
      });

      if (compressed.size > MAX_UPLOAD) {
        setPhotoError("Foto masih terlalu besar. Pilih foto lain.");
        return;
      }

      updatePhoto(compressed);
    } catch {
      setPhotoError("Foto belum dapat diproses. Pilih foto lain.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  async function onSubmit(values: JurnalFormInput) {
    if (!photo) {
      setPhotoError("Foto kegiatan wajib diunggah.");
      document.getElementById("foto")?.focus();
      return;
    }

    setPhotoError(null);
    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      const extension = photo.type === "image/png" ? "png" : "jpg";
      const filePath = `${siswaId}/${values.tanggal}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("jurnal")
        .upload(filePath, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        setPhotoError("Foto belum dapat diunggah. Coba lagi.");
        return;
      }

      uploadedPath = filePath;

      const result = await createJurnalAction({
        ...values,
        foto_path: filePath,
        foto_mime: photo.type,
        foto_ukuran: photo.size,
      });

      if (!result.ok) {
        await supabase.storage.from("jurnal").remove([filePath]);
        uploadedPath = null;

        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (field.startsWith("foto")) {
              setPhotoError(message);
            } else if (
              field === "tanggal" ||
              field === "waktu_mulai" ||
              field === "waktu_selesai" ||
              field === "kegiatan" ||
              field === "deskripsi"
            ) {
              setError(field, { type: "server", message });
            }
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success("Jurnal tersimpan.");
      router.push("/siswa/jurnal");
      router.refresh();
    } catch {
      if (uploadedPath) {
        await supabase.storage.from("jurnal").remove([uploadedPath]);
      }

      toast.error("Tidak dapat menyimpan jurnal. Coba lagi.");
    }
  }

  const invalid = (field: keyof JurnalFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof JurnalFormInput, hint?: string) =>
    errors[field] ? `${field}-error` : hint ? `${field}-hint` : undefined;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-[680px] space-y-6"
    >
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink">Detail kegiatan</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Tulis kegiatan yang Anda lakukan selama PKL hari ini.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Tanggal"
            htmlFor="tanggal"
            required
            error={errors.tanggal?.message}
          >
            <Input
              id="tanggal"
              type="date"
              min={minDate ?? undefined}
              max={maxDate}
              aria-invalid={invalid("tanggal")}
              aria-describedby={describedBy("tanggal")}
              {...register("tanggal")}
            />
          </Field>

          <Field
            label="Waktu mulai"
            htmlFor="waktu_mulai"
            required
            error={errors.waktu_mulai?.message}
          >
            <Input
              id="waktu_mulai"
              type="time"
              step={60}
              aria-invalid={invalid("waktu_mulai")}
              aria-describedby={describedBy("waktu_mulai")}
              {...register("waktu_mulai")}
            />
          </Field>

          <Field
            label="Waktu selesai"
            htmlFor="waktu_selesai"
            required
            error={errors.waktu_selesai?.message}
          >
            <Input
              id="waktu_selesai"
              type="time"
              step={60}
              aria-invalid={invalid("waktu_selesai")}
              aria-describedby={describedBy("waktu_selesai")}
              {...register("waktu_selesai")}
            />
          </Field>
        </div>

        <Field
          label="Kegiatan"
          htmlFor="kegiatan"
          required
          hint="Ringkas dalam satu baris. Contoh: Menyusun laporan stok gudang."
          error={errors.kegiatan?.message}
        >
          <Input
            id="kegiatan"
            maxLength={200}
            aria-invalid={invalid("kegiatan")}
            aria-describedby={describedBy(
              "kegiatan",
              "Ringkas dalam satu baris. Contoh: Menyusun laporan stok gudang.",
            )}
            {...register("kegiatan")}
          />
        </Field>

        <Field
          label="Deskripsi"
          htmlFor="deskripsi"
          hint="Opsional. Jelaskan hasil atau kendala kegiatan."
          error={errors.deskripsi?.message}
        >
          <Textarea
            id="deskripsi"
            rows={4}
            maxLength={2000}
            aria-invalid={invalid("deskripsi")}
            aria-describedby={describedBy(
              "deskripsi",
              "Opsional. Jelaskan hasil atau kendala kegiatan.",
            )}
            {...register("deskripsi")}
          />
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">Foto kegiatan</h2>
            <p className="mt-1 text-sm leading-[22px] text-muted">
              Foto wajib. JPG atau PNG, akan dikompres otomatis.
            </p>
          </div>
          <span className="text-[13px] text-muted">Wajib</span>
        </div>

        <label
          htmlFor="foto"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!processingPhoto && !isSubmitting) {
              void chooseFile(event.dataTransfer.files?.[0] ?? null);
            }
          }}
          className={cn(
            "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface px-4 py-5 text-center transition-colors duration-[var(--m-fast)] hover:border-brand-500 hover:bg-brand-50",
            dragging && "border-brand-500 bg-brand-50",
            photoError && "border-danger-border bg-danger-bg",
            (processingPhoto || isSubmitting) &&
              "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus
            className="size-6 text-brand-600"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="mt-2 text-sm font-semibold text-ink">
            {photo ? "Ganti foto" : "Tarik foto ke sini atau pilih file"}
          </span>
          <span className="mt-1 text-[12px] leading-4 text-muted">
            JPG atau PNG · maksimal 5 MB setelah dikompres
          </span>
          <input
            id="foto"
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            disabled={processingPhoto || isSubmitting}
            aria-invalid={photoError ? true : undefined}
            aria-describedby={photoError ? "foto-error" : "foto-hint"}
            onChange={(event) => {
              void chooseFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>

        {processingPhoto ? (
          <p aria-live="polite" className="text-[13px] leading-[18px] text-muted">
            Mengompres foto…
          </p>
        ) : null}

        {previewUrl && photo ? (
          <div className="rounded-sm border border-border bg-surface-muted p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau foto kegiatan"
              className="max-h-[320px] w-full rounded-sm object-contain"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="min-w-0 break-all text-[12px] leading-4 text-muted tabular-nums">
                {photo.name} · {fileSize(photo.size)}
              </p>
              <button
                type="button"
                onClick={() => {
                  updatePhoto(null);
                  setPhotoError(null);
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-sm px-2 text-[13px] font-semibold text-danger transition-colors duration-[var(--m-fast)] hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
              >
                <Trash2
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden
                />
                Hapus foto
              </button>
            </div>
          </div>
        ) : null}

        {photoError ? (
          <p
            id="foto-error"
            role="alert"
            className="text-[13px] leading-[18px] text-danger"
          >
            {photoError}
          </p>
        ) : (
          <p id="foto-hint" className="text-[12px] leading-4 text-muted">
            Foto akan dikompres sebelum diunggah. Pastikan kegiatan terlihat
            jelas.
          </p>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/siswa/jurnal"
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={processingPhoto}
        >
          Simpan jurnal
        </Button>
      </div>
    </form>
  );
}
