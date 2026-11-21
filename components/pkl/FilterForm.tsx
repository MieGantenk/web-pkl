"use client";

import { useEffect, useRef } from "react";

export function FilterForm({
  action,
  className,
  children,
}: {
  action?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function submit() {
    clearTimer();

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    formRef.current?.requestSubmit();
  }

  function onChange(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      submit();
      return;
    }

    if (
      target instanceof HTMLInputElement &&
      (target.type === "date" ||
        target.type === "search" ||
        target.type === "text")
    ) {
      if (target.type === "date") {
        submit();
        return;
      }

      clearTimer();
      timerRef.current = window.setTimeout(submit, 500);
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      onChange={onChange}
      onSubmit={clearTimer}
      className={className}
    >
      {children}
    </form>
  );
}
