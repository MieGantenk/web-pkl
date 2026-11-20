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
import { createGuruAction, updateGuruAction } from "@/lib/actions/guru";
import type { JurusanOption } from "@/lib/data/master";
import {
  createGuruSchema,
  guruFormSchema,
  type GuruFormInput,
} from "@/lib/validators/guru";

export function GuruForm({
  mode,
  guruId,
  jurusanOptions,
  defaultValues,
}: {
  mode: "create" | "edit";
  guruId?: string;
  jurusanOptions: JurusanOption[];
  defaultValues: GuruFormInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GuruFormInput>({
    resolver: zodResolver(
      mode === "create" ? createGuruSchema : guruFormSchema,
    ),
    defaultValues,
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: GuruFormInput) {
    try {
      const result =
        mode === "create"
          ? await createGuruAction(values)
          : await updateGuruAction(guruId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof GuruFormInput, {
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
          ? "Guru dan akun berhasil dibuat."
          : "Data guru tersimpan.",
      );

      if (mode === "create") {
        router.push(`/admin/guru/${result.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    }
  }

  const invalid = (field: keyof GuruFormInput) =>
    errors[field] ? true : undefined;

  const describedBy = (field: keyof GuruFormInput, hint?: string) =>
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
          <h2 className="text-xl font-semibold text-ink">Data guru</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Identitas guru yang dipakai di bimbingan, jurnal, dan surat tugas.
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
            label="NIP"
            htmlFor="nip"
            hint="Opsional. Harus unik."
            error={errors.nip?.message}
          >
            <Input
              id="nip"
              inputMode="numeric"
              aria-invalid={invalid("nip")}
              aria-describedby={describedBy("nip", "Opsional. Harus unik.")}
              {...register("nip")}
            />
          </Field>

          <Field
            label="NUPTK"
            htmlFor="nuptk"
            hint="Opsional. Harus unik."
            error={errors.nuptk?.message}
          >
            <Input
              id="nuptk"
              inputMode="numeric"
              aria-invalid={invalid("nuptk")}
              aria-describedby={describedBy("nuptk", "Opsional. Harus unik.")}
              {...register("nuptk")}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Jabatan"
            htmlFor="jabatan"
            hint="Contoh: Guru Pembimbing."
            error={errors.jabatan?.message}
          >
            <Input
              id="jabatan"
              aria-invalid={invalid("jabatan")}
              aria-describedby={describedBy(
                "jabatan",
                "Contoh: Guru Pembimbing.",
              )}
              {...register("jabatan")}
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
      </section>

      <section className="space-y-5 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">Akun login</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Dipakai guru untuk masuk, memverifikasi jurnal, dan memberi tugas.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Username"
            htmlFor="username"
            required
            hint="Bisa memakai NIP atau nama unik."
            error={errors.username?.message}
          >
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={invalid("username")}
              aria-describedby={describedBy(
                "username",
                "Bisa memakai NIP atau nama unik.",
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

        {mode === "create" ? (
          <Field
            label="Kata sandi awal"
            htmlFor="password"
            required
            hint="Minimal 8 karakter. Berikan kepada guru."
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={invalid("password")}
              aria-describedby={describedBy(
                "password",
                "Minimal 8 karakter. Berikan kepada guru.",
              )}
              {...register("password")}
            />
          </Field>
        ) : null}
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={mode === "create" ? "/admin/guru" : `/admin/guru/${guruId}`}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Batal
        </Link>
        <Button type="button" onClick={submit} loading={isSubmitting}>
          {mode === "create" ? "Buat guru" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
