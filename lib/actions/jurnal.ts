"use server";

import { revalidatePath } from "next/cache";

import { jakartaToday } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom } from "@/lib/validators/common";
import { createJurnalSchema } from "@/lib/validators/jurnal";

export type JurnalActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireSiswa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      message: "Sesi tidak valid. Silakan masuk lagi.",
    };
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

  return { ok: true as const, supabase, siswaId: siswa.id };
}

function cleanupFoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
) {
  void supabase.storage.from("jurnal").remove([path]);
}

function revalidateJurnal() {
  revalidatePath("/siswa/jurnal");
  revalidatePath("/siswa/jurnal/baru");
  revalidatePath("/siswa");
  revalidatePath("/guru/verifikasi");
  revalidatePath("/guru/siswa");
  revalidatePath("/instruktur/verifikasi");
  revalidatePath("/instruktur/siswa");
  revalidatePath("/admin/jurnal");
}

export async function createJurnalAction(
  input: unknown,
): Promise<JurnalActionResult> {
  const session = await requireSiswa();
  if (!session.ok) return session;

  const parsed = createJurnalSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  const today = jakartaToday();

  if (data.tanggal > today) {
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: {
        tanggal: "Tanggal jurnal tidak boleh melewati hari ini.",
      },
    };
  }

  const { data: memberships, error: membershipError } = await session.supabase
    .from("pengajuan_anggota")
    .select(
      "pengajuan:pengajuan_id(id, status, tanggal_mulai, tanggal_selesai)",
    )
    .eq("siswa_id", session.siswaId)
    .order("created_at", { ascending: false });

  if (membershipError) {
    return { ok: false, message: "Penempatan PKL belum dapat diperiksa." };
  }

  const placement = (memberships ?? [])
    .map((membership) => membership.pengajuan)
    .find((pengajuan) => pengajuan?.status === "berlangsung");

  if (!placement) {
    return {
      ok: false,
      message: "Jurnal dapat diisi saat PKL berstatus berlangsung.",
    };
  }

  if (placement.tanggal_mulai && data.tanggal < placement.tanggal_mulai) {
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: {
        tanggal: "Tanggal jurnal sebelum masa PKL dimulai.",
      },
    };
  }

  if (placement.tanggal_selesai && data.tanggal > placement.tanggal_selesai) {
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: {
        tanggal: "Tanggal jurnal melewati masa PKL.",
      },
    };
  }

  const fotoPattern = new RegExp(
    `^${session.siswaId}/${data.tanggal}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png)$`,
    "i",
  );

  if (!fotoPattern.test(data.foto_path)) {
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: {
        foto_path: "Foto kegiatan tidak valid. Pilih ulang foto.",
      },
    };
  }

  const { data: existing, error: existingError } = await session.supabase
    .from("jurnal")
    .select("id")
    .eq("siswa_id", session.siswaId)
    .eq("tanggal", data.tanggal)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "Jurnal belum dapat diperiksa. Coba lagi." };
  }

  if (existing) {
    cleanupFoto(session.supabase, data.foto_path);
    return {
      ok: false,
      message: "Periksa kembali jurnal Anda.",
      fieldErrors: {
        tanggal: "Jurnal untuk tanggal ini sudah ada.",
      },
    };
  }

  const { data: inserted, error } = await session.supabase
    .from("jurnal")
    .insert({
      siswa_id: session.siswaId,
      pengajuan_id: placement.id,
      tanggal: data.tanggal,
      waktu_mulai: data.waktu_mulai,
      waktu_selesai: data.waktu_selesai,
      kegiatan: data.kegiatan,
      deskripsi: data.deskripsi || null,
      foto_path: data.foto_path,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    cleanupFoto(session.supabase, data.foto_path);

    if (error?.code === "23505") {
      return {
        ok: false,
        message: "Periksa kembali jurnal Anda.",
        fieldErrors: {
          tanggal: "Jurnal untuk tanggal ini sudah ada.",
        },
      };
    }

    return {
      ok: false,
      message: "Jurnal belum dapat disimpan. Coba lagi.",
    };
  }

  revalidateJurnal();
  return { ok: true, id: inserted.id };
}
