import { redirect } from "next/navigation";

export const instant = false;

export default async function PrintSuratRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/surat/print/${id}`);
}
