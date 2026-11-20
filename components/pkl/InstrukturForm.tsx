"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createInstrukturAction } from "@/lib/actions/instruktur";
import type { PerusahaanOption } from "@/lib/data/master";
import {
  createInstrukturSchema,
  type CreateInstrukturInput,
} from "@/lib/validators/instruktur";

export function InstrukturForm({
  perusahaanOptions,
  defaultValues,
}: {
  perusahaanOptions: PerusahaanOption[];
  defaultValues: CreateInstrukturInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateInstrukturInput>({
    resolver: zodResolver(createInstrukturSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: CreateInstrukturInput) {
    try {
      const result = await createInstrukturAction(values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof CreateInstrukturInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success("Instruktur dan akun berhasil dibuat.");
      router.push(`/admin/instruktur/${result.id}`);
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof CreateInstrukturInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof CreateInstrukturInput, hint?: string) =>
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
            Dipakai untuk masuk, memverifikasi jurnal, dan melihat siswa
            perusahaannya.
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

        <Field
          label="Kata sandi awal"
          htmlFor="password"
          required
          hint="Minimal 8 karakter. Berikan kepada instruktur."
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={invalid("password")}
            aria-describedby={describedBy(
              "password",
              "Minimal 8 karakter. Berikan kepada instruktur.",
            )}
            {...register("password")}
          />
        </Field>
      </section>

      <section className="space-y-5 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Penugasan pertama</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Hubungkan instruktur ke perusahaan. Penugasan lain bisa
            ditambahkan setelah akun dibuat.
          </p>
        </div>

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
              {perusahaanOptions.map((perusahaan) => (
                <option key={perusahaan.id} value={perusahaan.id}>
                  {perusahaan.nama}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Peran"
            htmlFor="peran"
            required
            error={errors.peran?.message}
          >
            <Select
              id="peran"
              aria-invalid={invalid("peran")}
              aria-describedby={describedBy("peran")}
              {...register("peran")}
            >
              <option value="instruktur">Instruktur</option>
              <option value="pembimbing">Pembimbing lapangan</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Jabatan"
            htmlFor="jabatan"
            hint="Opsional. Contoh: Supervisor Produksi."
            error={errors.jabatan?.message}
          >
            <Input
              id="jabatan"
              aria-invalid={invalid("jabatan")}
              aria-describedby={describedBy(
                "jabatan",
                "Opsional. Contoh: Supervisor Produksi.",
              )}
              {...register("jabatan")}
            />
          </Field>

          <Field
            label="Telepon di perusahaan"
            htmlFor="telepon_instruktur"
            hint="Opsional."
            error={errors.telepon_instruktur?.message}
          >
            <Input
              id="telepon_instruktur"
              type="tel"
              aria-invalid={invalid("telepon_instruktur")}
              aria-describedby={describedBy(
                "telepon_instruktur",
                "Opsional.",
              )}
              {...register("telepon_instruktur")}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/admin/instruktur"
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          Tambah instruktur
        </Button>
      </div>
    </form>
  );
}
