"use client";

import Image from "next/image";
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
  const showTabNotch = scope === "desktop";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="flex items-center gap-2">
          <Link
            href={roleHome[role]}
            onClick={onNavigate}
            className="group relative flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-sidebar-accent/45 bg-gradient-to-br from-sidebar-accent/[0.2] via-white/[0.04] to-transparent p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors duration-[var(--m-fast)] hover:border-sidebar-accent/70"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-sidebar-accent/80 to-transparent"
            />

            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm ring-1 ring-sidebar-accent/70">
              <Image
                src="/brand/smk-logo.jpg"
                alt=""
                width={80}
                height={80}
                className="size-full rounded-full object-cover"
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[14px] font-semibold leading-[18px] tracking-[-0.01em] text-sidebar-text">
                SMK-IT As-Syifa
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <span
                  className="h-px w-3.5 shrink-0 bg-sidebar-accent"
                  aria-hidden
                />
                <span className="truncate text-[9px] font-semibold uppercase leading-none tracking-[0.17em] text-sidebar-muted">
                  Sistem PKL
                </span>
              </span>
            </span>
          </Link>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sidebar-muted transition-colors duration-[var(--m-fast)] hover:border-sidebar-accent/40 hover:bg-white/[0.1] hover:text-sidebar-text"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          aria-hidden
          className="mx-2 mt-4 h-px bg-gradient-to-r from-transparent via-sidebar-line to-transparent"
        />

        <nav
          aria-label="Navigasi utama"
          className="-mx-3 mt-4 flex-1 overflow-y-auto"
        >
          <p className="flex items-center gap-2 px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            <span
              className="size-1 rounded-full bg-sidebar-accent"
              aria-hidden
            />
            {roleLabels[role]}
          </p>

          <ul className="space-y-1 pb-3">
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
                        "group flex h-11 w-full items-center gap-3 rounded-l-lg pl-5 pr-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                        hasActiveChild
                          ? "bg-white/[0.05] text-sidebar-text"
                          : "text-sidebar-muted hover:bg-white/[0.05] hover:text-sidebar-text",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-[var(--m-fast)]",
                          hasActiveChild
                            ? "border-sidebar-accent/20 bg-sidebar-accent/10 text-sidebar-accent"
                            : "border-white/[0.06] bg-white/[0.04] text-sidebar-muted group-hover:border-white/10 group-hover:bg-white/[0.08] group-hover:text-sidebar-text",
                        )}
                      >
                        <item.icon
                          className="size-[18px]"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                      <span>{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 text-sidebar-muted transition-transform duration-[var(--m-fast)]",
                          groupOpen && "rotate-180",
                        )}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>

                    <ul
                      id={groupId}
                      hidden={!groupOpen}
                      className="ml-[30px] mt-1 space-y-0.5 border-l border-sidebar-line/80 pb-1 pl-3"
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
                                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors duration-[var(--m-fast)]",
                                childActive
                                  ? "bg-white/[0.07] text-sidebar-text"
                                  : "text-sidebar-muted hover:bg-white/[0.05] hover:text-sidebar-text",
                              )}
                            >
                              <child.icon
                                className={cn(
                                  "size-4 shrink-0",
                                  childActive
                                    ? "text-sidebar-accent"
                                    : "text-sidebar-muted",
                                )}
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              <span className="truncate">{child.label}</span>
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
                      "group relative flex h-11 w-full items-center gap-3 rounded-l-lg pl-5 pr-3 text-sm font-medium transition-colors duration-[var(--m-fast)]",
                      active
                        ? "z-10 text-ink"
                        : "text-sidebar-muted hover:bg-white/[0.05] hover:text-sidebar-text",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId={`nav-active-${scope}-0`}
                        className="absolute inset-0 rounded-l-lg bg-canvas"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : {
                                duration: 0.24,
                                ease: [0.2, 0.8, 0.2, 1],
                              }
                        }
                      >
                        {showTabNotch ? (
                          <>
                            <span
                              aria-hidden
                              className="absolute -top-4 right-0 size-4 rounded-tl-full bg-canvas"
                            />
                            <span
                              aria-hidden
                              className="absolute -bottom-4 right-0 size-4 rounded-bl-full bg-canvas"
                            />
                          </>
                        ) : null}
                      </motion.span>
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-[var(--m-fast)]",
                        active
                          ? "border-transparent bg-transparent text-brand-600"
                          : "border-white/[0.06] bg-white/[0.04] text-sidebar-muted group-hover:border-white/10 group-hover:bg-white/[0.08] group-hover:text-sidebar-text",
                      )}
                    >
                      <item.icon
                        className="size-[18px]"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-accent to-sidebar-accent-strong p-px shadow-sm">
              <span className="flex size-full items-center justify-center rounded-full bg-sidebar text-[12px] font-semibold text-sidebar-accent">
                {initial}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-sidebar-text">
                {profile.nama_lengkap}
              </p>
              <p className="truncate text-[11px] leading-4 text-sidebar-muted">
                {roleLabels[role]}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex h-9 w-full items-center gap-2 rounded-md px-2 text-[12px] font-medium text-sidebar-muted transition-colors duration-[var(--m-fast)] hover:bg-white/[0.05] hover:text-sidebar-text"
            >
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
