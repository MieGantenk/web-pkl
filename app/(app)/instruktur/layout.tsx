import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function InstrukturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("instruktur");

  return children;
}
