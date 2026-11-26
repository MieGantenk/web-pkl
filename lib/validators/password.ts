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

export const resetAccountPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter.")
      .max(72, "Kata sandi terlalu panjang."),
    confirmPassword: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Ulangi kata sandi dengan benar.",
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
export type ResetAccountPasswordInput = z.infer<
  typeof resetAccountPasswordSchema
>;

export type PasswordResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      field?: "currentPassword" | "newPassword";
    };
