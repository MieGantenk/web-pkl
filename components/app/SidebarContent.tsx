"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useReducedMotion, motion } from "motion/react";
import { ChevronDown, LogOut, X } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { isNavActive } from "@/lib/nav-utils";
import {
  navigation,
  roleHome,
  roleLabels,
  type Role,
} from "@/lib/navigation";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function SidebarContent({
  role,
  profile,
  scope,
  onNavigate,
  onClose,
}: {
  role: Role;
  profile: Profile;
  scope: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const activeGroup =
    navigation[role].find((item) =>
      item.children?.some((child) => isNavActive(pathname, child.href, role)),
    )?.href ?? null;
  const visibleGroup = openGroup ?? activeGroup;
  const initial =
    profile.nama_lengkap.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="flex items-center justify-between gap-3 px-2">
        <Link
          href={roleHome[role]}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-sm"
        >
          <span
            className="h-9 w-[3px] rounded-full bg-gold-400"
            aria-hidden
          />
          <span>
            <span className="block font-display text-[15px] font-semibold leading-tight tracking-[-0.01em] text-sidebar-text">
              SMK-IT As-Syifa
            </span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
              Sistem PKL
            </span>
          </span>
        </Link>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-sm text-sidebar-muted transition-colors duration-[var(--m-fast)] hover:bg-sidebar-hover hover:text-sidebar-text"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      <nav aria-label="Navigasi utama" className="mt-6 flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
          {roleLabels[role]}
        </p>

        <ul className="space-y-1">
          {navigation[role].map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const hasActiveChild =
              item.children?.some((child) =>
                isNavActive(pathname, child.href, role),
              ) ?? false;
            const active =
              !hasChildren && isNavActive(pathname, item.href, role);
            const groupOpen = hasChildren && visibleGroup === item.href;
            const groupId = `nav-group-${item.href.replaceAll("/", "-")}`;

            if (hasChildren) {
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroup((current) =>
                        current === item.href ? null : item.href,
                      )
                    }
                    aria-expanded={groupOpen}
                    aria-controls={groupId}
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                      hasActiveChild
                        ? "text-sidebar-text"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text",
                    )}
                  >
                    <item.icon
                      className="size-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto size-4 transition-transform duration-[var(--m-fast)]",
                        groupOpen && "rotate-180",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>

                  <ul
                    id={groupId}
                    hidden={!groupOpen}
                    className="ml-5 mt-1 space-y-1 border-l border-sidebar-line pl-3"
                  >
                    {item.children?.map((child) => {
                        const childActive = isNavActive(
                          pathname,
                          child.href,
                          role,
                        );

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              prefetch={false}
                              onClick={onNavigate}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "relative flex h-10 items-center gap-2.5 rounded-sm px-3 text-[13px] font-medium transition-colors duration-[var(--m-fast)]",
                                childActive
                                  ? "bg-sidebar-active text-white"
                                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text",
                              )}
                            >
                              {childActive ? (
                                <span
                                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gold-400"
                                  aria-hidden
                                />
                              ) : null}
                              <child.icon
                                className="size-4"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                    })}
                  </ul>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                    active
                      ? "text-white"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text",
                  )}
                >
                  {active ? (
                    <>
                      <motion.span
                        layoutId={`nav-active-${scope}-0`}
                        className="absolute inset-0 rounded-sm bg-sidebar-active"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : {
                                duration: 0.24,
                                ease: [0.2, 0.8, 0.2, 1],
                              }
                        }
                      />
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold-400"
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <item.icon
                    className="relative z-10 size-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 rounded-md border border-sidebar-line bg-sidebar-hover p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-text">
              {profile.nama_lengkap}
            </p>
            <p className="truncate text-[12px] leading-4 text-sidebar-muted">
              {roleLabels[role]}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-3 flex h-11 w-full items-center gap-2 rounded-sm px-2 text-[13px] font-medium text-sidebar-muted transition-colors duration-[var(--m-fast)] hover:bg-sidebar-active hover:text-sidebar-text"
          >
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
