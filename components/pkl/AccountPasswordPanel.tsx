"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { PasswordInput } from "@/components/pkl/PasswordInput";
import { Button } from "@/components/ui/button";
import { resetAccountPasswordAction } from "@/lib/actions/account";
import {
  resetAccountPasswordSchema,
  type ResetAccountPasswordInput,
} from "@/lib/validators/password";

export function AccountPasswordPanel({
  penggunaId,
  nama,
  username,
}: {
  penggunaId: string;
  nama: string;
  username: string;
}) {
  const [saved, setSaved] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetAccountPasswordInput>({
    resolver: zodResolver(resetAccountPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: ResetAccountPasswordInput) {
    try {
      const result = await resetAccountPasswordAction(
        penggunaId,
        values,
      );

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            if (field === "password" || field === "confirmPassword") {
              setError(field, { type: "server", message });
            }
          }
        }

        toast.error(result.message);
        return;
      }

      setSaved(true);
      toast.success(
        "Kata sandi diperbarui. Salin sebelum meninggalkan halaman.",
      );
    } catch {
      toast.error(
        "Tidak dapat memperbarui kata sandi. Periksa koneksi lalu coba lagi.",
      );
    }
  }

  return (
    <section
      aria-labelledby="kata-sandi-heading"
      className="rounded-md border border-border bg-surface p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="kata-sandi-heading"
          className="text-xl font-semibold text-ink"
        >
          Kata sandi akun
        </h2>
        <KeyRound
          className="size-5 shrink-0 text-brand-600"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-sm leading-[22px] text-ink-soft">
        Atur ulang kata sandi akun ini. Kata sandi tidak perlu dibuat ulang
        setiap kali pengguna masuk.
      </p>

      <p className="mt-2 text-[13px] leading-[18px] text-muted">
        Akun <span className="font-medium text-ink">{nama}</span> ·{" "}
        <span className="tabular-nums">@{username}</span>
      </p>

      {saved ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-sm border border-success-border bg-success-bg px-3 py-2.5 text-[13px] leading-[18px] text-success"
        >
          Kata sandi baru sudah tersimpan. Salin nilainya sekarang sebelum
          halaman dimuat ulang.
        </div>
      ) : null}

      <form onSubmit={submit} noValidate className="mt-5 space-y-5">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              id="password-baru"
              name={field.name}
              label="Kata sandi baru"
              required
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setSaved(false);
              }}
              onGenerate={(value) =>
                setValue("confirmPassword", value, {
                  shouldValidate: true,
                })
              }
              error={errors.password?.message}
              hint="Minimal 8 karakter. Kata sandi tidak dapat dilihat lagi setelah halaman ditutup."
              autoComplete="new-password"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordInput
              id="ulangi-password-baru"
              name={field.name}
              label="Ulangi kata sandi baru"
              required
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setSaved(false);
              }}
              error={errors.confirmPassword?.message}
              hint="Harus sama dengan kata sandi baru."
              autoComplete="new-password"
              showGenerate={false}
              showCopy={false}
            />
          )}
        />

        <Button
          type="button"
          onClick={submit}
          loading={isSubmitting}
          className="w-full"
        >
          Simpan kata sandi
        </Button>
      </form>
    </section>
  );
}
