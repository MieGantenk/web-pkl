"use client";

import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/pkl/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordFromLoginAction } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setOpen(false);
    setError(null);
    setPassword(null);
    setIdentifier("");
    setEmail("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPassword(null);
    setSubmitting(true);

    try {
      const result = await resetPasswordFromLoginAction({
        identifier,
        email,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPassword(result.password);
      toast.success("Kata sandi baru berhasil dibuat.");
    } catch {
      setError("Tidak dapat membuat kata sandi baru. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-8 border-t border-border pt-5">
        <p className="text-[13px] font-semibold leading-[18px] text-ink-soft">
          Lupa kata sandi?
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
        >
          <KeyRound className="size-4" strokeWidth={1.75} aria-hidden />
          Buat kata sandi baru
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-md border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Buat kata sandi baru
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">
            Masukkan username dan email akun yang terdaftar. Kata sandi baru
            akan dibuat otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Tutup formulir kata sandi"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {password ? (
        <div className="mt-4 space-y-3">
          <div
            role="status"
            className="rounded-sm border border-success-border bg-success-bg px-3 py-2.5 text-[13px] leading-[18px] text-success"
          >
            Kata sandi baru sudah aktif. Salin sekarang; kata sandi tidak dapat
            dilihat lagi setelah formulir ditutup.
          </div>
          <PasswordInput
            id="kata-sandi-baru-login"
            label="Kata sandi baru"
            value={password}
            onChange={() => undefined}
            showGenerate={false}
            autoComplete="off"
          />
          <Button type="button" variant="secondary" onClick={close}>
            Tutup
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="reset-identifier"
              className="block text-[13px] font-medium leading-[18px] text-ink"
            >
              Username atau email <span className="text-danger">*</span>
            </label>
            <Input
              id="reset-identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <label
              htmlFor="reset-email"
              className="block text-[13px] font-medium leading-[18px] text-ink"
            >
              Email akun <span className="text-danger">*</span>
            </label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-1.5"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="text-[13px] leading-[18px] text-danger"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" loading={submitting} className="w-full">
            Buat kata sandi otomatis
          </Button>
        </form>
      )}
    </div>
  );
}
