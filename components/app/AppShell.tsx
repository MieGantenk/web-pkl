import type { ReactNode } from "react";

import type { Profile } from "@/lib/profile";

import { BottomNav } from "./BottomNav";
import { NavigationLoadingOverlay } from "./NavigationLoadingOverlay";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md"
      >
        Lewati ke konten
      </a>

      <Sidebar role={profile.peran} profile={profile} />

      <div className="flex min-h-dvh flex-col">
        <Topbar role={profile.peran} profile={profile} />
        <main
          id="main"
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-8 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
        <BottomNav role={profile.peran} />
      </div>

      <NavigationLoadingOverlay />
    </div>
  );
}
