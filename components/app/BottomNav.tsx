"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavActive } from "@/lib/nav-utils";
import { bottomNavigation, type Role } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = bottomNavigation[role];

  if (!items?.length) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href, role);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-[var(--m-fast)]",
                  active ? "text-brand-700" : "text-muted hover:text-ink-soft",
                )}
              >
                <item.icon
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>{item.label}</span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    active ? "bg-brand-500" : "bg-transparent",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
