import { z } from "zod";

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Masukkan kata sandi saat ini."),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(72, "Maksimal 72 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi baru."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak cocok.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "Kata sandi baru harus berbeda dari yang sekarang.",
  });

export type PasswordInput = z.infer<typeof passwordSchema>;

export type PasswordResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      field?: "currentPassword" | "newPassword";
    };
