import { renderAccountListPdf } from "@/lib/letters/render-account-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const includedRoles = ["siswa", "instruktur", "guru", "ortu"] as const;

export async function GET() {
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
    .in("peran", [...includedRoles])
    .order("nama_lengkap", { ascending: true });

  if (accountsError) {
    return Response.json(
      { message: "Daftar akun belum dapat dimuat. Coba lagi." },
      { status: 500 },
    );
  }

  if (!accounts.length) {
    return Response.json(
      { message: "Belum ada akun pada role yang dipilih." },
      { status: 404 },
    );
  }

  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  let pdf: Buffer;
  try {
    pdf = await renderAccountListPdf(accounts, generatedAt);
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
      peran: [...includedRoles],
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
      "Content-Disposition": 'attachment; filename="akun-pengguna.pdf"',
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
