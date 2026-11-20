"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  passwordSchema,
  type PasswordInput,
  type PasswordResult,
} from "@/lib/validators/password";

type ChangePasswordAction = (input: unknown) => Promise<PasswordResult>;

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

function TextField({
  label,
  error,
  hint,
  required,
  id,
  name,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? name;
  const describedBy =
    [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-[13px] font-medium leading-[18px] text-ink"
      >
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-1.5"
        {...props}
      />
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 text-xs leading-4 text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="mt-1.5 text-xs leading-4 text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm({
  action,
}: {
  action: ChangePasswordAction;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordInput) {
    const result = await action(values);

    if (!result.ok) {
      if (result.field) {
        setError(result.field, { message: result.message });
      } else {
        toast.error(result.message);
      }
      return;
    }

    toast.success(result.message);
    reset();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      <TextField
        label="Kata sandi saat ini"
        type="password"
        autoComplete="current-password"
        required
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />

      <TextField
        label="Kata sandi baru"
        type="password"
        autoComplete="new-password"
        required
        hint="Minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol."
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />

      <TextField
        label="Konfirmasi kata sandi baru"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Perbarui kata sandi
        </Button>
      </div>
    </form>
  );
}
