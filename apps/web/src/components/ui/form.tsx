import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";
import { motion } from "@/components/ui/motion";
import { typography } from "@/components/ui/typography";

export function Label({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(typography.label, className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 outline-none placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
        motion.input,
        typography.body,
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 outline-none focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
        motion.input,
        typography.body,
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 py-3 outline-none placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
        motion.input,
        typography.body,
        className,
      )}
      {...props}
    />
  );
}

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}
