import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-[background-color,border-color,color,transform] duration-[var(--m-fast)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-px motion-safe:active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "border border-border-strong bg-surface text-ink hover:border-brand-700 hover:bg-brand-50",
        ghost:
          "border border-transparent bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink",
        danger:
          "border border-transparent bg-danger text-white hover:bg-danger/90",
        link: "border border-transparent bg-transparent text-primary underline-offset-4 hover:text-brand-700 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-[15px] leading-5",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
