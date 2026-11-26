import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const optionalTime = z.union([
  z.literal(""),
  z.string().regex(timePattern, "Waktu tidak valid."),
]);

const jurnalFields = z.object({
  tanggal: z
    .string()
    .regex(datePattern, "Tanggal jurnal tidak valid."),
  kehadiran: z.enum(["hadir", "izin", "sakit"]),
  waktu_mulai: optionalTime,
  waktu_selesai: optionalTime,
  kegiatan: z.string().trim().max(200, "Kegiatan maksimal 200 karakter."),
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

  if (data.kehadiran === "hadir") {
    if (!data.waktu_mulai) {
      ctx.addIssue({
        code: "custom",
        path: ["waktu_mulai"],
        message: "Waktu mulai wajib diisi saat hadir.",
      });
    }

    if (!data.waktu_selesai) {
      ctx.addIssue({
        code: "custom",
        path: ["waktu_selesai"],
        message: "Waktu selesai wajib diisi saat hadir.",
      });
    }

    if (
      data.waktu_mulai &&
      data.waktu_selesai &&
      data.waktu_selesai <= data.waktu_mulai
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["waktu_selesai"],
        message: "Waktu selesai harus setelah waktu mulai.",
      });
    }

    if (data.kegiatan.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["kegiatan"],
        message: "Kegiatan minimal 3 karakter.",
      });
    }
  } else if (data.deskripsi.length < 5) {
    ctx.addIssue({
      code: "custom",
      path: ["deskripsi"],
      message: "Jelaskan alasan izin atau sakit.",
    });
  }
}

export const jurnalFormSchema = jurnalFields.superRefine(refineFields);

export const createJurnalSchema = jurnalFields
  .extend({
    foto_path: z.string().trim().max(500).nullable(),
    foto_mime: z.enum(["image/jpeg", "image/png"]).nullable(),
    foto_ukuran: z
      .number()
      .int()
      .positive("Ukuran foto tidak valid.")
      .max(5 * 1024 * 1024, "Ukuran foto maksimal 5 MB.")
      .nullable(),
  })
  .superRefine((data, ctx) => {
    refineFields(data, ctx);

    if (data.kehadiran !== "hadir") {
      return;
    }

    if (!data.foto_path) {
      ctx.addIssue({
        code: "custom",
        path: ["foto_path"],
        message: "Foto kegiatan wajib diunggah.",
      });
    }

    if (!data.foto_mime) {
      ctx.addIssue({
        code: "custom",
        path: ["foto_mime"],
        message: "Foto harus berupa JPG atau PNG.",
      });
    }

    if (!data.foto_ukuran) {
      ctx.addIssue({
        code: "custom",
        path: ["foto_ukuran"],
        message: "Ukuran foto tidak valid.",
      });
    }
  });

export type JurnalFormInput = z.infer<typeof jurnalFormSchema>;
export type CreateJurnalInput = z.infer<typeof createJurnalSchema>;
