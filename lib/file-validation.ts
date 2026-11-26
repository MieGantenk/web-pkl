const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // DOCX

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
}

function containsSignature(
  bytes: Uint8Array,
  signature: number[],
  maxOffset: number,
) {
  const lastStart = Math.min(bytes.length - signature.length, maxOffset);

  for (let start = 0; start <= lastStart; start += 1) {
    if (
      signature.every(
        (value, offset) => bytes[start + offset] === value,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function hasExpectedFileSignature(
  bytes: Uint8Array,
  mimeType: string,
) {
  if (mimeType === "application/pdf") {
    return containsSignature(bytes, PDF_SIGNATURE, 1024);
  }

  if (mimeType === "image/jpeg") {
    return startsWith(bytes, JPEG_SIGNATURE);
  }

  if (mimeType === "image/png") {
    return startsWith(bytes, PNG_SIGNATURE);
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return startsWith(bytes, ZIP_SIGNATURE);
  }

  return false;
}

export type FileValidationResult =
  | { ok: true; size: number }
  | { ok: false; message: string };

/**
 * Memastikan berkas yang tercatat benar-benar ada di storage, ukurannya sesuai
 * metadata, dan isinya cocok dengan tipe berkas yang diklaim. Ini mencegah
 * berkas kosong atau berkas lain yang hanya diganti ekstensinya.
 */
export async function validateStoredFile(input: {
  download: () => Promise<{ data: Blob | null; error: unknown }>;
  mimeType: string;
  expectedSize: number;
  label: string;
}): Promise<FileValidationResult> {
  const { data, error } = await input.download();

  if (error || !data) {
    return {
      ok: false,
      message: `${input.label} belum ditemukan di penyimpanan.`,
    };
  }

  if (data.size < 1) {
    return { ok: false, message: `${input.label} kosong. Pilih berkas lain.` };
  }

  if (data.size !== input.expectedSize) {
    return {
      ok: false,
      message: `${input.label} tidak cocok dengan berkas yang diunggah. Pilih ulang berkas.`,
    };
  }

  const header = new Uint8Array(await data.slice(0, 1024).arrayBuffer());

  if (!hasExpectedFileSignature(header, input.mimeType)) {
    return {
      ok: false,
      message: `${input.label} bukan berkas PDF, JPG, PNG, atau DOCX yang valid.`,
    };
  }

  return { ok: true, size: data.size };
}
