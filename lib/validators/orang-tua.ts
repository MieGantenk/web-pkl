import { z } from "zod";

import { toTitleCaseName } from "@/lib/name";

import { postgresUuidPattern } from "./common";

const optionalText = (max: number) => z.string().trim().max(max);

export const hubunganSchema = z.enum(["ayah", "ibu", "wali"]);

export const relasiSchema = z.object({
  siswa_id: z
    .string()
    .regex(postgresUuidPattern, "Pilih siswa terlebih dahulu."),
  hubungan: hubunganSchema,
});

export const orangTuaFormSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(150, "Nama lengkap terlalu panjang.")
    .transform(toTitleCaseName),
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

export const createOrangTuaSchema = orangTuaFormSchema
  .extend(relasiSchema.shape)
  .superRefine((data, ctx) => {
    if (!data.password || data.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Kata sandi minimal 8 karakter.",
      });
    }
  });

export type OrangTuaFormInput = z.infer<typeof orangTuaFormSchema>;
export type CreateOrangTuaInput = z.infer<typeof createOrangTuaSchema>;
export type RelasiInput = z.infer<typeof relasiSchema>;
