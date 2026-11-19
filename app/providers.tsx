"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="bottom-right"
        theme="light"
        closeButton
        duration={4000}
        visibleToasts={3}
        toastOptions={{
          classNames: {
            toast:
              "rounded-md border border-border bg-surface text-ink shadow-md",
            title: "text-sm font-semibold",
            description: "text-[13px] text-muted",
            actionButton: "bg-primary text-white",
            cancelButton: "bg-surface-muted text-ink-soft",
          },
        }}
      />
    </MotionConfig>
  );
}
