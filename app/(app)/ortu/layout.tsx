import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function OrtuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ortu");

  return children;
}
