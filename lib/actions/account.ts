"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminAction } from "@/lib/actions/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  postgresUuidPattern,
} from "@/lib/validators/common";
import { resetAccountPasswordSchema } from "@/lib/validators/password";

export type AccountPasswordResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type ManagedAccountRole = "siswa" | "guru" | "instruktur" | "ortu";

export type DeleteAccountResult =
  | {
      ok: true;
      role: ManagedAccountRole;
      warning?: string;
    }
  | { ok: false; message: string };

const idSchema = z
  .string()
  .regex(postgresUuidPattern, "Data akun tidak valid.");

const managedAccountRoleSchema = z.enum([
  "siswa",
  "guru",
  "instruktur",
  "ortu",
]);

export async function resetAccountPasswordAction(
  penggunaId: unknown,
  input: unknown,
): Promise<AccountPasswordResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(penggunaId);
  const parsed = resetAccountPasswordSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Data akun tidak valid." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali kata sandi.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("pengguna")
    .select("id, peran")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !account) {
    return { ok: false, message: "Akun tidak ditemukan." };
  }

  const result = await admin.auth.admin.updateUserById(account.id, {
    password: parsed.data.password,
  });

  if (result.error) {
    return {
      ok: false,
      message: result.error.message.toLowerCase().includes("weak")
        ? "Kata sandi terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol."
        : "Kata sandi belum dapat diperbarui. Coba lagi.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await admin.from("log_aktivitas").insert({
        pengguna_id: user.id,
        aksi: "atur_ulang_kata_sandi",
        entitas: "pengguna",
        entitas_id: account.id,
        detail: { peran: account.peran },
      });
    }
  } catch {
    // Audit log tidak boleh menggagalkan perubahan kata sandi.
  }

  revalidatePath("/admin/siswa");
  revalidatePath("/admin/guru");
  revalidatePath("/admin/instruktur");
  revalidatePath("/admin/orang-tua");
  revalidatePath("/admin/audit");
  revalidatePath("/admin");

  return { ok: true, id: account.id };
}

export async function deleteAccountAction(
  penggunaId: unknown,
): Promise<DeleteAccountResult> {
  const auth = await assertAdminAction();
  if (auth) return auth;

  const parsedId = idSchema.safeParse(penggunaId);

  if (!parsedId.success) {
    return { ok: false, message: "Data akun tidak valid." };
  }

  const admin = createAdminClient();
  const { data: account, error: accountError } = await admin
    .from("pengguna")
    .select("id, peran")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (accountError || !account) {
    return { ok: false, message: "Akun tidak ditemukan." };
  }

  const parsedRole = managedAccountRoleSchema.safeParse(account.peran);

  if (!parsedRole.success) {
    return {
      ok: false,
      message: "Akun admin tidak dapat dihapus melalui fitur ini.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const storageFiles: Array<{
    bucket: "jurnal" | "tugas" | "sertifikat";
    paths: string[];
  }> = [];

  if (parsedRole.data === "siswa") {
    const { data: student, error: studentError } = await admin
      .from("siswa")
      .select("id")
      .eq("pengguna_id", account.id)
      .maybeSingle();

    if (studentError || !student) {
      return {
        ok: false,
        message: "Data siswa tidak dapat disiapkan untuk dihapus.",
      };
    }

    const [journalResult, taskResult, certificateResult] = await Promise.all([
      admin
        .from("jurnal")
        .select("foto_path")
        .eq("siswa_id", student.id),
      admin
        .from("tugas_siswa")
        .select("file_path")
        .eq("siswa_id", student.id),
      admin
        .from("sertifikat")
        .select("file_path")
        .eq("siswa_id", student.id),
    ]);

    if (
      journalResult.error ||
      taskResult.error ||
      certificateResult.error
    ) {
      return {
        ok: false,
        message: "Berkas terkait akun siswa belum dapat diperiksa.",
      };
    }

    storageFiles.push(
      {
        bucket: "jurnal",
        paths: (journalResult.data ?? []).flatMap((row) =>
          row.foto_path ? [row.foto_path] : [],
        ),
      },
      {
        bucket: "tugas",
        paths: (taskResult.data ?? []).flatMap((row) =>
          row.file_path ? [row.file_path] : [],
        ),
      },
      {
        bucket: "sertifikat",
        paths: (certificateResult.data ?? []).flatMap((row) =>
          row.file_path ? [row.file_path] : [],
        ),
      },
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(account.id);

  if (deleteError) {
    return {
      ok: false,
      message:
        "Akun belum dapat dihapus. Riwayat yang masih digunakan mungkin membatasi penghapusan; nonaktifkan akun untuk mempertahankan datanya.",
    };
  }

  const cleanupFailures: string[] = [];

  for (const { bucket, paths } of storageFiles) {
    for (let offset = 0; offset < paths.length; offset += 100) {
      try {
        const { error } = await admin.storage
          .from(bucket)
          .remove(paths.slice(offset, offset + 100));

        if (!error) continue;
        cleanupFailures.push(bucket);
        break;
      } catch {
        cleanupFailures.push(bucket);
        break;
      }
    }
  }

  let auditFailed = false;

  try {
    const { error } = await admin.from("log_aktivitas").insert({
      pengguna_id: user.id,
      aksi: "hapus_akun",
      entitas: "pengguna",
      entitas_id: account.id,
      detail: { peran: parsedRole.data },
    });

    auditFailed = Boolean(error);
  } catch {
    auditFailed = true;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/akun");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/guru");
  revalidatePath("/admin/instruktur");
  revalidatePath("/admin/orang-tua");
  revalidatePath("/admin/audit");

  const warnings: string[] = [];

  if (cleanupFailures.length) {
    warnings.push(
      `Berkas di bucket ${Array.from(new Set(cleanupFailures)).join(", ")} belum dapat dibersihkan.`,
    );
  }

  if (auditFailed) {
    warnings.push("Log aktivitas penghapusan belum dapat disimpan.");
  }

  return {
    ok: true,
    role: parsedRole.data,
    warning: warnings.length
      ? `Akun berhasil dihapus, tetapi ${warnings.join(" ")} Hubungi admin teknis untuk pemeriksaan.`
      : undefined,
  };
}
