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
import { Textarea } from "@/components/ui/textarea";
import { createSiswaAction, updateSiswaAction } from "@/lib/actions/siswa";
import type { JurusanOption } from "@/lib/data/admin-siswa";
import {
  createSiswaSchema,
  siswaFormSchema,
  type SiswaFormInput,
} from "@/lib/validators/siswa";

export function SiswaForm({
  mode,
  siswaId,
  jurusanOptions,
  defaultValues,
}: {
  mode: "create" | "edit";
  siswaId?: string;
  jurusanOptions: JurusanOption[];
  defaultValues: SiswaFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormInput>({
    resolver: zodResolver(
      mode === "create" ? createSiswaSchema : siswaFormSchema,
    ),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: SiswaFormInput) {
    try {
      const result =
        mode === "create"
          ? await createSiswaAction(values)
          : await updateSiswaAction(siswaId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof SiswaFormInput, {
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
          ? "Siswa dan akun berhasil dibuat."
          : "Data siswa tersimpan.",
      );

      if (mode === "create") {
        router.push(`/admin/siswa/${result.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof SiswaFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof SiswaFormInput, hint?: string) =>
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
          <h2 className="text-xl font-semibold text-ink">Data siswa</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Identitas siswa yang dipakai di jurnal, surat, dan penempatan PKL.
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
            label="NIS"
            htmlFor="nis"
            required
            error={errors.nis?.message}
          >
            <Input
              id="nis"
              inputMode="numeric"
              aria-invalid={invalid("nis")}
              aria-describedby={describedBy("nis")}
              {...register("nis")}
            />
          </Field>

          <Field
            label="NISN"
            htmlFor="nisn"
            hint="Opsional."
            error={errors.nisn?.message}
          >
            <Input
              id="nisn"
              inputMode="numeric"
              aria-invalid={invalid("nisn")}
              aria-describedby={describedBy("nisn", "Opsional.")}
              {...register("nisn")}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Kelas"
            htmlFor="kelas"
            hint="Contoh: XI RPL."
            error={errors.kelas?.message}
          >
            <Input
              id="kelas"
              aria-invalid={invalid("kelas")}
              aria-describedby={describedBy("kelas", "Contoh: XI RPL.")}
              {...register("kelas")}
            />
          </Field>

          <Field
            label="Jurusan"
            htmlFor="jurusan_id"
            error={errors.jurusan_id?.message}
          >
            <Select
              id="jurusan_id"
              aria-invalid={invalid("jurusan_id")}
              aria-describedby={describedBy("jurusan_id")}
              {...register("jurusan_id")}
            >
              <option value="">Belum ditentukan</option>
              {jurusanOptions.map((jurusan) => (
                <option key={jurusan.id} value={jurusan.id}>
                  {jurusan.nama}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Telepon siswa"
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
          label="Alamat"
          htmlFor="alamat"
          hint="Opsional."
          error={errors.alamat?.message}
        >
          <Textarea
            id="alamat"
            aria-invalid={invalid("alamat")}
            aria-describedby={describedBy("alamat", "Opsional.")}
            {...register("alamat")}
          />
        </Field>
      </section>

      <section className="space-y-5 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Akun login</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Dipakai siswa untuk masuk dan mengisi jurnal.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Username"
            htmlFor="username"
            required
            hint="Bisa memakai NIS atau nama unik."
            error={errors.username?.message}
          >
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={invalid("username")}
              aria-describedby={describedBy(
                "username",
                "Bisa memakai NIS atau nama unik.",
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

        {mode === "create" ? (
          <Field
            label="Kata sandi awal"
            htmlFor="password"
            required
            hint="Minimal 8 karakter. Berikan kepada siswa."
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={invalid("password")}
              aria-describedby={describedBy(
                "password",
                "Minimal 8 karakter. Berikan kepada siswa.",
              )}
              {...register("password")}
            />
          </Field>
        ) : null}
      </section>

      <section className="space-y-5 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            Kontak orang tua/wali
          </h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Kontak darurat; bukan akun orang tua.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nama orang tua/wali"
            htmlFor="nama_orangtua"
            hint="Opsional."
            error={errors.nama_orangtua?.message}
          >
            <Input
              id="nama_orangtua"
              aria-invalid={invalid("nama_orangtua")}
              aria-describedby={describedBy(
                "nama_orangtua",
                "Opsional.",
              )}
              {...register("nama_orangtua")}
            />
          </Field>

          <Field
            label="Telepon orang tua/wali"
            htmlFor="telepon_orangtua"
            hint="Opsional."
            error={errors.telepon_orangtua?.message}
          >
            <Input
              id="telepon_orangtua"
              type="tel"
              aria-invalid={invalid("telepon_orangtua")}
              aria-describedby={describedBy(
                "telepon_orangtua",
                "Opsional.",
              )}
              {...register("telepon_orangtua")}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={mode === "create" ? "/admin/siswa" : `/admin/siswa/${siswaId}`}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Buat siswa" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
