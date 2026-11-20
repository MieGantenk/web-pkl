import { z } from "zod";

import { postgresUuidPattern } from "./common";

const optionalUuid = z
  .string()
  .regex(postgresUuidPattern, "Pilihan tidak valid.")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
  .optional()
  .or(z.literal(""));

export const penempatanFormSchema = z
  .object({
    pengajuan_id: z
      .string()
      .regex(postgresUuidPattern, "Data penempatan tidak valid."),
    guru_pembimbing_id: optionalUuid,
    instruktur_id: optionalUuid,
    pembimbing_id: optionalUuid,
    tanggal_mulai: optionalDate,
    tanggal_selesai: optionalDate,
  })
  .superRefine((data, ctx) => {
    const mulai = data.tanggal_mulai ?? "";
    const selesai = data.tanggal_selesai ?? "";

    if (Boolean(mulai) !== Boolean(selesai)) {
      ctx.addIssue({
        code: "custom",
        path: [mulai ? "tanggal_selesai" : "tanggal_mulai"],
        message: "Lengkapi tanggal mulai dan tanggal selesai.",
      });
    }

    if (mulai && selesai && selesai < mulai) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggal_selesai"],
        message: "Tanggal selesai harus setelah tanggal mulai.",
      });
    }
  });

export type PenempatanFormInput = z.infer<typeof penempatanFormSchema>;
