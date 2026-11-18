"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    try {
      const result = await loginAction(values);
      if (!result.ok) {
        setServerError(result.message);
      }
    } catch (error) {
      if (isNextRedirect(error)) {
        throw error;
      }
      setServerError(
        "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {serverError ? (
        <div
          role="alert"
          className="login-error flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 text-sm leading-[22px] text-danger"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{serverError}</span>
        </div>
      ) : null}

      <div className="login-field">
        <label
          htmlFor="identifier"
          className="block text-[13px] font-medium leading-[18px] text-ink"
        >
          ID pengguna atau email <span className="text-danger">*</span>
        </label>
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          required
          aria-required="true"
          aria-invalid={errors.identifier ? true : undefined}
          aria-describedby={
            errors.identifier ? "identifier-error" : "identifier-hint"
          }
          className="mt-1.5"
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p
            id="identifier-error"
            className="mt-1.5 text-xs leading-4 text-danger"
          >
            {errors.identifier.message}
          </p>
        ) : (
          <p id="identifier-hint" className="mt-1.5 text-xs leading-4 text-muted">
            Gunakan NIS, NIP, atau email yang diberikan admin.
          </p>
        )}
      </div>

      <div className="login-field" style={{ animationDelay: "40ms" }}>
        <label
          htmlFor="password"
          className="block text-[13px] font-medium leading-[18px] text-ink"
        >
          Kata sandi <span className="text-danger">*</span>
        </label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pr-12"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-5" strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye className="size-5" strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p
            id="password-error"
            className="mt-1.5 text-xs leading-4 text-danger"
          >
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="login-field" style={{ animationDelay: "80ms" }}>
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Memeriksa akun…" : "Masuk"}
        </Button>
      </div>
    </form>
  );
}
