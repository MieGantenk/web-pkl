import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { AccountListDocument } from "@/lib/letters/AccountListDocument";
import type { Database } from "@/types/database";

type AccountListRow = Pick<
  Database["public"]["Tables"]["pengguna"]["Row"],
  "email" | "nama_lengkap" | "peran" | "username"
>;

export function renderAccountListPdf(
  accounts: AccountListRow[],
  generatedAt: string,
) {
  return renderToBuffer(
    <AccountListDocument accounts={accounts} generatedAt={generatedAt} />,
  );
}
