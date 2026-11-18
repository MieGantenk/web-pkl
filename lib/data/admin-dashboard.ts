import { cache } from "react";
import { connection } from "next/server";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { jakartaToday } from "@/lib/date";
import type { StatusPengajuan } from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

export type AdminDashboardData = {
  today: string;
  stats: {
    siswa: number;
    guru: number;
    perusahaan: number;
    jurnal: number;
  };
  queues: {
    persetujuan: number;
    jurnal: number;
    belumDitempatkan: number;
  };
  period: {
    nama: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
  } | null;
  chart: Array<{ label: string; total: number }>;
  activities: Array<{
    id: string;
    nama: string;
    aksi: string;
    entitas: string;
    created_at: string;
  }>;
};

const acceptedStatuses: StatusPengajuan[] = [
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
  "selesai",
];

export const getAdminDashboard = cache(
  async (): Promise<AdminDashboardData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const now = new Date();
    const chartMonths = Array.from({ length: 6 }, (_, index) =>
      startOfMonth(subMonths(now, 5 - index)),
    );

    const [
      studentsRes,
      placementsRes,
      guruRes,
      perusahaanRes,
      jurnalRes,
      persetujuanRes,
      jurnalMenungguRes,
      periodRes,
      chartRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("siswa").select("id").eq("aktif", true),
      supabase
        .from("pengajuan_anggota")
        .select("siswa_id, pengajuan: pengajuan_id(status)"),
      supabase.from("guru").select("id", { count: "exact", head: true }),
      supabase
        .from("perusahaan")
        .select("id", { count: "exact", head: true })
        .eq("aktif", true),
      supabase.from("jurnal").select("id", { count: "exact", head: true }),
      supabase
        .from("pengajuan_pkl")
        .select("id", { count: "exact", head: true })
        .in("status", ["izin_ortu_diunggah", "balasan_diunggah"]),
      supabase
        .from("jurnal")
        .select("id", { count: "exact", head: true })
        .eq("status", "menunggu"),
      supabase
        .from("periode_pkl")
        .select("nama, tanggal_mulai, tanggal_selesai")
        .eq("aktif", true)
        .order("tanggal_mulai", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("pengajuan_pkl")
        .select("created_at")
        .gte("created_at", chartMonths[0].toISOString()),
      supabase
        .from("log_aktivitas")
        .select(
          "id, aksi, entitas, created_at, pengguna:pengguna_id(nama_lengkap)",
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (
      studentsRes.error ||
      placementsRes.error ||
      guruRes.error ||
      perusahaanRes.error ||
      jurnalRes.error ||
      persetujuanRes.error ||
      jurnalMenungguRes.error ||
      periodRes.error ||
      chartRes.error ||
      activityRes.error
    ) {
      throw new Error("Gagal memuat ringkasan admin.");
    }

    const students = studentsRes.data ?? [];
    const placedStudentIds = new Set(
      (placementsRes.data ?? [])
        .filter(
          (row) =>
            row.pengajuan !== null &&
            acceptedStatuses.includes(row.pengajuan.status),
        )
        .map((row) => row.siswa_id),
    );

    const monthCounts = new Map(
      chartMonths.map((month) => [format(month, "yyyy-MM"), 0]),
    );

    for (const row of chartRes.data ?? []) {
      const key = format(parseISO(row.created_at), "yyyy-MM");

      if (monthCounts.has(key)) {
        monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
      }
    }

    return {
      today,
      stats: {
        siswa: students.length,
        guru: guruRes.count ?? 0,
        perusahaan: perusahaanRes.count ?? 0,
        jurnal: jurnalRes.count ?? 0,
      },
      queues: {
        persetujuan: persetujuanRes.count ?? 0,
        jurnal: jurnalMenungguRes.count ?? 0,
        belumDitempatkan: students.filter(
          (student) => !placedStudentIds.has(student.id),
        ).length,
      },
      period: periodRes.data,
      chart: chartMonths.map((month) => ({
        label: format(month, "MMM", { locale: localeId }),
        total: monthCounts.get(format(month, "yyyy-MM")) ?? 0,
      })),
      activities: (activityRes.data ?? []).map((row) => ({
        id: row.id,
        nama: row.pengguna?.nama_lengkap ?? "Sistem",
        aksi: row.aksi,
        entitas: row.entitas,
        created_at: row.created_at,
      })),
    };
  },
);
