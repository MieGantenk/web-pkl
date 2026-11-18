import { AppShell } from "@/components/app/AppShell";
import { requireProfile } from "@/lib/auth";

// AppShell butuh profil aktif sebelum render; rute ini memang memblokir.
export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
