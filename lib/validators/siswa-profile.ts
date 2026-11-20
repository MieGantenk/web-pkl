import { z } from "zod";

export const siswaProfileSchema = z.object({
  telepon: z
    .string()
    .trim()
    .max(25, "Maksimal 25 karakter.")
    .optional()
    .or(z.literal("")),
  alamat: z
    .string()
    .trim()
    .max(500, "Maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type SiswaProfileInput = z.infer<typeof siswaProfileSchema>;
