import { z } from "zod";

import { fieldErrorsFrom, postgresUuidPattern } from "./common";

export { fieldErrorsFrom, postgresUuidPattern };

const optionalText = (max: number) => z.string().trim().max(max);

export const siswaFormSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(150, "Nama lengkap terlalu panjang."),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(100, "Username terlalu panjang.")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Gunakan huruf, angka, titik, garis bawah, atau tanda hubung.",
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid.")
    .max(255, "Email terlalu panjang."),
  nis: z
    .string()
    .trim()
    .min(1, "NIS wajib diisi.")
    .max(30, "NIS terlalu panjang."),
  nisn: optionalText(30),
  kelas: optionalText(30),
  jurusan_id: z.union([
    z.literal(""),
    z.string().regex(postgresUuidPattern, "Jurusan tidak valid."),
  ]),
  telepon: optionalText(25),
  alamat: optionalText(1000),
  nama_orangtua: optionalText(150),
  telepon_orangtua: optionalText(25),
  password: z.string().max(72, "Kata sandi terlalu panjang.").optional(),
  confirmPassword: z
    .string()
    .max(72, "Kata sandi terlalu panjang.")
    .optional(),
});

export const createSiswaSchema = siswaFormSchema.superRefine((data, ctx) => {
  if (!data.password || data.password.length < 8) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: "Kata sandi minimal 8 karakter.",
    });
  }

  if (data.confirmPassword !== data.password) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Ulangi kata sandi dengan benar.",
    });
  }
});

export const resetSiswaPasswordSchema = z
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

export type SiswaFormInput = z.infer<typeof siswaFormSchema>;
export type ResetSiswaPasswordInput = z.infer<
  typeof resetSiswaPasswordSchema
>;
