import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { motion } from "@/components/ui/motion";
import { typography } from "@/components/ui/typography";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-teal-primary)] text-[var(--color-inverted)] hover:bg-[var(--color-teal-deep)]",
  secondary:
    "bg-[var(--color-midnight)] text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]",
  ghost:
    "bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-parchment-card)]",
  destructive:
    "border border-[var(--color-error-red)] text-[var(--color-error-red)] hover:bg-[var(--color-error-surface)]",
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
        "inline-flex min-h-11 max-w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 text-center disabled:cursor-not-allowed disabled:opacity-50",
        motion.button,
        typography.button,
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
