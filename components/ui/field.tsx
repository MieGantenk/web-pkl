import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium leading-[18px] text-ink"
      >
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 text-xs leading-4 text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${htmlFor}-hint`}
          className="mt-1.5 text-xs leading-4 text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
