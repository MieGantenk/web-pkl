"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { getPageTitle } from "@/lib/nav-utils";
import { roleLabels, type Role } from "@/lib/navigation";
import type { Profile } from "@/lib/profile";

import { SidebarContent } from "./SidebarContent";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({
  role,
  profile,
}: {
  role: Role;
  profile: Profile;
}) {
  const pathname = usePathname();
  const title = getPageTitle(role, pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const initial =
    profile.nama_lengkap.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }

    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6 md:h-16 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-soft transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink lg:hidden"
        >
          <Menu className="size-5" strokeWidth={1.75} aria-hidden />
        </button>

        <div className="hidden items-center gap-2 text-[13px] leading-[18px] lg:flex">
          <span className="text-muted">Sistem PKL</span>
          <span className="text-border-strong" aria-hidden>
            /
          </span>
          <span className="font-medium text-ink">{title}</span>
        </div>

        <p className="truncate text-sm font-semibold text-ink lg:hidden">
          {title}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {initial}
          </span>
          <div className="hidden text-right sm:block">
            <p className="max-w-[180px] truncate text-[13px] font-medium leading-[18px] text-ink">
              {profile.nama_lengkap}
            </p>
            <p className="text-[12px] leading-4 text-muted">
              {roleLabels[role]}
            </p>
          </div>
        </div>
      </div>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-label="Menu navigasi"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setOpen(false);
          }
        }}
        className="app-drawer fixed inset-y-0 left-0 m-0 h-dvh w-[280px] max-w-[85vw] border-0 bg-sidebar p-0 text-sidebar-text"
      >
        <SidebarContent
          role={role}
          profile={profile}
          scope="mobile"
          onNavigate={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </dialog>
    </header>
  );
}
