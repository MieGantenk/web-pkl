"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";

import { AppToaster } from "@/components/app/AppToaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="pkl-theme"
    >
      <MotionConfig reducedMotion="user">
        {children}
        <AppToaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
