import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("guru");

  return children;
}
