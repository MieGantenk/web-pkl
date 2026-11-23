"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { currentSuratYear } from "@/lib/data/admin-surat";
import { jakartaToday } from "@/lib/date";
import {
  jenisSuratList,
  type JenisSurat,
} from "@/lib/status";
import {
  canIssueSurat,
  suratKode,
  suratNextStatus,
} from "@/lib/surat";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { postgresUuidPattern } from "@/lib/validators/common";

export type SuratActionResult =
  | { ok: true; id: string; nomor: string }
  | { ok: false; message: string };

const jenisSchema = z.custom<JenisSurat>(
  (value) =>
    typeof value === "string" &&
    jenisSuratList.includes(value as JenisSurat),
  "Jenis surat tidak valid.",
);

const issueSchema = z.object({
  pengajuan_id: z.string().regex(postgresUuidPattern, "Pengajuan tidak valid."),
  jenis: jenisSchema,
});

function buildNomor(
  format: string,
  nomor: number,
  jenis: JenisSurat,
  tahun: number,
) {
  return format
    .replaceAll("{nomor}", String(nomor).padStart(3, "0"))
    .replaceAll("{kode}", suratKode[jenis])
    .replaceAll("{tahun}", String(tahun));
}

async function nextSuratNumber(jenis: JenisSurat) {
  const admin = createAdminClient();
  const tahun = currentSuratYear();
  const { data: settings, error: settingsError } = await admin
    .from("pengaturan_sekolah")
    .select("format_nomor_surat")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    throw new Error("Format nomor surat belum dapat dibaca.");
  }

  const format = settings?.format_nomor_surat || "{nomor}/{kode}/{tahun}";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: counter, error } = await admin
      .from("penomoran_surat")
      .select("id, urutan_terakhir")
      .eq("jenis", jenis)
      .eq("tahun", tahun)
      .maybeSingle();

    if (error) {
      throw new Error("Nomor surat belum dapat dibaca.");
    }

    if (!counter) {
      const inserted = await admin
        .from("penomoran_surat")
        .insert({ jenis, tahun, urutan_terakhir: 1 })
        .select("id")
        .maybeSingle();

      if (!inserted.error) {
        return buildNomor(format, 1, jenis, tahun);
      }

      continue;
    }

    const next = counter.urutan_terakhir + 1;
    const updated = await admin
      .from("penomoran_surat")
      .update({ urutan_terakhir: next })
      .eq("id", counter.id)
      .eq("urutan_terakhir", counter.urutan_terakhir)
      .select("id")
      .maybeSingle();

    if (!updated.error && updated.data) {
      return buildNomor(format, next, jenis, tahun);
    }
  }

  throw new Error("Nomor surat gagal dibuat. Coba lagi.");
}

function revalidateSurat() {
  revalidatePath("/admin/surat");
  revalidatePath("/admin");
  revalidatePath("/admin/pengajuan");
  revalidatePath("/siswa");
  revalidatePath("/siswa/surat");
  revalidatePath("/guru");
  revalidatePath("/ortu");
}

export async function issueSuratAction(
  input: unknown,
): Promise<SuratActionResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = issueSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data surat tidak valid.",
    };
  }

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("pengajuan_pkl")
    .select("id, status")
    .eq("id", data.pengajuan_id)
    .maybeSingle();

  if (applicationError) {
    return { ok: false, message: "Pengajuan belum dapat diperiksa." };
  }

  if (!application || !canIssueSurat(data.jenis, application.status)) {
    return {
      ok: false,
      message: "Pengajuan ini belum memenuhi syarat untuk jenis surat tersebut.",
    };
  }

  const { data: existing, error: existingError } = await admin
    .from("surat")
    .select("id, nomor")
    .eq("pengajuan_id", application.id)
    .eq("jenis", data.jenis)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "Surat yang sudah ada belum dapat diperiksa." };
  }

  if (existing) {
    return {
      ok: false,
      message: `Surat jenis ini sudah diterbitkan (${existing.nomor ?? "tanpa nomor"}).`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesi Anda berakhir. Silakan masuk lagi." };
  }

  let nomor: string;

  try {
    nomor = await nextSuratNumber(data.jenis);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Nomor surat gagal dibuat.",
    };
  }

  const inserted = await admin
    .from("surat")
    .insert({
      pengajuan_id: application.id,
      jenis: data.jenis,
      nomor,
      tanggal_terbit: jakartaToday(),
      status: "terbit",
      dibuat_oleh: user.id,
    })
    .select("id")
    .single();

  if (inserted.error) {
    return { ok: false, message: "Surat belum dapat diterbitkan. Coba lagi." };
  }

  const nextStatus = suratNextStatus[data.jenis];

  if (nextStatus) {
    await admin
      .from("pengajuan_pkl")
      .update({ status: nextStatus })
      .eq("id", application.id);
  }

  try {
    await admin.from("log_aktivitas").insert({
      pengguna_id: user.id,
      aksi: "terbit_surat",
      entitas: "surat",
      entitas_id: inserted.data.id,
      detail: { jenis: data.jenis, nomor },
    });
  } catch {
    // Audit log tidak boleh menggagalkan penerbitan.
  }

  revalidateSurat();
  return { ok: true, id: inserted.data.id, nomor };
}

const suratFileSchema = z.object({
  surat_id: z.string().regex(postgresUuidPattern, "Surat tidak valid."),
  file_path: z.string().trim().min(1, "Berkas tidak valid.").max(500),
  file_name: z.string().trim().min(1, "Nama berkas tidak valid.").max(255),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  ukuran: z
    .number()
    .int()
    .positive("Berkas tidak valid.")
    .max(5 * 1024 * 1024, "Ukuran berkas maksimal 5 MB."),
});

export type SuratFileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function recordSuratFileAction(
  input: unknown,
): Promise<SuratFileResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = suratFileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Berkas surat tidak valid.",
    };
  }

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: surat, error: suratError } = await admin
    .from("surat")
    .select("id, file_path")
    .eq("id", data.surat_id)
    .maybeSingle();

  if (suratError || !surat) {
    return { ok: false, message: "Surat tidak ditemukan." };
  }

  if (
    !data.file_path.startsWith("surat/") ||
    data.file_path.includes("..")
  ) {
    return { ok: false, message: "Lokasi berkas tidak valid." };
  }

  const slash = data.file_path.lastIndexOf("/");
  const folder = slash > 0 ? data.file_path.slice(0, slash) : "";
  const fileName = slash >= 0 ? data.file_path.slice(slash + 1) : "";

  if (!folder || !fileName) {
    return { ok: false, message: "Lokasi berkas tidak valid." };
  }

  const { data: stored, error: storedError } = await admin.storage
    .from("surat")
    .list(folder, { search: fileName, limit: 1 });

  if (
    storedError ||
    !stored?.some((object) => object.name === fileName)
  ) {
    return { ok: false, message: "Berkas belum ditemukan di penyimpanan." };
  }

  const { data: updated, error: updateError } = await admin
    .from("surat")
    .update({ file_path: data.file_path })
    .eq("id", data.surat_id)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return { ok: false, message: "Berkas surat belum dapat disimpan." };
  }

  if (surat.file_path && surat.file_path !== data.file_path) {
    await admin.storage.from("surat").remove([surat.file_path]);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await admin.from("log_aktivitas").insert({
        pengguna_id: user.id,
        aksi: "unggah_surat",
        entitas: "surat",
        entitas_id: data.surat_id,
        detail: { file_name: data.file_name },
      });
    }
  } catch {
    // Audit log tidak boleh menggagalkan unggahan.
  }

  revalidateSurat();
  return { ok: true };
}

const uploadSuratSchema = suratFileSchema.omit({ surat_id: true }).extend({
  pengajuan_id: z.string().regex(postgresUuidPattern, "Pengajuan tidak valid."),
  jenis: jenisSchema,
});

export type UploadSuratResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function uploadSuratForPengajuanAction(
  input: unknown,
): Promise<UploadSuratResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsed = uploadSuratSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Berkas surat tidak valid.",
    };
  }

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("surat")
    .select("id")
    .eq("pengajuan_id", data.pengajuan_id)
    .eq("jenis", data.jenis)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "Surat belum dapat diperiksa." };
  }

  let suratId = existing?.id;

  if (!suratId) {
    const issued = await issueSuratAction({
      pengajuan_id: data.pengajuan_id,
      jenis: data.jenis,
    });

    if (!issued.ok) {
      return { ok: false, message: issued.message };
    }

    suratId = issued.id;
  }

  const recorded = await recordSuratFileAction({
    surat_id: suratId,
    file_path: data.file_path,
    file_name: data.file_name,
    mime_type: data.mime_type,
    ukuran: data.ukuran,
  });

  if (!recorded.ok) {
    return { ok: false, message: recorded.message };
  }

  return { ok: true, id: suratId };
}
