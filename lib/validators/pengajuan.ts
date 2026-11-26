import { z } from "zod";

import { postgresUuidPattern } from "./common";

export const pengajuanFormSchema = z
  .object({
    perusahaan_id: z
      .string()
      .trim()
      .min(1, "Pilih perusahaan atau tambahkan perusahaan baru."),
    perusahaan_nama: z
      .string()
      .trim()
      .max(200, "Nama perusahaan terlalu panjang."),
    perusahaan_alamat: z
      .string()
      .trim()
      .max(500, "Alamat perusahaan terlalu panjang."),
    periode_id: z
      .string()
      .regex(postgresUuidPattern, "Pilih periode PKL terlebih dahulu."),
    guru_pembimbing_id: z
      .string()
      .regex(postgresUuidPattern, "Pilih guru pembimbing terlebih dahulu."),
  })
  .superRefine((data, ctx) => {
    if (data.perusahaan_id === "baru") {
      if (data.perusahaan_nama.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["perusahaan_nama"],
          message: "Nama perusahaan wajib diisi.",
        });
      }

      if (data.perusahaan_alamat.length < 5) {
        ctx.addIssue({
          code: "custom",
          path: ["perusahaan_alamat"],
          message: "Alamat perusahaan wajib diisi.",
        });
      }

      return;
    }

    if (!postgresUuidPattern.test(data.perusahaan_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["perusahaan_id"],
        message: "Pilih perusahaan atau tambahkan perusahaan baru.",
      });
    }
  });

export const anggotaPengajuanSchema = z.object({
  nis: z
    .string()
    .trim()
    .min(1, "NIS wajib diisi.")
    .max(30, "NIS terlalu panjang."),
});

export const dokumenPengajuanSchema = z.object({
  pengajuan_id: z.string().regex(postgresUuidPattern, "Pengajuan tidak valid."),
  jenis: z.enum(["izin_orang_tua_ttd", "surat_balasan_perusahaan"]),
  file_path: z.string().trim().min(1, "Berkas tidak valid.").max(500),
  file_name: z.string().trim().min(1, "Nama berkas tidak valid.").max(255),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  ukuran: z
    .number()
    .int()
    .positive("Berkas tidak valid.")
    .max(5 * 1024 * 1024, "Ukuran berkas maksimal 5 MB."),
});

export type PengajuanFormInput = z.infer<typeof pengajuanFormSchema>;
export type AnggotaPengajuanInput = z.infer<typeof anggotaPengajuanSchema>;
export type DokumenPengajuanInput = z.infer<typeof dokumenPengajuanSchema>;
