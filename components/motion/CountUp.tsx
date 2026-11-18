"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

export function CountUp({
  value,
  storageKey,
}: {
  value: number;
  storageKey: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const key = `pkl-count-${storageKey}`;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduce) {
      node.textContent = value.toLocaleString("id-ID");
      return;
    }

    try {
      if (sessionStorage.getItem(key)) {
        node.textContent = value.toLocaleString("id-ID");
        return;
      }
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage bisa diblokir; animasi tetap aman.
    }

    node.textContent = "0";
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("id-ID");
      },
    });

    return () => controls.stop();
  }, [key, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("id-ID")}
    </span>
  );
}
