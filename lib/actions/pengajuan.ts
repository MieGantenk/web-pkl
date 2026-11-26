"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { validateStoredFile } from "@/lib/file-validation";
import { notifyAdmins } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";
import {
  anggotaPengajuanSchema,
  dokumenPengajuanSchema,
  pengajuanFormSchema,
  type PengajuanFormInput,
} from "@/lib/validators/pengajuan";
import type { StatusPengajuan } from "@/lib/status";

export type PengajuanActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data pengajuan tidak valid.");

const FINAL_STATUSES: StatusPengajuan[] = [
  "ditolak",
  "dibatalkan",
  "selesai",
];

async function requireSiswa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("id, peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.peran !== "siswa" || !profile.aktif) {
    return { ok: false as const, message: "Anda tidak berwenang." };
  }

  const { data: siswa } = await supabase
    .from("siswa")
    .select("id, aktif")
    .eq("pengguna_id", user.id)
    .maybeSingle();

  if (!siswa || !siswa.aktif) {
    return { ok: false as const, message: "Profil siswa tidak aktif." };
  }

  return {
    ok: true as const,
    supabase,
    profileId: user.id,
    siswaId: siswa.id,
  };
}

async function hasActiveApplication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siswaId: string,
) {
  const { data: memberships, error } = await supabase
    .from("pengajuan_anggota")
    .select("pengajuan_id")
    .eq("siswa_id", siswaId);

  if (error) {
    return { failed: true, active: false };
  }

  const ids = Array.from(
    new Set((memberships ?? []).map((item) => item.pengajuan_id)),
  );

  if (!ids.length) {
    return { failed: false, active: false };
  }

  const { data: applications, error: applicationError } = await supabase
    .from("pengajuan_pkl")
    .select("id, status")
    .in("id", ids);

  if (applicationError) {
    return { failed: true, active: false };
  }

  return {
    failed: false,
    active: (applications ?? []).some(
      (application) => !FINAL_STATUSES.includes(application.status),
    ),
  };
}

async function resolvePerusahaan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  penggunaId: string,
  data: PengajuanFormInput,
): Promise<
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
  | { ok: true; id: string }
> {
  if (data.perusahaan_id !== "baru") {
    const { data: company, error } = await supabase
      .from("perusahaan")
      .select("id, aktif")
      .eq("id", data.perusahaan_id)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        message: "Perusahaan belum dapat diperiksa.",
      };
    }

    if (!company || !company.aktif) {
      return {
        ok: false,
        message: "Periksa kembali data pengajuan.",
        fieldErrors: {
          perusahaan_id: "Perusahaan tidak aktif atau tidak ditemukan.",
        },
      };
    }

    return { ok: true, id: company.id };
  }

  const nama = data.perusahaan_nama.trim();
  const alamat = data.perusahaan_alamat.trim();

  if (!nama || !alamat) {
    return {
      ok: false,
      message: "Periksa kembali data perusahaan.",
      fieldErrors: {
        ...(!nama ? { perusahaan_nama: "Nama perusahaan wajib diisi." } : {}),
        ...(!alamat
          ? { perusahaan_alamat: "Alamat perusahaan wajib diisi." }
          : {}),
      },
    };
  }

  const admin = createAdminClient();
  const { data: companies, error: companiesError } = await admin
    .from("perusahaan")
    .select("id, nama, aktif");

  if (companiesError) {
    return {
      ok: false,
      message: "Perusahaan belum dapat diperiksa.",
    };
  }

  const existing = (companies ?? []).find(
    (company) => company.nama.trim().toLowerCase() === nama.toLowerCase(),
  );

  if (existing) {
    if (!existing.aktif) {
      return {
        ok: false,
        message: "Periksa kembali data perusahaan.",
        fieldErrors: {
          perusahaan_nama:
            "Perusahaan ini sedang nonaktif. Hubungi admin sekolah.",
        },
      };
    }

    return { ok: true, id: existing.id };
  }

  const { data: created, error: insertError } = await admin
    .from("perusahaan")
    .insert({ nama, alamat, aktif: true })
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      message: "Perusahaan baru belum dapat disimpan. Coba lagi.",
    };
  }

  try {
    await admin.from("log_aktivitas").insert({
      pengguna_id: penggunaId,
      aksi: "tambah_perusahaan",
      entitas: "perusahaan",
      entitas_id: created.id,
      detail: { nama, sumber: "pengajuan_siswa" },
    });
  } catch {
    // Audit log tidak boleh menggagalkan pengajuan.
  }

  return { ok: true, id: created.id };
}

async function getActiveOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  perusahaanId: string,
  periodeId: string,
): Promise<
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
  | {
      ok: true;
      periode: {
        id: string;
        aktif: boolean;
        tanggal_mulai: string;
        tanggal_selesai: string;
      };
    }
> {
  const [perusahaanResult, periodeResult] = await Promise.all([
    supabase
      .from("perusahaan")
      .select("id, aktif")
      .eq("id", perusahaanId)
      .maybeSingle(),
    supabase
      .from("periode_pkl")
      .select("id, aktif, tanggal_mulai, tanggal_selesai")
      .eq("id", periodeId)
      .maybeSingle(),
  ]);

  if (perusahaanResult.error || periodeResult.error) {
    return {
      ok: false,
      message: "Pilihan pengajuan belum dapat diperiksa.",
    };
  }

  if (!perusahaanResult.data || !perusahaanResult.data.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data pengajuan.",
      fieldErrors: {
        perusahaan_id: "Perusahaan tidak aktif atau tidak ditemukan.",
      },
    };
  }

  if (!periodeResult.data || !periodeResult.data.aktif) {
    return {
      ok: false,
      message: "Periksa kembali data pengajuan.",
      fieldErrors: {
        periode_id: "Periode PKL tidak aktif atau tidak ditemukan.",
      },
    };
  }

  return { ok: true, periode: periodeResult.data };
}

function revalidatePengajuan() {
  revalidatePath("/siswa/pengajuan");
  revalidatePath("/siswa");
  revalidatePath("/admin/perusahaan");
  revalidatePath("/admin");
}

export async function createPengajuanAction(
  input: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsed = pengajuanFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data pengajuan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data: PengajuanFormInput = parsed.data;
  const active = await hasActiveApplication(session.supabase, session.siswaId);

  if (active.failed) {
    return { ok: false, message: "Data pengajuan belum dapat diperiksa." };
  }

  if (active.active) {
    return {
      ok: false,
      message: "Anda masih memiliki pengajuan aktif.",
    };
  }

  const perusahaan = await resolvePerusahaan(
    session.supabase,
    session.profileId,
    data,
  );

  if (!perusahaan.ok) {
    return {
      ok: false,
      message: perusahaan.message,
      fieldErrors: perusahaan.fieldErrors,
    };
  }

  const options = await getActiveOptions(
    session.supabase,
    perusahaan.id,
    data.periode_id,
  );

  if (!options.ok) {
    return {
      ok: false,
      message: options.message,
      fieldErrors: options.fieldErrors,
    };
  }

  const createResult = await createAdminClient()
    .from("pengajuan_pkl")
    .insert({
      perusahaan_id: perusahaan.id,
      periode_id: data.periode_id,
      dibuat_oleh: session.profileId,
      status: "draft",
      tanggal_mulai: options.periode.tanggal_mulai,
      tanggal_selesai: options.periode.tanggal_selesai,
    })
    .select("id")
    .single();

  if (createResult.error) {
    return { ok: false, message: "Pengajuan belum dapat dibuat. Coba lagi." };
  }

  const memberResult = await session.supabase.from("pengajuan_anggota").insert({
    pengajuan_id: createResult.data.id,
    siswa_id: session.siswaId,
    peran: "ketua",
  });

  if (memberResult.error) {
    const admin = createAdminClient();
    await admin.from("pengajuan_pkl").delete().eq("id", createResult.data.id);

    return { ok: false, message: "Anggota pengajuan belum dapat disimpan." };
  }

  revalidatePengajuan();
  return { ok: true, id: createResult.data.id };
}

export async function updatePengajuanDraftAction(
  pengajuanId: unknown,
  input: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsedId = idSchema.safeParse(pengajuanId);
  const parsed = pengajuanFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data pengajuan tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali data pengajuan.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { data: current, error } = await session.supabase
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.dibuat_oleh !== session.profileId) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  if (current.status !== "draft") {
    return { ok: false, message: "Pengajuan yang sudah dikirim tidak dapat diubah." };
  }

  const data: PengajuanFormInput = parsed.data;
  const perusahaan = await resolvePerusahaan(
    session.supabase,
    session.profileId,
    data,
  );

  if (!perusahaan.ok) {
    return {
      ok: false,
      message: perusahaan.message,
      fieldErrors: perusahaan.fieldErrors,
    };
  }

  const options = await getActiveOptions(
    session.supabase,
    perusahaan.id,
    data.periode_id,
  );

  if (!options.ok) {
    return {
      ok: false,
      message: options.message,
      fieldErrors: options.fieldErrors,
    };
  }

  const result = await createAdminClient()
    .from("pengajuan_pkl")
    .update({
      perusahaan_id: perusahaan.id,
      periode_id: data.periode_id,
      tanggal_mulai: options.periode.tanggal_mulai,
      tanggal_selesai: options.periode.tanggal_selesai,
    })
    .eq("id", current.id)
    .select("id")
    .maybeSingle();

  if (result.error || !result.data) {
    return { ok: false, message: "Pengajuan belum dapat diperbarui. Coba lagi." };
  }

  revalidatePengajuan();
  return { ok: true, id: current.id };
}

export async function submitPengajuanAction(
  pengajuanId: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsedId = idSchema.safeParse(pengajuanId);

  if (!parsedId.success) {
    return { ok: false, message: "Data pengajuan tidak valid." };
  }

  const { data: current, error } = await session.supabase
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.dibuat_oleh !== session.profileId) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  if (current.status !== "draft") {
    return { ok: false, message: "Pengajuan sudah dikirim." };
  }

  const { count, error: countError } = await session.supabase
    .from("pengajuan_anggota")
    .select("id", { count: "exact", head: true })
    .eq("pengajuan_id", current.id);

  if (countError || !count) {
    return { ok: false, message: "Pengajuan belum memiliki anggota." };
  }

  const result = await createAdminClient()
    .from("pengajuan_pkl")
    .update({ status: "diajukan" })
    .eq("id", current.id)
    .select("id")
    .maybeSingle();

  if (result.error || !result.data) {
    return { ok: false, message: "Pengajuan belum dapat dikirim. Coba lagi." };
  }

  await notifyAdmins(
    {
      judul: "Pengajuan PKL baru",
      pesan: "Ada pengajuan PKL baru yang menunggu verifikasi admin.",
    },
    "/admin/pengajuan",
  );

  revalidatePengajuan();
  return { ok: true, id: current.id };
}

export async function addAnggotaAction(
  pengajuanId: unknown,
  input: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsedId = idSchema.safeParse(pengajuanId);
  const parsed = anggotaPengajuanSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data pengajuan tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali NIS anggota.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { data: current, error } = await session.supabase
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.dibuat_oleh !== session.profileId) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  if (current.status !== "draft") {
    return { ok: false, message: "Anggota hanya dapat diubah saat pengajuan masih draft." };
  }

  const admin = createAdminClient();
  const { data: candidate, error: candidateError } = await admin
    .from("siswa")
    .select("id, nis, aktif, pengguna:pengguna_id(nama_lengkap)")
    .eq("nis", parsed.data.nis)
    .maybeSingle();

  if (candidateError) {
    return { ok: false, message: "Siswa belum dapat diperiksa. Coba lagi." };
  }

  if (!candidate || !candidate.aktif) {
    return {
      ok: false,
      message: "Periksa kembali NIS anggota.",
      fieldErrors: { nis: "Siswa dengan NIS tersebut tidak ditemukan atau nonaktif." },
    };
  }

  if (candidate.id === session.siswaId) {
    return {
      ok: false,
      message: "Anda sudah menjadi ketua pengajuan.",
      fieldErrors: { nis: "Anda sudah menjadi ketua kelompok." },
    };
  }

  const { data: existingMember, error: existingError } = await admin
    .from("pengajuan_anggota")
    .select("id")
    .eq("pengajuan_id", current.id)
    .eq("siswa_id", candidate.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "Anggota belum dapat diperiksa." };
  }

  if (existingMember) {
    return {
      ok: false,
      message: "Siswa sudah menjadi anggota kelompok.",
      fieldErrors: { nis: "Siswa sudah menjadi anggota kelompok ini." },
    };
  }

  const { data: candidateMemberships, error: candidateMembershipError } =
    await admin
      .from("pengajuan_anggota")
      .select("pengajuan_id")
      .eq("siswa_id", candidate.id);

  if (candidateMembershipError) {
    return { ok: false, message: "Riwayat pengajuan anggota belum dapat diperiksa." };
  }

  const candidateApplicationIds = Array.from(
    new Set(
      (candidateMemberships ?? []).map((item) => item.pengajuan_id),
    ),
  );
  let candidateHasActiveApplication = false;

  if (candidateApplicationIds.length) {
    const { data: candidateApplications, error: candidateApplicationError } =
      await admin
        .from("pengajuan_pkl")
        .select("id, status")
        .in("id", candidateApplicationIds);

    if (candidateApplicationError) {
      return { ok: false, message: "Pengajuan anggota belum dapat diperiksa." };
    }

    candidateHasActiveApplication = (candidateApplications ?? []).some(
      (application) => !FINAL_STATUSES.includes(application.status),
    );
  }

  if (candidateHasActiveApplication) {
    return {
      ok: false,
      message: "Siswa tersebut sudah memiliki pengajuan aktif.",
      fieldErrors: { nis: "Siswa tersebut sudah memiliki pengajuan aktif." },
    };
  }

  const result = await session.supabase
    .from("pengajuan_anggota")
    .insert({
      pengajuan_id: current.id,
      siswa_id: candidate.id,
      peran: "anggota",
    })
    .select("id")
    .single();

  if (result.error) {
    return { ok: false, message: "Anggota belum dapat ditambahkan. Coba lagi." };
  }

  revalidatePengajuan();
  return { ok: true, id: result.data.id };
}

export async function removeAnggotaAction(
  pengajuanId: unknown,
  siswaId: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsedId = idSchema.safeParse(pengajuanId);
  const parsedSiswaId = idSchema.safeParse(siswaId);

  if (!parsedId.success || !parsedSiswaId.success) {
    return { ok: false, message: "Data anggota tidak valid." };
  }

  const { data: current, error } = await session.supabase
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !current || current.dibuat_oleh !== session.profileId) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  if (current.status !== "draft") {
    return { ok: false, message: "Anggota hanya dapat diubah saat pengajuan masih draft." };
  }

  const { data: member, error: memberError } = await session.supabase
    .from("pengajuan_anggota")
    .select("id, peran")
    .eq("pengajuan_id", current.id)
    .eq("siswa_id", parsedSiswaId.data)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, message: "Anggota tidak ditemukan." };
  }

  if (member.peran === "ketua") {
    return { ok: false, message: "Ketua kelompok tidak dapat dihapus." };
  }

  const result = await session.supabase
    .from("pengajuan_anggota")
    .delete()
    .eq("id", member.id);
  if (result.error) {
    return { ok: false, message: "Anggota belum dapat dihapus. Coba lagi." };
  }

  revalidatePengajuan();
  return { ok: true, id: member.id };
}

export async function recordDokumenAction(
  input: unknown,
): Promise<PengajuanActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsed = dokumenPengajuanSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Berkas tidak valid.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  const { data: membership, error: membershipError } = await session.supabase
    .from("pengajuan_anggota")
    .select("id")
    .eq("pengajuan_id", data.pengajuan_id)
    .eq("siswa_id", session.siswaId)
    .maybeSingle();

  if (membershipError || !membership) {
    return { ok: false, message: "Anda bukan anggota pengajuan ini." };
  }

  const { data: current, error } = await session.supabase
    .from("pengajuan_pkl")
    .select("id, status, dibuat_oleh")
    .eq("id", data.pengajuan_id)
    .maybeSingle();

  if (error || !current) {
    return { ok: false, message: "Pengajuan tidak ditemukan." };
  }

  const expectedStatus =
    data.jenis === "izin_orang_tua_ttd"
      ? "izin_ortu_terbit"
      : "pengajuan_terbit";
  const nextStatus =
    data.jenis === "izin_orang_tua_ttd"
      ? "izin_ortu_diunggah"
      : "balasan_diunggah";

  if (current.status !== expectedStatus) {
    return {
      ok: false,
      message: "Dokumen belum bisa diunggah pada status pengajuan ini.",
    };
  }

  const prefix = `${data.pengajuan_id}/`;
  if (
    !data.file_path.startsWith(prefix) ||
    data.file_path.includes("..")
  ) {
    return { ok: false, message: "Lokasi berkas tidak valid." };
  }

  const admin = createAdminClient();
  const fileName = data.file_path.slice(prefix.length);

  if (!fileName || fileName.includes("/")) {
    return { ok: false, message: "Lokasi berkas tidak valid." };
  }

  const { data: stored, error: storedError } = await admin.storage
    .from("dokumen")
    .list(data.pengajuan_id, {
      search: fileName,
      limit: 1,
    });

  if (
    storedError ||
    !stored?.some((object) => object.name === fileName)
  ) {
    return { ok: false, message: "Berkas belum ditemukan di penyimpanan." };
  }

  const validated = await validateStoredFile({
    download: () =>
      admin.storage.from("dokumen").download(data.file_path),
    mimeType: data.mime_type,
    expectedSize: data.ukuran,
    label: "Berkas dokumen",
  });

  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  const insertResult = await session.supabase
    .from("dokumen")
    .insert({
      pengajuan_id: data.pengajuan_id,
      jenis: data.jenis,
      file_path: data.file_path,
      file_name: data.file_name,
      mime_type: data.mime_type,
      ukuran: data.ukuran,
      diunggah_oleh: session.profileId,
    })
    .select("id")
    .single();

  if (insertResult.error) {
    return { ok: false, message: "Dokumen belum dapat dicatat. Coba lagi." };
  }

  const statusResult = await admin
    .from("pengajuan_pkl")
    .update({ status: nextStatus })
    .eq("id", data.pengajuan_id)
    .eq("status", expectedStatus);

  if (statusResult.error) {
    return {
      ok: false,
      message: "Dokumen tersimpan, tetapi status pengajuan belum berubah. Hubungi admin.",
    };
  }

  await notifyAdmins(
    {
      judul:
        data.jenis === "izin_orang_tua_ttd"
          ? "Izin orang tua diunggah"
          : "Balasan perusahaan diunggah",
      pesan:
        data.jenis === "izin_orang_tua_ttd"
          ? "Dokumen izin orang tua sudah diunggah dan menunggu pemeriksaan admin."
          : "Balasan perusahaan sudah diunggah dan menunggu pemeriksaan admin.",
    },
    "/admin/pengajuan",
  );

  revalidatePengajuan();
  return { ok: true, id: insertResult.data.id };
}
