"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  const [isNewCompany, setIsNewCompany] = useState(
    defaultValues.perusahaan_id === "baru",
  );

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
            {...register("perusahaan_id", {
              onChange: (event) =>
                setIsNewCompany(event.target.value === "baru"),
            })}
          >
            <option value="">Pilih perusahaan</option>
            {options.perusahaan.map((perusahaan) => (
              <option key={perusahaan.id} value={perusahaan.id}>
                {perusahaan.nama}
                {perusahaan.kota ? ` · ${perusahaan.kota}` : ""}
              </option>
            ))}
            <option value="baru">Perusahaan baru…</option>
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

      <Field
        label="Guru pembimbing"
        htmlFor="guru_pembimbing_id"
        required
        hint="Guru ini yang akan memverifikasi jurnal harian Anda."
        error={errors.guru_pembimbing_id?.message}
      >
        <Select
          id="guru_pembimbing_id"
          aria-invalid={invalid("guru_pembimbing_id")}
          aria-describedby={describedBy(
            "guru_pembimbing_id",
            "Guru ini yang akan memverifikasi jurnal harian Anda.",
          )}
          {...register("guru_pembimbing_id")}
        >
          <option value="">Pilih guru pembimbing</option>
          {options.guru.map((guru) => (
            <option key={guru.id} value={guru.id}>
              {guru.nama}
              {guru.jabatan ? ` · ${guru.jabatan}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      {!options.guru.length ? (
        <div className="rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
          Belum ada akun guru aktif. Hubungi admin sekolah sebelum mengirim
          pengajuan.
        </div>
      ) : null}

      {isNewCompany ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nama perusahaan"
            htmlFor="perusahaan_nama"
            required
            error={errors.perusahaan_nama?.message}
          >
            <Input
              id="perusahaan_nama"
              autoComplete="organization"
              aria-invalid={invalid("perusahaan_nama")}
              aria-describedby={describedBy("perusahaan_nama")}
              {...register("perusahaan_nama")}
            />
          </Field>

          <Field
            label="Alamat perusahaan"
            htmlFor="perusahaan_alamat"
            required
            hint="Dipakai di surat pengajuan."
            error={errors.perusahaan_alamat?.message}
          >
            <Input
              id="perusahaan_alamat"
              autoComplete="street-address"
              aria-invalid={invalid("perusahaan_alamat")}
              aria-describedby={describedBy(
                "perusahaan_alamat",
                "Dipakai di surat pengajuan.",
              )}
              {...register("perusahaan_alamat")}
            />
          </Field>
        </div>
      ) : null}

      <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-[13px] leading-[18px] text-muted">
        Tanggal PKL akan mengikuti periode yang dipilih.
        {isNewCompany
          ? " Perusahaan baru akan ditambahkan ke data master setelah draft disimpan."
          : ""}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Buat draft" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
