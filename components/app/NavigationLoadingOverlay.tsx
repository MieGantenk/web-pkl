"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { PageSkeleton } from "@/components/app/PageSkeleton";

type NavigationState = {
  from: string;
  to: string;
  show: boolean;
};

function variantForPath(pathname: string) {
  if (pathname === "/admin") {
    return "dashboard" as const;
  }

  if (
    pathname.startsWith("/admin/pengajuan") ||
    pathname.startsWith("/admin/jurnal") ||
    pathname.startsWith("/siswa/jurnal")
  ) {
    return "split" as const;
  }

  if (
    pathname.startsWith("/admin/pengaturan") ||
    pathname.startsWith("/siswa/pengajuan")
  ) {
    return "form" as const;
  }

  if (
    pathname.startsWith("/ortu/jurnal") ||
    pathname.startsWith("/ortu/surat")
  ) {
    return "cards" as const;
  }

  return "table" as const;
}

function hasTabs(pathname: string) {
  return (
    pathname === "/admin/surat" ||
    pathname.startsWith("/admin/surat/")
  );
}

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState<NavigationState | null>(
    null,
  );
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimers();
  }, [pathname, clearTimers]);

  useEffect(() => {
    function reset() {
      setNavigation(null);
      clearTimers();
    }

    function onClick(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;

      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      ) {
        return;
      }

      clearTimers();
      const from = window.location.pathname;
      setNavigation({ from, to: url.pathname, show: false });

      showTimerRef.current = window.setTimeout(() => {
        setNavigation((current) =>
          current && current.from === from
            ? { ...current, show: true }
            : current,
        );
        hideTimerRef.current = window.setTimeout(() => {
          setNavigation(null);
        }, 8000);
      }, 120);
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", reset);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", reset);
      clearTimers();
    };
  }, [clearTimers]);

  const visible =
    navigation?.show === true && navigation.from === pathname;

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-busy="true"
      className="fixed inset-x-0 bottom-16 top-16 z-40 overflow-y-auto bg-canvas px-4 py-6 sm:px-6 md:bottom-0 md:py-8 lg:left-[264px] lg:px-8 lg:pb-10"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <PageSkeleton
          variant={variantForPath(navigation.to)}
          tabs={hasTabs(navigation.to)}
        />
      </div>
    </div>
  );
}
