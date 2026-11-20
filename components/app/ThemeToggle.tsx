"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const [switching, setSwitching] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      document.documentElement.classList.remove("theme-transition");
    };
  }, []);

  function toggleTheme() {
    if (switching) {
      return;
    }

    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";

    setSwitching(true);
    root.classList.add("theme-transition");

    // Paksa browser menghitung style lama dulu agar transisi warna berjalan.
    void root.offsetHeight;
    setTheme(nextTheme);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      setSwitching(false);
    }, 380);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Ganti tema terang atau gelap"
      aria-busy={switching || undefined}
      title="Ganti tema"
      disabled={switching}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-ink-soft transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink disabled:cursor-wait disabled:opacity-90",
        className,
      )}
    >
      <span
        className="relative flex size-5 items-center justify-center"
        aria-hidden
      >
        <Moon
          className="theme-toggle-icon absolute size-5 rotate-0 opacity-100 transition-[opacity,transform] duration-300 ease-[var(--ease-out)] dark:rotate-90 dark:opacity-0"
          strokeWidth={1.75}
        />
        <Sun
          className="theme-toggle-icon absolute size-5 rotate-90 opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-out)] dark:rotate-0 dark:opacity-100"
          strokeWidth={1.75}
        />
      </span>
    </button>
  );
}
