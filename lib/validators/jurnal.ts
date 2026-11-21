import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const jurnalFields = z.object({
  tanggal: z
    .string()
    .regex(datePattern, "Tanggal jurnal tidak valid."),
  waktu_mulai: z
    .string()
    .regex(timePattern, "Waktu mulai tidak valid."),
  waktu_selesai: z
    .string()
    .regex(timePattern, "Waktu selesai tidak valid."),
  kegiatan: z
    .string()
    .trim()
    .min(3, "Kegiatan minimal 3 karakter.")
    .max(200, "Kegiatan maksimal 200 karakter."),
  deskripsi: z
    .string()
    .trim()
    .max(2000, "Deskripsi maksimal 2.000 karakter."),
});

function refineFields(
  data: z.infer<typeof jurnalFields>,
  ctx: z.RefinementCtx,
) {
  const date = new Date(`${data.tanggal}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== data.tanggal
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["tanggal"],
      message: "Tanggal jurnal tidak valid.",
    });
  }

  if (data.waktu_selesai <= data.waktu_mulai) {
    ctx.addIssue({
      code: "custom",
      path: ["waktu_selesai"],
      message: "Waktu selesai harus setelah waktu mulai.",
    });
  }
}

export const jurnalFormSchema = jurnalFields.superRefine(refineFields);

export const createJurnalSchema = jurnalFields
  .extend({
    foto_path: z
      .string()
      .trim()
      .min(1, "Foto kegiatan wajib diunggah.")
      .max(500, "Path foto terlalu panjang."),
    foto_mime: z.enum(["image/jpeg", "image/png"], {
      message: "Foto harus berupa JPG atau PNG.",
    }),
    foto_ukuran: z
      .number()
      .int()
      .positive("Ukuran foto tidak valid.")
      .max(5 * 1024 * 1024, "Ukuran foto maksimal 5 MB."),
  })
  .superRefine(refineFields);

export type JurnalFormInput = z.infer<typeof jurnalFormSchema>;
export type CreateJurnalInput = z.infer<typeof createJurnalSchema>;
