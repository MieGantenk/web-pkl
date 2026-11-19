import { z } from "zod";

import { postgresUuidPattern } from "./common";

const optionalText = (max: number) => z.string().trim().max(max);

export const guruFormSchema = z.object({
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
  telepon: optionalText(25),
  nip: optionalText(30),
  nuptk: optionalText(30),
  jabatan: optionalText(100),
  jurusan_id: z.union([
    z.literal(""),
    z.string().regex(postgresUuidPattern, "Jurusan tidak valid."),
  ]),
  password: z.string().max(72, "Kata sandi terlalu panjang.").optional(),
});

export const createGuruSchema = guruFormSchema.superRefine((data, ctx) => {
  if (!data.password || data.password.length < 8) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: "Kata sandi minimal 8 karakter.",
    });
  }
});

export type GuruFormInput = z.infer<typeof guruFormSchema>;
