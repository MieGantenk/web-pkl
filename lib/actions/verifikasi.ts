"use server";

import { revalidatePath } from "next/cache";

import { notifyPengajuan } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  verifyJurnalSchema,
  type VerifyJurnalResult,
} from "@/lib/validators/verifikasi-jurnal";

export async function verifyJurnalAction(
  input: unknown,
): Promise<VerifyJurnalResult> {
  const parsed = verifyJurnalSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data verifikasi tidak valid.",
    };
  }

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

  if (!profile?.aktif || profile.peran !== "guru") {
    return { ok: false, message: "Anda tidak berwenang memverifikasi jurnal." };
  }

  const { data: guru } = await supabase
    .from("guru")
    .select("id")
    .eq("pengguna_id", user.id)
    .maybeSingle();

  if (!guru) {
    return { ok: false, message: "Data guru tidak ditemukan." };
  }

  const { data: journal, error: journalError } = await supabase
    .from("jurnal")
    .select("id, siswa_id, pengajuan_id, status")
    .eq("id", parsed.data.jurnalId)
    .maybeSingle();

  if (journalError || !journal) {
    return { ok: false, message: "Jurnal tidak ditemukan." };
  }

  if (!journal.pengajuan_id) {
    return {
      ok: false,
      message: "Jurnal belum terhubung ke pengajuan PKL.",
    };
  }

  const { data: application } = await supabase
    .from("pengajuan_pkl")
    .select("guru_pembimbing_id")
    .eq("id", journal.pengajuan_id)
    .maybeSingle();

  if (!application || application.guru_pembimbing_id !== guru.id) {
    return {
      ok: false,
      message: "Jurnal ini bukan milik siswa bimbingan Anda.",
    };
  }

  if (journal.status === "terverifikasi_instruktur") {
    return {
      ok: false,
      message: "Jurnal sudah diverifikasi instruktur dan tidak bisa diubah.",
    };
  }

  const { data: verifications } = await supabase
    .from("verifikasi_jurnal")
    .select("peran, status")
    .eq("jurnal_id", journal.id);

  if (verifications?.some((item) => item.peran === "instruktur")) {
    return {
      ok: false,
      message: "Jurnal sudah diverifikasi instruktur dan tidak bisa diubah.",
    };
  }

  const catatan = parsed.data.catatan?.trim() || null;
  const existingGuruVerification = verifications?.find(
    (item) => item.peran === "guru",
  );

  const writeResult = existingGuruVerification
    ? await supabase
        .from("verifikasi_jurnal")
        .update({ status: parsed.data.status, catatan })
        .eq("jurnal_id", journal.id)
        .eq("peran", "guru")
    : await supabase.from("verifikasi_jurnal").insert({
        jurnal_id: journal.id,
        verifikator_id: user.id,
        peran: "guru",
        status: parsed.data.status,
        catatan,
      });

  if (writeResult.error) {
    return {
      ok: false,
      message: "Gagal menyimpan verifikasi. Coba lagi.",
    };
  }

  try {
    const admin = createAdminClient();
    await admin.from("log_aktivitas").insert({
      pengguna_id: user.id,
      aksi:
        parsed.data.status === "revisi"
          ? "revisi_jurnal"
          : "verifikasi_jurnal",
      entitas: "jurnal",
      entitas_id: journal.id,
      detail: { status: parsed.data.status },
    });
  } catch {
    // Audit log tidak boleh menggagalkan verifikasi.
  }

  if (journal.pengajuan_id) {
    if (parsed.data.status === "diterima") {
      await notifyPengajuan(
        journal.pengajuan_id,
        {
          siswa: "/siswa/jurnal",
          ortu: "/ortu/jurnal",
          instruktur: "/instruktur/siswa",
        },
        {
          judul: "Jurnal diverifikasi guru",
          pesan:
            "Jurnal siswa sudah diverifikasi guru dan menunggu verifikasi instruktur.",
        },
      );
    } else {
      await notifyPengajuan(
        journal.pengajuan_id,
        { siswa: "/siswa/jurnal", ortu: "/ortu/jurnal" },
        {
          judul:
            parsed.data.status === "revisi"
              ? "Jurnal perlu revisi"
              : "Jurnal ditolak",
          pesan:
            parsed.data.status === "revisi"
              ? catatan
                ? `Jurnal perlu diperbaiki: ${catatan}`
                : "Jurnal perlu diperbaiki."
              : catatan
                ? `Jurnal ditolak: ${catatan}`
                : "Jurnal ditolak oleh guru pembimbing.",
        },
      );
    }
  }

  revalidatePath("/guru/siswa");
  revalidatePath("/guru");
  revalidatePath("/guru/siswa");
  revalidatePath(`/guru/siswa/${journal.siswa_id}`);
  revalidatePath("/siswa/jurnal");
  revalidatePath("/siswa");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/admin/jurnal");
  revalidatePath("/admin");

  return {
    ok: true,
    message:
      parsed.data.status === "revisi"
        ? "Permintaan revisi dikirim ke siswa."
        : "Jurnal disetujui.",
  };
}
