import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Role = "admin" | "guru" | "siswa" | "instruktur" | "ortu";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export const roleLabels: Record<Role, string> = {
  admin: "Admin Sekolah",
  guru: "Guru Pembimbing",
  siswa: "Siswa",
  instruktur: "Instruktur Perusahaan",
  ortu: "Orang Tua",
};

export const roleHome: Record<Role, string> = {
  admin: "/admin",
  guru: "/guru",
  siswa: "/siswa",
  instruktur: "/instruktur",
  ortu: "/ortu",
};

export const navigation: Record<Role, NavItem[]> = {
  admin: [
    { label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
    {
      label: "Data Master",
      href: "/admin/siswa",
      icon: Users,
      children: [
        { label: "Siswa", href: "/admin/siswa", icon: Users },
        { label: "Guru", href: "/admin/guru", icon: GraduationCap },
        { label: "Perusahaan", href: "/admin/perusahaan", icon: Building2 },
        { label: "Instruktur", href: "/admin/instruktur", icon: UserCog },
        { label: "Orang Tua", href: "/admin/orang-tua", icon: HeartHandshake },
        { label: "Akun", href: "/admin/akun", icon: Users },
      ],
    },
    {
      label: "PKL",
      href: "/admin/pengajuan",
      icon: ClipboardCheck,
      children: [
        { label: "Pengajuan", href: "/admin/pengajuan", icon: FileText },
        { label: "Penempatan", href: "/admin/penempatan", icon: Building2 },
        { label: "Jurnal", href: "/admin/jurnal", icon: BookOpen },
        { label: "Mutaba'ah", href: "/admin/mutabaah", icon: HeartHandshake },
      ],
    },
    { label: "Surat", href: "/admin/surat", icon: ScrollText },
    { label: "Laporan", href: "/admin/laporan", icon: BarChart3 },
    { label: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
    { label: "Audit", href: "/admin/audit", icon: ShieldCheck },
  ],
  guru: [
    { label: "Ringkasan", href: "/guru", icon: LayoutDashboard },
    { label: "Siswa Bimbingan", href: "/guru/siswa", icon: Users },
    { label: "Mutaba'ah", href: "/guru/mutabaah", icon: HeartHandshake },
    { label: "Surat Tugas", href: "/guru/surat-tugas", icon: ScrollText },
    { label: "Penarikan", href: "/guru/penarikan", icon: FileText },
    { label: "Profil", href: "/guru/profil", icon: UserRound },
  ],
  siswa: [
    { label: "Beranda", href: "/siswa", icon: LayoutDashboard },
    { label: "Pengajuan PKL", href: "/siswa/pengajuan", icon: FileText },
    { label: "Jurnal Harian", href: "/siswa/jurnal", icon: BookOpen },
    { label: "Mutaba'ah", href: "/siswa/mutabaah", icon: HeartHandshake },
    { label: "Surat", href: "/siswa/surat", icon: ScrollText },
    { label: "Profil", href: "/siswa/profil", icon: UserRound },
  ],
  instruktur: [
    { label: "Ringkasan", href: "/instruktur", icon: LayoutDashboard },
    { label: "Siswa PKL", href: "/instruktur/siswa", icon: Users },
    { label: "Penilaian", href: "/instruktur/penilaian", icon: Award },
    { label: "Profil", href: "/instruktur/profil", icon: UserRound },
  ],
  ortu: [
    { label: "Beranda", href: "/ortu", icon: LayoutDashboard },
    { label: "Jurnal Anak", href: "/ortu/jurnal", icon: BookOpen },
    { label: "Mutaba'ah", href: "/ortu/mutabaah", icon: HeartHandshake },
    { label: "Surat", href: "/ortu/surat", icon: ScrollText },
    { label: "Profil", href: "/ortu/profil", icon: UserRound },
  ],
};

export const bottomNavigation: Partial<Record<Role, NavItem[]>> = {
  guru: [
    { label: "Ringkasan", href: "/guru", icon: LayoutDashboard },
    { label: "Siswa", href: "/guru/siswa", icon: Users },
    { label: "Profil", href: "/guru/profil", icon: UserRound },
  ],
  siswa: [
    { label: "Beranda", href: "/siswa", icon: LayoutDashboard },
    { label: "Jurnal", href: "/siswa/jurnal", icon: BookOpen },
    { label: "Mutaba'ah", href: "/siswa/mutabaah", icon: HeartHandshake },
    { label: "Surat", href: "/siswa/surat", icon: ScrollText },
    { label: "Profil", href: "/siswa/profil", icon: UserRound },
  ],
  instruktur: [
    { label: "Ringkasan", href: "/instruktur", icon: LayoutDashboard },
    { label: "Siswa", href: "/instruktur/siswa", icon: Users },
    { label: "Profil", href: "/instruktur/profil", icon: UserRound },
  ],
  ortu: [
    { label: "Beranda", href: "/ortu", icon: LayoutDashboard },
    { label: "Jurnal", href: "/ortu/jurnal", icon: BookOpen },
    { label: "Mutaba'ah", href: "/ortu/mutabaah", icon: HeartHandshake },
    { label: "Profil", href: "/ortu/profil", icon: UserRound },
  ],
};
