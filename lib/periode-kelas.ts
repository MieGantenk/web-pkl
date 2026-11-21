export type PeriodeKelas = {
  tahunAjaran: string;
  level: string;
};

/**
 * Periode PKL mengikuti tingkat kelas pada tahun ajaran 2026/2027:
 * kelas XI berangkat pada 2026/2027, kelas X berangkat pada 2027/2028.
 */
export const PERIODE_KELAS: readonly PeriodeKelas[] = [
  { tahunAjaran: "2026/2027", level: "XI" },
  { tahunAjaran: "2027/2028", level: "X" },
];

export function getKelasLevel(kelas: string | null | undefined) {
  const level = kelas?.trim().split(/\s+/)[0]?.toUpperCase();

  return level || null;
}

export function getPeriodeKelas(kelas: string | null | undefined) {
  const level = getKelasLevel(kelas);

  if (!level) {
    return null;
  }

  return PERIODE_KELAS.find((periode) => periode.level === level) ?? null;
}
