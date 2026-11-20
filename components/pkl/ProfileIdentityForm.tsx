"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  profileIdentitySchema,
  type ProfileIdentityInput,
} from "@/lib/validators/profile-identity";

type ProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

type ProfileAction = (input: unknown) => Promise<ProfileResult>;

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

export function ProfileIdentityForm({
  initial,
  action,
}: {
  initial: { nama_lengkap: string; telepon: string | null };
  action: ProfileAction;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileIdentityInput>({
    resolver: zodResolver(profileIdentitySchema),
    defaultValues: {
      nama_lengkap: initial.nama_lengkap,
      telepon: initial.telepon ?? "",
    },
  });

  async function onSubmit(values: ProfileIdentityInput) {
    const result = await action(values);

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
        label="Nama lengkap"
        required
        maxLength={150}
        error={errors.nama_lengkap?.message}
        {...register("nama_lengkap")}
      />

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

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}
