import { z } from "zod";

import { postgresUuidPattern } from "./common";

const optionalText = (max: number) => z.string().trim().max(max);

export const peranInstrukturSchema = z.enum(["instruktur", "pembimbing"]);

export const instrukturFormSchema = z.object({
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
  telepon: optionalText(30),
  password: z.string().max(72, "Kata sandi terlalu panjang.").optional(),
});

export const createInstrukturSchema = instrukturFormSchema
  .extend({
    perusahaan_id: z
      .string()
      .regex(postgresUuidPattern, "Pilih perusahaan terlebih dahulu."),
    peran: peranInstrukturSchema,
    jabatan: optionalText(100),
    telepon_instruktur: optionalText(30),
  })
  .superRefine((data, ctx) => {
    if (!data.password || data.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Kata sandi minimal 8 karakter.",
      });
    }
  });

export const penugasanSchema = z.object({
  perusahaan_id: z
    .string()
    .regex(postgresUuidPattern, "Pilih perusahaan terlebih dahulu."),
  peran: peranInstrukturSchema,
  jabatan: optionalText(100),
  telepon: optionalText(30),
});

export type InstrukturFormInput = z.infer<typeof instrukturFormSchema>;
export type CreateInstrukturInput = z.infer<typeof createInstrukturSchema>;
export type PenugasanInput = z.infer<typeof penugasanSchema>;
