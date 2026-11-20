import { z } from "zod";

export const verifyJurnalSchema = z
  .object({
    jurnalId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        "Jurnal tidak valid.",
      ),
    status: z.enum(["diterima", "revisi"]),
    catatan: z
      .string()
      .trim()
      .max(1000, "Catatan maksimal 1000 karakter.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => data.status !== "revisi" || Boolean(data.catatan?.trim()),
    {
      message: "Catatan wajib diisi saat meminta revisi.",
      path: ["catatan"],
    },
  );

export type VerifyJurnalResult =
  | { ok: true; message: string }
  | { ok: false; message: string };
