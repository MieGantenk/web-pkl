import { z } from "zod";

export const guruProfileSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(150, "Maksimal 150 karakter."),
  telepon: z
    .string()
    .trim()
    .max(25, "Maksimal 25 karakter.")
    .optional()
    .or(z.literal("")),
});

export type GuruProfileInput = z.infer<typeof guruProfileSchema>;
