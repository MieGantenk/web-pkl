import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import type { SuratPdfData } from "@/lib/data/admin-surat";
import { SuratDocument } from "@/lib/letters/SuratDocument";

export function renderSuratPdf(data: SuratPdfData) {
  return renderToBuffer(<SuratDocument data={data} />);
}
