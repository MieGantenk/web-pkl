"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  HeartHandshake,
  ScrollText,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifikasi";
import type { NotifikasiData, NotifikasiItem } from "@/lib/data/notifikasi";
import { cn } from "@/lib/utils";

function NotificationIcon({ tautan }: { tautan: string | null }) {
  const className = "size-4";
  const props = { className, strokeWidth: 1.75, "aria-hidden": true } as const;

  if (tautan?.includes("verifikasi") || tautan?.includes("jurnal")) {
    return <BookOpen {...props} />;
  }

  if (tautan?.includes("mutabaah")) {
    return <HeartHandshake {...props} />;
  }

  if (tautan?.includes("surat")) {
    return <ScrollText {...props} />;
  }

  if (tautan?.includes("penempatan")) {
    return <Building2 {...props} />;
  }

  if (tautan?.includes("pengajuan")) {
    return <ClipboardCheck {...props} />;
  }

  return <Bell {...props} />;
}

export function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifikasiData>({
    items: [],
    unreadCount: 0,
  });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifikasi", {
        cache: "no-store",
      });

      if (response.ok) {
        setData((await response.json()) as NotifikasiData);
      }
    } catch {
      // Biarkan data terakhir tetap tampil.
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 45_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function markRead(item: NotifikasiItem) {
    if (item.dibaca) return;

    setData((current) => ({
      items: current.items.map((entry) =>
        entry.id === item.id ? { ...entry, dibaca: true } : entry,
      ),
      unreadCount: Math.max(0, current.unreadCount - 1),
    }));
    void markNotificationReadAction(item.id);
  }

  function openItem(item: NotifikasiItem) {
    markRead(item);
    setOpen(false);

    if (item.tautan) {
      router.push(item.tautan);
    }
  }

  async function markAll() {
    setData((current) => ({
      items: current.items.map((item) => ({ ...item, dibaca: true })),
      unreadCount: 0,
    }));

    const result = await markAllNotificationsReadAction();

    if (!result.ok) {
      toast.error(result.message);
      void load();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          data.unreadCount
            ? `Notifikasi, ${data.unreadCount} belum dibaca`
            : "Notifikasi"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-ink-soft transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink"
      >
        <Bell className="size-5" strokeWidth={1.75} aria-hidden />
        {data.unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold leading-none text-white">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Daftar notifikasi"
          className="fixed right-4 top-[64px] z-40 w-[calc(100vw-32px)] max-w-[360px] overflow-hidden rounded-md border border-border bg-surface shadow-md sm:absolute sm:right-0 sm:top-[calc(100%+8px)] sm:w-[360px]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Notifikasi</p>
              <p className="mt-0.5 text-[12px] leading-4 text-muted">
                {data.unreadCount
                  ? `${data.unreadCount} belum dibaca`
                  : "Semua sudah dibaca"}
              </p>
            </div>
            {data.unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAll()}
                className="text-[12px] font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
              >
                Tandai semua
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(420px,60vh)] overflow-y-auto">
            {data.items.length ? (
              <ul className="divide-y divide-border">
                {data.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-[var(--m-fast)] hover:bg-surface-muted",
                        !item.dibaca && "bg-brand-50/60",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-700">
                        <NotificationIcon tautan={item.tautan} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-5 text-ink">
                            {item.judul}
                          </span>
                          {!item.dibaca ? (
                            <span
                              className="mt-1 size-2 shrink-0 rounded-full bg-brand-600"
                              aria-label="Belum dibaca"
                            />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-ink-soft">
                          {item.pesan}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-muted">
                          {formatDistanceToNow(parseISO(item.created_at), {
                            addSuffix: true,
                            locale: localeId,
                          })}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Belum ada notifikasi.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
