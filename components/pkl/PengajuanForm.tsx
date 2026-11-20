"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  createPengajuanAction,
  updatePengajuanDraftAction,
} from "@/lib/actions/pengajuan";
import type {
  PengajuanOptions,
  PengajuanData,
} from "@/lib/data/siswa-pengajuan";
import {
  pengajuanFormSchema,
  type PengajuanFormInput,
} from "@/lib/validators/pengajuan";

export function PengajuanForm({
  mode,
  pengajuan,
  options,
  defaultValues,
}: {
  mode: "create" | "edit";
  pengajuan?: PengajuanData;
  options: PengajuanOptions;
  defaultValues: PengajuanFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PengajuanFormInput>({
    resolver: zodResolver(pengajuanFormSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: PengajuanFormInput) {
    try {
      const result =
        mode === "create"
          ? await createPengajuanAction(values)
          : await updatePengajuanDraftAction(pengajuan?.id, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof PengajuanFormInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success(
        mode === "create"
          ? "Draft pengajuan tersimpan."
          : "Perubahan draft tersimpan.",
      );
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan pengajuan. Coba lagi.");
    }
  }

  const invalid = (field: keyof PengajuanFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof PengajuanFormInput, hint?: string) =>
    errors[field]
      ? `${field}-error`
      : hint
        ? `${field}-hint`
        : undefined;

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          event.target instanceof HTMLInputElement
        ) {
          event.preventDefault();
          submit();
        }
      }}
      noValidate
      className="max-w-[680px] space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Perusahaan"
          htmlFor="perusahaan_id"
          required
          error={errors.perusahaan_id?.message}
        >
          <Select
            id="perusahaan_id"
            aria-invalid={invalid("perusahaan_id")}
            aria-describedby={describedBy("perusahaan_id")}
            {...register("perusahaan_id")}
          >
            <option value="">Pilih perusahaan</option>
            {options.perusahaan.map((perusahaan) => (
              <option key={perusahaan.id} value={perusahaan.id}>
                {perusahaan.nama}
                {perusahaan.kota ? ` · ${perusahaan.kota}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Periode PKL"
          htmlFor="periode_id"
          required
          error={errors.periode_id?.message}
        >
          <Select
            id="periode_id"
            aria-invalid={invalid("periode_id")}
            aria-describedby={describedBy("periode_id")}
            {...register("periode_id")}
          >
            <option value="">Pilih periode</option>
            {options.periode.map((periode) => (
              <option key={periode.id} value={periode.id}>
                {periode.nama} · {periode.tahun_ajaran}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-[13px] leading-[18px] text-muted">
        Tanggal PKL akan mengikuti periode yang dipilih.
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Buat draft" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
