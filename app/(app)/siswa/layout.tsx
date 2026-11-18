import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("siswa");

  return children;
}
