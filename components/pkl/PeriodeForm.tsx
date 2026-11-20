"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createPeriodeAction,
  updatePeriodeAction,
} from "@/lib/actions/periode";
import {
  periodeFormSchema,
  type PeriodeFormInput,
} from "@/lib/validators/periode";

export function PeriodeForm({
  mode,
  periodeId,
  defaultValues,
}: {
  mode: "create" | "edit";
  periodeId?: string;
  defaultValues: PeriodeFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PeriodeFormInput>({
    resolver: zodResolver(periodeFormSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: PeriodeFormInput) {
    try {
      const result =
        mode === "create"
          ? await createPeriodeAction(values)
          : await updatePeriodeAction(periodeId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof PeriodeFormInput, {
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
          ? "Periode PKL berhasil ditambahkan."
          : "Data periode tersimpan.",
      );

      if (mode === "create") {
        router.push(`/admin/periode/${result.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof PeriodeFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof PeriodeFormInput, hint?: string) =>
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
      className="max-w-[680px] space-y-6"
    >
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink">Data periode</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Dipakai sebagai acuan pengajuan, jurnal, dan ringkasan PKL.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nama periode"
            htmlFor="nama"
            required
            hint="Contoh: PKL Ganjil 2026/2027."
            error={errors.nama?.message}
          >
            <Input
              id="nama"
              aria-invalid={invalid("nama")}
              aria-describedby={describedBy(
                "nama",
                "Contoh: PKL Ganjil 2026/2027.",
              )}
              {...register("nama")}
            />
          </Field>

          <Field
            label="Tahun ajaran"
            htmlFor="tahun_ajaran"
            required
            hint="Contoh: 2026/2027."
            error={errors.tahun_ajaran?.message}
          >
            <Input
              id="tahun_ajaran"
              inputMode="numeric"
              aria-invalid={invalid("tahun_ajaran")}
              aria-describedby={describedBy(
                "tahun_ajaran",
                "Contoh: 2026/2027.",
              )}
              {...register("tahun_ajaran")}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Tanggal mulai"
            htmlFor="tanggal_mulai"
            required
            error={errors.tanggal_mulai?.message}
          >
            <Input
              id="tanggal_mulai"
              type="date"
              aria-invalid={invalid("tanggal_mulai")}
              aria-describedby={describedBy("tanggal_mulai")}
              {...register("tanggal_mulai")}
            />
          </Field>

          <Field
            label="Tanggal selesai"
            htmlFor="tanggal_selesai"
            required
            error={errors.tanggal_selesai?.message}
          >
            <Input
              id="tanggal_selesai"
              type="date"
              aria-invalid={invalid("tanggal_selesai")}
              aria-describedby={describedBy("tanggal_selesai")}
              {...register("tanggal_selesai")}
            />
          </Field>
        </div>

        <p className="text-[13px] leading-[18px] text-muted">
          Status aktif diatur terpisah. Hanya satu periode yang dapat aktif
          pada satu waktu.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={
            mode === "create"
              ? "/admin/periode"
              : `/admin/periode/${periodeId}`
          }
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Tambah periode" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
