"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createPerusahaanAction,
  updatePerusahaanAction,
} from "@/lib/actions/perusahaan";
import {
  perusahaanFormSchema,
  type PerusahaanFormInput,
} from "@/lib/validators/perusahaan";

export function PerusahaanForm({
  mode,
  perusahaanId,
  defaultValues,
}: {
  mode: "create" | "edit";
  perusahaanId?: string;
  defaultValues: PerusahaanFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PerusahaanFormInput>({
    resolver: zodResolver(perusahaanFormSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: PerusahaanFormInput) {
    try {
      const result =
        mode === "create"
          ? await createPerusahaanAction(values)
          : await updatePerusahaanAction(perusahaanId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof PerusahaanFormInput, {
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
          ? "Perusahaan berhasil ditambahkan."
          : "Data perusahaan tersimpan.",
      );

      if (mode === "create") {
        router.push(`/admin/perusahaan/${result.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof PerusahaanFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof PerusahaanFormInput, hint?: string) =>
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
          <h2 className="text-xl font-semibold text-ink">Data perusahaan</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Informasi tempat PKL yang dipakai di pengajuan dan surat.
          </p>
        </div>

        <Field
          label="Nama perusahaan"
          htmlFor="nama"
          required
          error={errors.nama?.message}
        >
          <Input
            id="nama"
            autoComplete="organization"
            aria-invalid={invalid("nama")}
            aria-describedby={describedBy("nama")}
            {...register("nama")}
          />
        </Field>

        <Field
          label="Alamat"
          htmlFor="alamat"
          required
          error={errors.alamat?.message}
        >
          <Textarea
            id="alamat"
            autoComplete="street-address"
            aria-invalid={invalid("alamat")}
            aria-describedby={describedBy("alamat")}
            {...register("alamat")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Kota"
            htmlFor="kota"
            hint="Contoh: Subang."
            error={errors.kota?.message}
          >
            <Input
              id="kota"
              autoComplete="address-level2"
              aria-invalid={invalid("kota")}
              aria-describedby={describedBy("kota", "Contoh: Subang.")}
              {...register("kota")}
            />
          </Field>

          <Field
            label="Telepon"
            htmlFor="telepon"
            hint="Opsional."
            error={errors.telepon?.message}
          >
            <Input
              id="telepon"
              type="tel"
              autoComplete="tel"
              aria-invalid={invalid("telepon")}
              aria-describedby={describedBy("telepon", "Opsional.")}
              {...register("telepon")}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Email"
            htmlFor="email"
            hint="Opsional."
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email", "Opsional.")}
              {...register("email")}
            />
          </Field>

          <Field
            label="Website"
            htmlFor="website"
            hint="Opsional. Sertakan https://."
            error={errors.website?.message}
          >
            <Input
              id="website"
              type="url"
              autoComplete="url"
              aria-invalid={invalid("website")}
              aria-describedby={describedBy(
                "website",
                "Opsional. Sertakan https://.",
              )}
              {...register("website")}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={
            mode === "create"
              ? "/admin/perusahaan"
              : `/admin/perusahaan/${perusahaanId}`
          }
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Tambah perusahaan" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
