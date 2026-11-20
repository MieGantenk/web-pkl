"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  verifyJurnalSchema,
  type VerifyJurnalResult,
} from "@/lib/validators/verifikasi-jurnal";

export async function verifyInstrukturJurnalAction(
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

  if (!profile?.aktif || profile.peran !== "instruktur") {
    return { ok: false, message: "Anda tidak berwenang memverifikasi jurnal." };
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("instruktur")
    .select("id")
    .eq("pengguna_id", user.id)
    .eq("aktif", true);

  if (assignmentError) {
    return { ok: false, message: "Penugasan perusahaan belum dapat diperiksa." };
  }

  const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);

  if (!assignmentIds.length) {
    return { ok: false, message: "Anda belum ditugaskan ke perusahaan." };
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
    .select("instruktur_id, pembimbing_id")
    .eq("id", journal.pengajuan_id)
    .maybeSingle();

  const assigned =
    application &&
    (assignmentIds.includes(application.instruktur_id ?? "") ||
      assignmentIds.includes(application.pembimbing_id ?? ""));

  if (!assigned) {
    return {
      ok: false,
      message: "Jurnal ini bukan milik siswa di perusahaan Anda.",
    };
  }

  if (journal.status === "terverifikasi_instruktur") {
    return {
      ok: false,
      message: "Jurnal sudah diverifikasi instruktur dan tidak bisa diubah.",
    };
  }

  const { data: verifications, error: verificationError } = await supabase
    .from("verifikasi_jurnal")
    .select("peran, status, verifikator_id")
    .eq("jurnal_id", journal.id);

  if (verificationError) {
    return { ok: false, message: "Verifikasi jurnal belum dapat diperiksa." };
  }

  const guruVerification = verifications?.find(
    (item) => item.peran === "guru",
  );
  const instrukturVerification = verifications?.find(
    (item) => item.peran === "instruktur",
  );

  if (guruVerification?.status !== "diterima") {
    return {
      ok: false,
      message: "Jurnal harus disetujui guru pembimbing terlebih dahulu.",
    };
  }

  if (instrukturVerification?.status === "diterima") {
    return {
      ok: false,
      message: "Jurnal sudah diverifikasi instruktur dan tidak bisa diubah.",
    };
  }

  const catatan = parsed.data.catatan?.trim() || null;
  const writeResult = instrukturVerification
    ? await supabase
        .from("verifikasi_jurnal")
        .update({ status: parsed.data.status, catatan })
        .eq("jurnal_id", journal.id)
        .eq("peran", "instruktur")
        .eq("verifikator_id", user.id)
    : await supabase.from("verifikasi_jurnal").insert({
        jurnal_id: journal.id,
        verifikator_id: user.id,
        peran: "instruktur",
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
      detail: { status: parsed.data.status, peran: "instruktur" },
    });
  } catch {
    // Audit log tidak boleh menggagalkan verifikasi.
  }

  revalidatePath("/instruktur/verifikasi");
  revalidatePath("/instruktur");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/guru/verifikasi");
  revalidatePath("/guru/siswa");
  revalidatePath("/admin");

  return {
    ok: true,
    message:
      parsed.data.status === "revisi"
        ? "Permintaan revisi dikirim ke siswa."
        : "Jurnal disetujui.",
  };
}
