import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export const AUDIT_PAGE_SIZE = 20;

export type AuditFilters = {
  q: string;
  aksi: string;
  entitas: string;
  dari: string;
  sampai: string;
  page: number;
};

export type AuditUser = {
  id: string;
  nama: string;
  username: string;
  peran: string;
};

export type AuditRow = {
  id: string;
  aksi: string;
  entitas: string;
  entitasId: string | null;
  detail: Json | null;
  createdAt: string;
  pengguna: AuditUser | null;
};

export type AuditListResult = {
  rows: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  aksiOptions: string[];
  entitasOptions: string[];
  stats: {
    total: number;
    today: number;
    actions: number;
  };
};

export function normalizeAuditDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toISOString();
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999+07:00`).toISOString();
}

function cleanSearch(value: string) {
  return value.replace(/[%_,()]/g, " ").trim();
}

export async function getAuditList(
  filters: AuditFilters,
): Promise<AuditListResult> {
  await connection();

  const admin = createAdminClient();
  const page = Math.max(1, filters.page || 1);
  const pageSize = AUDIT_PAGE_SIZE;
  const term = cleanSearch(filters.q);
  const dari = normalizeAuditDate(filters.dari);
  const sampai = normalizeAuditDate(filters.sampai);
  const today = jakartaToday();

  const [totalRes, todayRes, optionsRes] = await Promise.all([
    admin.from("log_aktivitas").select("id", { count: "exact", head: true }),
    admin
      .from("log_aktivitas")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayStart(today))
      .lte("created_at", dayEnd(today)),
    admin
      .from("log_aktivitas")
      .select("aksi, entitas")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (totalRes.error || todayRes.error || optionsRes.error) {
    throw new Error("Gagal memuat ringkasan audit.");
  }

  const options = optionsRes.data ?? [];
  const aksiOptions = Array.from(
    new Set(options.map((option) => option.aksi)),
  ).sort((a, b) => a.localeCompare(b));
  const entitasOptions = Array.from(
    new Set(options.map((option) => option.entitas)),
  ).sort((a, b) => a.localeCompare(b));
  const stats = {
    total: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    actions: aksiOptions.length,
  };

  let userIds: string[] | null = null;

  if (term) {
    const { data: users, error: userError } = await admin
      .from("pengguna")
      .select("id")
      .or(`nama_lengkap.ilike.%${term}%,username.ilike.%${term}%`)
      .limit(500);

    if (userError) {
      throw new Error("Gagal mencari pengguna pada audit.");
    }

    userIds = (users ?? []).map((user) => user.id);

    if (!userIds.length) {
      return {
        rows: [],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
        aksiOptions,
        entitasOptions,
        stats,
      };
    }
  }

  let query = admin
    .from("log_aktivitas")
    .select(
      "id, aksi, entitas, entitas_id, detail, created_at, pengguna:pengguna_id(id, nama_lengkap, username, peran)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.aksi) {
    query = query.eq("aksi", filters.aksi);
  }

  if (filters.entitas) {
    query = query.eq("entitas", filters.entitas);
  }

  if (userIds) {
    query = query.in("pengguna_id", userIds);
  }

  if (dari) {
    query = query.gte("created_at", dayStart(dari));
  }

  if (sampai) {
    query = query.lte("created_at", dayEnd(sampai));
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Gagal memuat log audit.");
  }

  const total = count ?? 0;

  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      aksi: row.aksi,
      entitas: row.entitas,
      entitasId: row.entitas_id,
      detail: row.detail,
      createdAt: row.created_at,
      pengguna: row.pengguna
        ? {
            id: row.pengguna.id,
            nama: row.pengguna.nama_lengkap,
            username: row.pengguna.username,
            peran: row.pengguna.peran,
          }
        : null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    aksiOptions,
    entitasOptions,
    stats,
  };
}
