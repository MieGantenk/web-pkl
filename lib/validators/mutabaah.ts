import { z } from "zod";

import { postgresUuidPattern } from "@/lib/validators/common";

const uuid = z
  .string()
  .regex(postgresUuidPattern, "Pertanyaan tidak valid.");

export const mutabaahAnswerSchema = z.object({
  pertanyaan_id: uuid,
  jawaban_teks: z
    .string()
    .trim()
    .max(4000, "Jawaban maksimal 4.000 karakter.")
    .nullable()
    .optional(),
  jawaban_angka: z
    .number()
    .finite("Angka tidak valid.")
    .nullable()
    .optional(),
  jawaban_boolean: z.boolean().nullable().optional(),
  opsi_ids: z.array(uuid).max(50, "Pilihan terlalu banyak.").optional(),
});

export const saveMutabaahSchema = z.object({
  answers: z
    .array(mutabaahAnswerSchema)
    .min(1, "Tidak ada jawaban yang dikirim.")
    .max(100, "Jumlah jawaban terlalu banyak."),
});

export type SaveMutabaahInput = z.infer<typeof saveMutabaahSchema>;
