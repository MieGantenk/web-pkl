import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dateValue = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .regex(datePattern, "Format tanggal tidak valid.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, "Tanggal tidak valid.");

export const periodeFormSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(1, "Nama periode wajib diisi.")
      .max(100, "Nama periode terlalu panjang."),
    tahun_ajaran: z
      .string()
      .trim()
      .min(1, "Tahun ajaran wajib diisi.")
      .max(20, "Tahun ajaran terlalu panjang."),
    tanggal_mulai: dateValue("Tanggal mulai"),
    tanggal_selesai: dateValue("Tanggal selesai"),
  })
  .superRefine((data, ctx) => {
    if (data.tanggal_selesai < data.tanggal_mulai) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggal_selesai"],
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
      });
    }
  });

export type PeriodeFormInput = z.infer<typeof periodeFormSchema>;
