"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { notifyPengajuan } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";

export type PengajuanReviewResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const reviewSchema = z
  .object({
    pengajuan_id: z
      .string()
      .regex(postgresUuidPattern, "Pengajuan tidak valid."),
    dokumen_id: z
      .string()
      .regex(postgresUuidPattern, "Dokumen tidak valid."),
    jenis: z.enum(["izin", "balasan"]),
    action: z.enum(["setujui", "revisi", "tolak"]),
    catatan: z.string().trim().max(1000, "Catatan terlalu panjang.").optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.action === "revisi" || data.action === "tolak") &&
      !data.catatan
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["catatan"],
        message: "Catatan wajib diisi untuk revisi atau penolakan.",
      });
    }

    if (data.jenis === "izin" && data.action === "tolak") {
      ctx.addIssue({
        code: "custom",
        path: ["action"],
        message: "Izin orang tua tidak bisa ditolak; gunakan minta revisi.",
      });
    }
  });

function revalidatePengajuan() {
  revalidatePath("/admin/pengajuan");
  revalidatePath("/admin");
  revalidatePath("/siswa/pengajuan");
}

export async function reviewPengajuanAction(
  input: unknown,
): Promise<PengajuanReviewResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminId = user?.id ?? null;

  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali tindakan verifikasi.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: pengajuan, error: pengajuanError } = await admin
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", data.pengajuan_id)
    .maybeSingle();

  if (pengajuanError || !pengajuan) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  const expectedStatus =
    data.jenis === "izin" ? "izin_ortu_diunggah" : "balasan_diunggah";
  const expectedJenis =
    data.jenis === "izin"
      ? "izin_orang_tua_ttd"
      : "surat_balasan_perusahaan";

  if (pengajuan.status !== expectedStatus) {
    return {
      ok: false,
      message: "Pengajuan sudah berubah status. Muat ulang halaman.",
    };
  }

  const { data: dokumen, error: dokumenError } = await admin
    .from("dokumen")
    .select("id, pengajuan_id, jenis, status")
    .eq("id", data.dokumen_id)
    .eq("pengajuan_id", pengajuan.id)
    .maybeSingle();

  if (dokumenError || !dokumen) {
    return { ok: false, message: "Dokumen tidak ditemukan." };
  }

  if (dokumen.jenis !== expectedJenis || dokumen.status !== "menunggu") {
    return {
      ok: false,
      message: "Dokumen sudah diproses. Muat ulang halaman.",
    };
  }

  const documentStatus =
    data.action === "setujui"
      ? "diterima"
      : data.action === "revisi"
        ? "revisi"
        : "ditolak";
  // Menyetujui izin tidak sama dengan menerbitkan surat pengajuan.
  // Status tetap di izin_ortu_diunggah sampai admin benar-benar menerbitkan
  // surat pengajuan, agar surat itu tidak dianggap terbit tanpa berkas.
  const nextStatus =
    data.jenis === "izin"
      ? data.action === "setujui"
        ? "izin_ortu_diunggah"
        : "izin_ortu_terbit"
      : data.action === "setujui"
        ? "diterima"
        : data.action === "revisi"
          ? "pengajuan_terbit"
          : "ditolak";
  const now = new Date().toISOString();
  const catatan = data.catatan?.trim() || null;

  const documentResult = await admin
    .from("dokumen")
    .update({
      status: documentStatus,
      catatan,
      diverifikasi_oleh: adminId,
      diverifikasi_pada: now,
    })
    .eq("id", dokumen.id)
    .eq("pengajuan_id", pengajuan.id)
    .eq("status", "menunggu")
    .select("id")
    .maybeSingle();

  if (documentResult.error || !documentResult.data) {
    return { ok: false, message: "Dokumen belum dapat diperbarui." };
  }

  const pengajuanResult = await admin
    .from("pengajuan_pkl")
    .update({
      status: nextStatus,
      alasan_penolakan:
        data.action === "tolak" ? catatan : null,
      diverifikasi_oleh: adminId,
      diverifikasi_pada: now,
    })
    .eq("id", pengajuan.id)
    .eq("status", expectedStatus)
    .select("id")
    .maybeSingle();

  if (pengajuanResult.error || !pengajuanResult.data) {
    await admin
      .from("dokumen")
      .update({
        status: "menunggu",
        catatan: null,
        diverifikasi_oleh: null,
        diverifikasi_pada: null,
      })
      .eq("id", dokumen.id);

    return { ok: false, message: "Pengajuan belum dapat diperbarui." };
  }

  if (adminId) {
    await admin.from("log_aktivitas").insert({
      pengguna_id: adminId,
      aksi:
        data.action === "tolak"
          ? "reject_pengajuan"
          : "verifikasi_dokumen",
      entitas: "pengajuan_pkl",
      entitas_id: pengajuan.id,
      detail: {
        jenis: data.jenis,
        action: data.action,
        catatan,
      },
    });
  }

  if (data.jenis === "izin") {
    await notifyPengajuan(
      pengajuan.id,
      { siswa: "/siswa/pengajuan", ortu: "/ortu" },
      data.action === "setujui"
        ? {
            judul: "Izin orang tua disetujui",
            pesan:
              "Izin orang tua sudah disetujui. Sekolah akan menerbitkan surat pengajuan PKL.",
          }
        : {
            judul: "Izin orang tua perlu diperbaiki",
            pesan: catatan
              ? `Izin orang tua perlu diperbaiki: ${catatan}`
              : "Izin orang tua perlu diperbaiki sebelum diproses lagi.",
          },
    );
  } else if (data.action === "setujui") {
    await notifyPengajuan(
      pengajuan.id,
      {
        siswa: "/siswa",
        ortu: "/ortu",
        guru: "/guru/siswa",
        instruktur: "/instruktur/siswa",
      },
      {
        judul: "Pengajuan PKL diterima",
        pesan:
          "Pengajuan PKL sudah diterima. Sekolah akan mengatur penempatan dan pembimbing PKL.",
      },
    );
  } else if (data.action === "revisi") {
    await notifyPengajuan(
      pengajuan.id,
      { siswa: "/siswa/pengajuan", ortu: "/ortu" },
      {
        judul: "Balasan perusahaan perlu diperbaiki",
        pesan: catatan
          ? `Balasan perusahaan perlu diperbaiki: ${catatan}`
          : "Balasan perusahaan perlu diperbaiki sebelum diproses lagi.",
      },
    );
  } else {
    await notifyPengajuan(
      pengajuan.id,
      { siswa: "/siswa/pengajuan", ortu: "/ortu" },
      {
        judul: "Pengajuan PKL ditolak",
        pesan: catatan
          ? `Pengajuan PKL ditolak: ${catatan}`
          : "Pengajuan PKL ditolak oleh sekolah.",
      },
    );
  }

  revalidatePengajuan();

  return {
    ok: true,
    message:
      data.action === "setujui"
        ? "Dokumen disetujui."
        : data.action === "revisi"
          ? "Dokumen dikembalikan untuk revisi."
          : "Pengajuan ditolak.",
  };
}
