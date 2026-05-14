import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-teal-primary)] text-[var(--color-midnight)] hover:bg-[var(--color-teal-deep)] hover:text-white",
  secondary: "bg-[var(--color-midnight)] text-white hover:bg-[var(--color-charcoal-primary)]",
  ghost:
    "bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-fog)]",
  destructive:
    "border border-[var(--color-error-red)] text-[var(--color-error-red)] hover:bg-red-50",
};

export function Button({
  asChild,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
