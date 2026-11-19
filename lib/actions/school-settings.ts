"use server";

import { revalidatePath } from "next/cache";

import { jakartaToday } from "@/lib/date";
import { jenisSuratList } from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validators/settings";

const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const FILE_FIELDS = [
  { key: "logo", label: "Logo" },
  { key: "kop", label: "Kop surat" },
  { key: "footer", label: "Footer surat" },
] as const;

export type SettingsActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function updateSchoolSettingsAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesi Anda berakhir. Silakan masuk lagi." };
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.aktif || profile.peran !== "admin") {
    return {
      ok: false,
      message: "Anda tidak berwenang mengubah pengaturan sekolah.",
    };
  }

  let penomoran: unknown = {};

  try {
    penomoran = JSON.parse(String(formData.get("penomoran") ?? "{}"));
  } catch {
    return { ok: false, message: "Data penomoran surat tidak valid." };
  }

  const parsed = settingsSchema.safeParse({
    nama_sekolah: String(formData.get("nama_sekolah") ?? ""),
    alamat: String(formData.get("alamat") ?? ""),
    telepon: String(formData.get("telepon") ?? ""),
    email: String(formData.get("email") ?? ""),
    website: String(formData.get("website") ?? ""),
    kepala_sekolah: String(formData.get("kepala_sekolah") ?? ""),
    nip_kepala: String(formData.get("nip_kepala") ?? ""),
    akreditasi: String(formData.get("akreditasi") ?? ""),
    format_nomor_surat: String(formData.get("format_nomor_surat") ?? ""),
    penomoran,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      (fieldErrors[key] ??= []).push(issue.message);
    }

    return {
      ok: false,
      message: "Periksa kembali isian yang ditandai.",
      fieldErrors,
    };
  }

  const files: Array<{
    key: (typeof FILE_FIELDS)[number]["key"];
    label: string;
    file: File;
  }> = [];

  for (const field of FILE_FIELDS) {
    const value = formData.get(field.key);

    if (!(value instanceof File) || value.size === 0) {
      continue;
    }

    if (!ALLOWED_ASSET_TYPES.has(value.type)) {
      return {
        ok: false,
        message: `${field.label} harus berupa PNG, JPG, atau WebP.`,
      };
    }

    if (value.size > MAX_ASSET_BYTES) {
      return {
        ok: false,
        message: `${field.label} maksimal 2 MB.`,
      };
    }

    files.push({ ...field, file: value });
  }

  const uploadedPaths: Partial<
    Record<"logo_path" | "kop_path" | "footer_path", string>
  > = {};

  for (const { key, label, file } of files) {
    const { error } = await supabase.storage.from("sekolah").upload(key, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal mengunggah ${label.toLowerCase()}: ${error.message}`,
      };
    }

    uploadedPaths[`${key}_path`] = key;
  }

  const data = parsed.data;

  const payload = {
    id: 1,
    nama_sekolah: data.nama_sekolah,
    alamat: data.alamat,
    telepon: data.telepon || null,
    email: data.email || null,
    website: data.website || null,
    kepala_sekolah: data.kepala_sekolah || null,
    nip_kepala: data.nip_kepala || null,
    akreditasi: data.akreditasi || null,
    format_nomor_surat: data.format_nomor_surat,
    ...uploadedPaths,
  };

  const { error: settingsError } = await supabase
    .from("pengaturan_sekolah")
    .upsert(payload, { onConflict: "id" });

  if (settingsError) {
    return {
      ok: false,
      message: "Gagal menyimpan pengaturan sekolah. Coba lagi.",
    };
  }

  const year = Number(jakartaToday().slice(0, 4));
  const counters = jenisSuratList.map((jenis) => ({
    jenis,
    tahun: year,
    urutan_terakhir: data.penomoran[jenis],
  }));

  const { error: counterError } = await supabase
    .from("penomoran_surat")
    .upsert(counters, { onConflict: "jenis,tahun" });

  if (counterError) {
    return {
      ok: false,
      message:
        "Profil sekolah tersimpan, tetapi penomoran surat gagal disimpan. Coba simpan lagi.",
    };
  }

  try {
    const admin = createAdminClient();

    await admin.from("log_aktivitas").insert({
      pengguna_id: user.id,
      aksi: "update_pengaturan",
      entitas: "pengaturan_sekolah",
      detail: {
        fields: [
          "nama_sekolah",
          "alamat",
          "telepon",
          "email",
          "website",
          "kepala_sekolah",
          "nip_kepala",
          "akreditasi",
          "format_nomor_surat",
          "penomoran",
        ],
        aset: files.map((item) => item.key),
      },
    });
  } catch {
    // Audit log tidak boleh menggagalkan penyimpanan pengaturan.
  }

  revalidatePath("/admin/pengaturan");
  revalidatePath("/admin");

  return { ok: true, message: "Pengaturan sekolah disimpan." };
}
