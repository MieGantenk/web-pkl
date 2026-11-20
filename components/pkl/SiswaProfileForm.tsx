"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiswaProfileAction } from "@/lib/actions/siswa-profile";
import {
  siswaProfileSchema,
  type SiswaProfileInput,
} from "@/lib/validators/siswa-profile";

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  hint?: string;
};

function TextField({
  label,
  error,
  hint,
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
        {label}
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

type TextAreaFieldProps = React.ComponentProps<typeof Textarea> & {
  label: string;
  error?: string;
  hint?: string;
};

function TextAreaField({
  label,
  error,
  hint,
  id,
  name,
  ...props
}: TextAreaFieldProps) {
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
        {label}
      </label>
      <Textarea
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

export function SiswaProfileForm({
  initial,
}: {
  initial: { telepon: string | null; alamat: string | null };
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiswaProfileInput>({
    resolver: zodResolver(siswaProfileSchema),
    defaultValues: {
      telepon: initial.telepon ?? "",
      alamat: initial.alamat ?? "",
    },
  });

  async function onSubmit(values: SiswaProfileInput) {
    const result = await updateSiswaProfileAction(values);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <TextField
        label="Telepon"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={25}
        placeholder="0812..."
        hint="Dipakai untuk kontak sekolah."
        error={errors.telepon?.message}
        {...register("telepon")}
      />

      <TextAreaField
        label="Alamat"
        autoComplete="street-address"
        rows={4}
        maxLength={500}
        placeholder="Alamat lengkap"
        error={errors.alamat?.message}
        {...register("alamat")}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Simpan kontak
        </Button>
      </div>
    </form>
  );
}
