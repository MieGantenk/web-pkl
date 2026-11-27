export const accountExportRoles = [
  { role: "siswa", label: "Siswa" },
  { role: "instruktur", label: "Instruktur" },
  { role: "guru", label: "Guru" },
  { role: "ortu", label: "Orang Tua" },
] as const;

export type AccountExportRole =
  (typeof accountExportRoles)[number]["role"];

export function getAccountExportRole(role: string | null) {
  return accountExportRoles.find((option) => option.role === role) ?? null;
}
