"use client";

import { motion, useReducedMotion } from "motion/react";

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MutabaahRing({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const reduce = useReducedMotion();
  const progress = total > 0 ? Math.min(value / total, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="relative size-[72px] shrink-0"
      role="img"
      aria-label={`${value} dari ${total} hari terisi`}
    >
      <svg
        viewBox="0 0 72 72"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke="var(--color-brand-100)"
          strokeWidth="8"
        />
        <motion.circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={reduce ? false : { strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }
          }
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold tabular-nums text-ink">
        {value}
        <span className="text-[13px] font-medium text-muted">/{total}</span>
      </span>
    </div>
  );
}
