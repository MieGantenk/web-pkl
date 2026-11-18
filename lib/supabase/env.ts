/**
 * Supabase menyediakan nama kunci publik yang berbeda antar-generasi project.
 * Terima keduanya agar .env lama dan baru tetap berjalan.
 */
export function supabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan kunci publik Supabase belum diisi.",
    );
  }

  return { url, key };
}
