import { z } from "zod";

import { postgresUuidPattern } from "@/lib/validators/common";

export const tipePertanyaanValues = [
  "ya_tidak",
  "pilih_satu",
  "pilih_banyak",
  "isian_singkat",
  "isian_angka",
  "essay",
] as const;

const optionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label opsi wajib diisi.")
    .max(150, "Label opsi maksimal 150 karakter."),
});

const questionSchema = z
  .object({
    pertanyaan: z
      .string()
      .trim()
      .min(1, "Pertanyaan wajib diisi.")
      .max(255, "Pertanyaan maksimal 255 karakter."),
    deskripsi: z
      .string()
      .trim()
      .max(2000, "Deskripsi maksimal 2.000 karakter.")
      .optional()
      .default(""),
    tipe: z.enum(tipePertanyaanValues),
    wajib: z.boolean(),
    min_angka: z.number().finite("Angka minimal tidak valid.").nullable().optional(),
    max_angka: z.number().finite("Angka maksimal tidak valid.").nullable().optional(),
    satuan: z
      .string()
      .trim()
      .max(30, "Satuan maksimal 30 karakter.")
      .optional()
      .default(""),
    options: z.array(optionSchema).max(50).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const choice =
      data.tipe === "pilih_satu" || data.tipe === "pilih_banyak";

    if (choice && data.options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Tambahkan minimal satu opsi.",
      });
    }

    if (
      data.tipe === "isian_angka" &&
      data.min_angka !== null &&
      data.min_angka !== undefined &&
      data.max_angka !== null &&
      data.max_angka !== undefined &&
      data.min_angka > data.max_angka
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["max_angka"],
        message: "Angka maksimal harus lebih besar dari angka minimal.",
      });
    }
  });

const formFields = {
  nama: z
    .string()
    .trim()
    .min(1, "Nama form wajib diisi.")
    .max(150, "Nama form maksimal 150 karakter."),
  deskripsi: z
    .string()
    .trim()
    .max(2000, "Deskripsi maksimal 2.000 karakter.")
    .optional()
    .default(""),
  periode_id: z
    .string()
    .regex(postgresUuidPattern, "Pilih periode PKL."),
};

export const createMutabaahFormSchema = z.object(formFields);

export const mutabaahFormDraftSchema = z.object({
  ...formFields,
  questions: z
    .array(questionSchema)
    .min(1, "Tambahkan minimal satu pertanyaan.")
    .max(100, "Maksimal 100 pertanyaan."),
});

export type CreateMutabaahFormInput = z.infer<
  typeof createMutabaahFormSchema
>;
export type MutabaahFormDraftInput = z.infer<
  typeof mutabaahFormDraftSchema
>;
