import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max);

export const perusahaanFormSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama perusahaan wajib diisi.")
    .max(200, "Nama perusahaan terlalu panjang."),
  alamat: z
    .string()
    .trim()
    .min(1, "Alamat wajib diisi.")
    .max(2000, "Alamat terlalu panjang."),
  kota: optionalText(100),
  telepon: optionalText(30),
  email: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .email("Format email tidak valid.")
      .max(255, "Email terlalu panjang."),
  ]),
  website: optionalText(255),
});

export type PerusahaanFormInput = z.infer<typeof perusahaanFormSchema>;
