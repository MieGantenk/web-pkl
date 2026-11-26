"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/pkl/PasswordInput";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createOrangTuaAction } from "@/lib/actions/orang-tua";
import type { SiswaOption } from "@/lib/data/master";
import {
  createOrangTuaSchema,
  type CreateOrangTuaInput,
} from "@/lib/validators/orang-tua";

export function OrangTuaForm({
  siswaOptions,
  defaultValues,
}: {
  siswaOptions: SiswaOption[];
  defaultValues: CreateOrangTuaInput;
}) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrangTuaInput>({
    resolver: zodResolver(createOrangTuaSchema),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: CreateOrangTuaInput) {
    try {
      const result = await createOrangTuaAction(values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof CreateOrangTuaInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success("Akun orang tua dan relasi anak berhasil dibuat.");
      router.push(`/admin/orang-tua/${result.id}`);
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof CreateOrangTuaInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof CreateOrangTuaInput, hint?: string) =>
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
          <h2 className="text-xl font-semibold text-ink">Akun orang tua</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Dipakai untuk masuk dan melihat jurnal, mutaba&apos;ah, serta surat
            anak.
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

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              id="password"
              name={field.name}
              label="Kata sandi awal"
              required
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.password?.message}
              hint="Minimal 8 karakter. Berikan kepada orang tua."
              autoComplete="new-password"
            />
          )}
        />
      </section>

      <section className="space-y-5 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Anak pertama</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Hubungkan akun ke siswa. Anak lain bisa ditambahkan setelah akun
            dibuat.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Siswa"
            htmlFor="siswa_id"
            required
            error={errors.siswa_id?.message}
          >
            <Select
              id="siswa_id"
              aria-invalid={invalid("siswa_id")}
              aria-describedby={describedBy("siswa_id")}
              {...register("siswa_id")}
            >
              <option value="">Pilih siswa</option>
              {siswaOptions.map((siswa) => (
                <option key={siswa.id} value={siswa.id}>
                  {siswa.nama} · {siswa.nis}
                  {siswa.kelas ? ` · ${siswa.kelas}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Hubungan"
            htmlFor="hubungan"
            required
            error={errors.hubungan?.message}
          >
            <Select
              id="hubungan"
              aria-invalid={invalid("hubungan")}
              aria-describedby={describedBy("hubungan")}
              {...register("hubungan")}
            >
              <option value="ayah">Ayah</option>
              <option value="ibu">Ibu</option>
              <option value="wali">Wali</option>
            </Select>
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/admin/orang-tua"
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          Tambah orang tua
        </Button>
      </div>
    </form>
  );
}
