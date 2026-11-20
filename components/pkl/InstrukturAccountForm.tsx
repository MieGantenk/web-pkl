"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateInstrukturAction } from "@/lib/actions/instruktur";
import {
  instrukturFormSchema,
  type InstrukturFormInput,
} from "@/lib/validators/instruktur";

export function InstrukturAccountForm({
  penggunaId,
  defaultValues,
}: {
  penggunaId: string;
  defaultValues: InstrukturFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InstrukturFormInput>({
    resolver: zodResolver(instrukturFormSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: InstrukturFormInput) {
    try {
      const result = await updateInstrukturAction(penggunaId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof InstrukturFormInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success("Data instruktur tersimpan.");
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof InstrukturFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof InstrukturFormInput, hint?: string) =>
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
          <h2 className="text-xl font-semibold text-ink">Akun instruktur</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Perbarui identitas dan kontak akun instruktur.
          </p>
        </div>

        <Field
          label="Nama lengkap"
          htmlFor="nama_lengkap"
          required
          error={errors.nama_lengkap?.message}
        >
          <Input
            id="nama_lengkap"
            autoComplete="name"
            aria-invalid={invalid("nama_lengkap")}
            aria-describedby={describedBy("nama_lengkap")}
            {...register("nama_lengkap")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Username"
            htmlFor="username"
            required
            hint="Bisa memakai nama unik."
            error={errors.username?.message}
          >
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={invalid("username")}
              aria-describedby={describedBy(
                "username",
                "Bisa memakai nama unik.",
              )}
              {...register("username")}
            />
          </Field>

          <Field
            label="Email"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email")}
              {...register("email")}
            />
          </Field>
        </div>

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
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={`/admin/instruktur/${penggunaId}`}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}
