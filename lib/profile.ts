import type { Role } from "@/lib/navigation";

export type Profile = {
  id: string;
  nama_lengkap: string;
  peran: Role;
  avatar_url: string | null;
  aktif: boolean;
};
