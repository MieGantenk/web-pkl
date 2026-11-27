import { renderAccountListPdf } from "@/lib/letters/render-account-list";
import { getAccountExportRole } from "@/lib/account-export";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const roleOption = getAccountExportRole(
    new URL(request.url).searchParams.get("role"),
  );

  if (!roleOption) {
    return Response.json(
      { message: "Pilih role akun yang valid." },
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

  const { data: accounts, error: accountsError } = await admin
    .from("pengguna")
    .select("email, nama_lengkap, peran, username")
    .eq("peran", roleOption.role)
    .order("nama_lengkap", { ascending: true });

  if (accountsError) {
    return Response.json(
      { message: "Daftar akun belum dapat dimuat. Coba lagi." },
      { status: 500 },
    );
  }

  if (!accounts.length) {
    return Response.json(
      { message: `Belum ada akun ${roleOption.label.toLowerCase()}.` },
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
      "Content-Disposition": `attachment; filename="akun-${roleOption.role}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
