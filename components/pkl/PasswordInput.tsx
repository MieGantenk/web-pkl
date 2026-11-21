"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { generateSecurePassword } from "@/lib/password";

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  autoComplete = "new-password",
  showGenerate = true,
  showCopy = true,
  onGenerate,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  showGenerate?: boolean;
  showCopy?: boolean;
  onGenerate?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) {
        window.clearTimeout(timeout.current);
      }
    };
  }, []);

  function handleGenerate() {
    const next = generateSecurePassword(16);
    onChange(next);
    onGenerate?.(next);
    setVisible(true);
    setGenerated(true);
    setCopied(false);
  }

  async function handleCopy() {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (timeout.current) {
        window.clearTimeout(timeout.current);
      }

      timeout.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const describedBy = error
    ? `${id}-error`
    : generated
      ? `${id}-generated`
      : hint
        ? `${id}-hint`
        : undefined;

  return (
    <div>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="block text-[13px] font-medium leading-[18px] text-ink"
        >
          {label} {required ? <span className="text-danger">*</span> : null}
        </label>

        {showGenerate ? (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-1 text-xs font-semibold text-brand-700 underline-offset-4 transition-colors duration-[var(--m-fast)] hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
          >
            <RefreshCw className="size-3.5" strokeWidth={1.75} aria-hidden />
            Buat otomatis
          </button>
        ) : null}
      </div>

      <div className="relative mt-1.5">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setGenerated(false);
            setCopied(false);
          }}
          autoComplete={autoComplete}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={showCopy && value ? "pr-28" : "pr-14"}
        />

        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            className="inline-flex size-11 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
          >
            {visible ? (
              <EyeOff className="size-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye className="size-4" strokeWidth={1.75} aria-hidden />
            )}
          </button>

          {showCopy && value ? (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Kata sandi tersalin" : "Salin kata sandi"}
              className="inline-flex size-11 items-center justify-center rounded-sm text-muted transition-colors duration-[var(--m-fast)] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-100"
            >
              {copied ? (
                <Check
                  className="size-4 text-success"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : (
                <Copy className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? "Kata sandi tersalin." : ""}
        </span>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs leading-4 text-danger"
        >
          {error}
        </p>
      ) : generated ? (
        <p
          id={`${id}-generated`}
          aria-live="polite"
          className="mt-1.5 text-xs leading-4 text-success"
        >
          Kata sandi aman dibuat. Salin sebelum menyimpan.
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-4 text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
