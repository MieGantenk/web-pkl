import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Masukkan ID atau email.")
    .max(255, "ID terlalu panjang."),
  password: z
    .string()
    .min(1, "Masukkan kata sandi.")
    .max(200, "Kata sandi terlalu panjang."),
});

export type LoginInput = z.infer<typeof loginSchema>;
