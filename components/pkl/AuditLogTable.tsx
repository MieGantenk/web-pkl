"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { KeyRound, X } from "lucide-react";

import { AccountPasswordPanel } from "@/components/pkl/AccountPasswordPanel";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import {
  getAuditActionMeta,
  getAuditDetailLabel,
  getAuditEntityLabel,
  isPasswordAuditAction,
} from "@/lib/audit";
import type { AuditRow } from "@/lib/data/admin-audit";
import { roleLabels, type Role } from "@/lib/navigation";
import type { Json } from "@/types/database";

const CLOSE_MS = 200;
const sensitiveDetailPattern = /(password|sandi|token|secret)/i;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function detailEntries(detail: Json | null) {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return [];
  }

  return Object.entries(detail);
}

function isSensitiveDetailKey(key: string) {
  return sensitiveDetailPattern.test(key);
}

function roleLabel(value: string | null | undefined) {
  return value
    ? (roleLabels[value as Role] ?? value)
    : "Sistem";
}

export function AuditLogTable({
  rows,
  total,
}: {
  rows: AuditRow[];
  total: number;
}) {
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const selectedMeta = selected ? getAuditActionMeta(selected.aksi) : null;
  const selectedEntries = selected ? detailEntries(selected.detail) : [];
  const passwordAction = selected ? isPasswordAuditAction(selected.aksi) : false;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !selected) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openDetail(row: AuditRow) {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    dialogRef.current?.removeAttribute("data-closing");
    setSelected(row);
  }

  function closeDetail() {
    const dialog = dialogRef.current;

    if (!dialog || !selected || dialog.getAttribute("data-closing") === "true") {
      return;
    }

    if (reduce) {
      dialog.close();
      setSelected(null);
      return;
    }

    dialog.setAttribute("data-closing", "true");
    closeTimerRef.current = window.setTimeout(() => {
      dialog.close();
      dialog.removeAttribute("data-closing");
      closeTimerRef.current = null;
      setSelected(null);
    }, CLOSE_MS);
  }

  function handleClose() {
    document.body.style.overflow = "";
    setSelected(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-ink">
            Log aktivitas
          </h2>
          <span className="text-[13px] text-muted tabular-nums">
            {rows.length} dari {total}
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Waktu
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Pengguna
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Aksi
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Entitas
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const meta = getAuditActionMeta(row.aksi);
                const actorRole = roleLabel(row.pengguna?.peran);

                return (
                  <tr key={row.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-ink-soft">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {row.pengguna ? (
                        <>
                          <p className="font-medium text-ink">
                            {row.pengguna.nama}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-4 text-muted">
                            @{row.pengguna.username} · {actorRole}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-ink">Sistem</p>
                          <p className="mt-0.5 text-[12px] leading-4 text-muted">
                            Aksi otomatis
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={meta.label}
                        tone={meta.tone}
                        icon={meta.icon}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.entitas === "pengguna" && row.target ? (
                        <>
                          <p className="font-medium text-ink">
                            {row.target.nama}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-4 text-muted">
                            @{row.target.username} ·{" "}
                            {roleLabel(row.target.peran)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-ink">
                            {getAuditEntityLabel(row.entitas)}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted">
                            {row.entitasId
                              ? `${row.entitasId.slice(0, 8)}…`
                              : "—"}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        aria-haspopup="dialog"
                        className="inline-flex h-8 items-center text-[12px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                      >
                        Lihat detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-border lg:hidden">
          {rows.map((row) => {
            const meta = getAuditActionMeta(row.aksi);
            const actorRole = roleLabel(row.pengguna?.peran);

            return (
              <li key={row.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {row.pengguna?.nama ?? "Sistem"}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-4 text-muted">
                      {row.pengguna
                        ? `@${row.pengguna.username} · ${actorRole}`
                        : "Aksi otomatis"}
                    </p>
                  </div>
                  <StatusBadge
                    label={meta.label}
                    tone={meta.tone}
                    icon={meta.icon}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                  <span>{formatDateTime(row.createdAt)}</span>
                  <span className="font-medium text-ink-soft">
                    {row.entitas === "pengguna" && row.target
                      ? `Pengguna · ${row.target.nama}`
                      : `${getAuditEntityLabel(row.entitas)}${
                          row.entitasId
                            ? ` · ${row.entitasId.slice(0, 8)}…`
                            : ""
                        }`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openDetail(row)}
                  aria-haspopup="dialog"
                  className="mt-3 inline-flex h-8 items-center text-[12px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
                >
                  Lihat detail
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Detail log audit"
        className="app-detail-drawer"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDetail();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeDetail();
        }}
        onClose={handleClose}
      >
        {selected && selectedMeta ? (
          <div className="flex h-full flex-col border-l border-border bg-surface shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">Detail log</p>
                <div className="mt-1.5">
                  <StatusBadge
                    label={selectedMeta.label}
                    tone={selectedMeta.tone}
                    icon={selectedMeta.icon}
                  />
                </div>
                <p className="mt-1.5 text-[13px] leading-[18px] text-muted">
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDetail}
                aria-label="Tutup detail"
                className="flex size-9 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
              >
                <X className="size-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-5">
                <section aria-labelledby="audit-summary-title">
                  <h2
                    id="audit-summary-title"
                    className="text-sm font-semibold text-ink"
                  >
                    Ringkasan
                  </h2>

                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                        Pelaku
                      </dt>
                      <dd className="mt-1 text-[13px] leading-5 text-ink">
                        {selected.pengguna ? (
                          <>
                            <span className="font-medium">
                              {selected.pengguna.nama}
                            </span>
                            <span className="block text-[12px] text-muted">
                              @{selected.pengguna.username} ·{" "}
                              {roleLabel(selected.pengguna.peran)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">Sistem</span>
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                        Waktu
                      </dt>
                      <dd className="mt-1 text-[13px] leading-5 text-ink">
                        {formatDateTime(selected.createdAt)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                        Entitas
                      </dt>
                      <dd className="mt-1 text-[13px] leading-5 text-ink">
                        {getAuditEntityLabel(selected.entitas)}
                        <span className="mt-0.5 block break-all font-mono text-[11px] text-muted">
                          {selected.entitasId ?? "—"}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                        Akun target
                      </dt>
                      <dd className="mt-1 text-[13px] leading-5 text-ink">
                        {selected.target ? (
                          <>
                            <span className="font-medium">
                              {selected.target.nama}
                            </span>
                            <span className="block text-[12px] text-muted">
                              @{selected.target.username} ·{" "}
                              {roleLabel(selected.target.peran)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">
                            Tidak ada akun target
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section
                  aria-labelledby="audit-technical-title"
                  className="border-t border-border pt-4"
                >
                  <h2
                    id="audit-technical-title"
                    className="text-sm font-semibold text-ink"
                  >
                    Detail teknis
                  </h2>

                  {selectedEntries.length ? (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selectedEntries.map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-sm border border-border bg-surface-muted px-3 py-2"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                            {getAuditDetailLabel(key)}
                          </dt>
                          <dd className="mt-1 break-words text-[13px] leading-5 text-ink-soft">
                            {isSensitiveDetailKey(key)
                              ? "Tidak ditampilkan (data sensitif)"
                              : displayValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 text-[13px] leading-5 text-muted">
                      Log ini tidak menyimpan detail tambahan.
                    </p>
                  )}
                </section>

                {passwordAction ? (
                  <section
                    aria-labelledby="audit-password-title"
                    className="border-t border-border pt-4"
                  >
                    <div className="rounded-sm border border-info-border bg-info-bg px-3 py-3 text-[13px] leading-5 text-info">
                      <div className="flex gap-2">
                        <KeyRound
                          className="mt-0.5 size-4 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <div>
                          <p
                            id="audit-password-title"
                            className="font-semibold"
                          >
                            Kata sandi tidak dapat ditampilkan
                          </p>
                          <p className="mt-1">
                            Supabase Auth menyimpan kata sandi sebagai hash.
                            Kata sandi lama dan baru tidak dapat dibaca,
                            termasuk oleh admin. Gunakan panel di bawah untuk
                            membuat kata sandi baru.
                          </p>
                        </div>
                      </div>
                    </div>

                    {selected.target ? (
                      <div className="mt-4">
                        <AccountPasswordPanel
                          penggunaId={selected.target.id}
                          nama={selected.target.nama}
                          username={selected.target.username}
                          allowDelete={false}
                        />
                      </div>
                    ) : (
                      <p className="mt-4 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-[13px] leading-[18px] text-warning">
                        Akun target tidak ditemukan. Kata sandi tidak dapat
                        direset dari log ini.
                      </p>
                    )}
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
