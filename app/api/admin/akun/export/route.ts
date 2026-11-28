import { renderAccountListPdf } from "@/lib/letters/render-account-list";
import { getAccountExportRole } from "@/lib/account-export";
import { getPeriodeKelas } from "@/lib/periode-kelas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const roleOption = getAccountExportRole(searchParams.get("role"));

  if (!roleOption) {
    return Response.json(
      { message: "Pilih role akun yang valid." },
      { status: 400 },
    );
  }

  const periodeId = searchParams.get("periode");
  const needsPeriod = roleOption.role === "siswa" || roleOption.role === "ortu";

  if (needsPeriod && !periodeId) {
    return Response.json(
      { message: "Pilih periode PKL untuk mengunduh PDF akun." },
      { status: 400 },
    );
  }

  if (periodeId && !z.string().uuid().safeParse(periodeId).success) {
    return Response.json(
      { message: "Periode PKL tidak valid." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("pengguna")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return Response.json(
      { message: "Akun Anda belum dapat diperiksa. Coba lagi." },
      { status: 500 },
    );
  }

  if (!profile?.aktif || profile.peran !== "admin") {
    return Response.json({ message: "Anda tidak berwenang." }, { status: 403 });
  }

  let periode: { id: string; nama: string; tahun_ajaran: string } | null = null;
  let accountIds: string[] | null = null;

  if (needsPeriod && periodeId) {
    const { data: periodeData, error: periodeError } = await admin
      .from("periode_pkl")
      .select("id, nama, tahun_ajaran")
      .eq("id", periodeId)
      .maybeSingle();

    if (periodeError) {
      return Response.json(
        { message: "Periode PKL belum dapat diperiksa. Coba lagi." },
        { status: 500 },
      );
    }

    if (!periodeData) {
      return Response.json(
        { message: "Periode PKL tidak ditemukan." },
        { status: 404 },
      );
    }

    periode = periodeData;

    const { data: siswa, error: siswaError } = await admin
      .from("siswa")
      .select("id, pengguna_id, kelas")
      .not("kelas", "is", null);

    if (siswaError) {
      return Response.json(
        { message: "Daftar akun belum dapat dimuat. Coba lagi." },
        { status: 500 },
      );
    }

    const siswaPeriode = siswa.filter(
      (row) =>
        getPeriodeKelas(row.kelas)?.tahunAjaran === periode?.tahun_ajaran,
    );
    const siswaIds = siswaPeriode.map((row) => row.id);

    if (roleOption.role === "siswa") {
      accountIds = siswaPeriode.map((row) => row.pengguna_id);
    } else if (siswaIds.length) {
      const { data: relasiOrtu, error: relasiError } = await admin
        .from("orang_tua_siswa")
        .select("pengguna_id")
        .in("siswa_id", siswaIds);

      if (relasiError) {
        return Response.json(
          { message: "Daftar akun belum dapat dimuat. Coba lagi." },
          { status: 500 },
        );
      }

      accountIds = Array.from(
        new Set((relasiOrtu ?? []).map((row) => row.pengguna_id)),
      );
    } else {
      accountIds = [];
    }

    if (!accountIds.length) {
      return Response.json(
        {
          message: `Belum ada akun ${roleOption.label.toLowerCase()} pada periode ${periode.nama}.`,
        },
        { status: 404 },
      );
    }
  }

  let accountsQuery = admin
    .from("pengguna")
    .select("email, nama_lengkap, peran, username")
    .eq("peran", roleOption.role)
    .order("nama_lengkap", { ascending: true });

  if (accountIds) {
    accountsQuery = accountsQuery.in("id", accountIds);
  }

  const { data: accounts, error: accountsError } = await accountsQuery;

  if (accountsError) {
    return Response.json(
      { message: "Daftar akun belum dapat dimuat. Coba lagi." },
      { status: 500 },
    );
  }

  if (!accounts.length) {
    return Response.json(
      {
        message: periode
          ? `Belum ada akun ${roleOption.label.toLowerCase()} pada periode ${periode.nama}.`
          : `Belum ada akun ${roleOption.label.toLowerCase()}.`,
      },
      { status: 404 },
    );
  }

  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  let pdf: Buffer;
  try {
    pdf = await renderAccountListPdf(
      accounts,
      roleOption.label,
      generatedAt,
      periode?.nama,
    );
  } catch {
    return Response.json(
      { message: "PDF akun belum dapat dibuat. Coba lagi." },
      { status: 500 },
    );
  }

  const { error: auditError } = await admin.from("log_aktivitas").insert({
    pengguna_id: user.id,
    aksi: "ekspor_akun_pdf",
    entitas: "pengguna",
    detail: {
      peran: roleOption.role,
      jumlah_pengguna: accounts.length,
      ...(periode ? { periode_id: periode.id } : {}),
    },
  });

  if (auditError) {
    return Response.json(
      { message: "Unduhan belum dicatat. PDF tidak jadi dikirim; coba lagi." },
      { status: 500 },
    );
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="akun-${roleOption.role}${periode ? `-${periode.tahun_ajaran.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}` : ""}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
