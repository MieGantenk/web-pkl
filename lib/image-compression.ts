const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Kompres gambar di browser sebelum masuk ke Supabase Storage.
 * PDF/DOCX dikembalikan apa adanya.
 */
export async function compressImage(
  file: File,
  options?: { maxSizeMB?: number; maxWidthOrHeight?: number },
) {
  if (!IMAGE_TYPES.has(file.type) || file.size === 0) {
    return file;
  }

  const { default: imageCompression } = await import(
    "browser-image-compression"
  );

  return imageCompression(file, {
    maxSizeMB: options?.maxSizeMB ?? 1,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1600,
    useWebWorker: true,
    initialQuality: 0.82,
  });
}
