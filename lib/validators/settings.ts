import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional();

const optionalEmail = z
  .string()
  .trim()
  .email("Email tidak valid.")
  .max(255, "Maksimal 255 karakter.")
  .optional()
  .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("URL tidak valid. Gunakan format https://...")
  .max(255, "Maksimal 255 karakter.")
  .optional()
  .or(z.literal(""));

const counter = z
  .number()
  .int("Harus bilangan bulat.")
  .min(0, "Tidak boleh negatif.")
  .max(999999, "Terlalu besar.");

export const settingsSchema = z.object({
  nama_sekolah: z
    .string()
    .trim()
    .min(1, "Nama sekolah wajib diisi.")
    .max(200, "Maksimal 200 karakter."),
  alamat: z
    .string()
    .trim()
    .min(1, "Alamat wajib diisi.")
    .max(2000, "Maksimal 2000 karakter."),
  telepon: optionalText(30),
  email: optionalEmail,
  website: optionalUrl,
  kepala_sekolah: optionalText(150),
  nip_kepala: optionalText(30),
  akreditasi: optionalText(100),
  format_nomor_surat: z
    .string()
    .trim()
    .min(1, "Format nomor surat wajib diisi.")
    .max(200, "Maksimal 200 karakter."),
  penomoran: z.object({
    izin_orang_tua: counter,
    pernyataan: counter,
    pengajuan: counter,
    keberangkatan: counter,
    tugas_monitoring: counter,
    perjanjian: counter,
    penarikan: counter,
  }),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
