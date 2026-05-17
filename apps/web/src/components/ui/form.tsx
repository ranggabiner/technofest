import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium text-[var(--color-charcoal-primary)]", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-graphite)] outline-none transition placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
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
        "min-h-11 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-graphite)] outline-none transition focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
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
        "min-h-28 w-full rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 py-3 text-sm text-[var(--color-graphite)] outline-none transition placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-deep)] disabled:bg-[var(--color-stone-surface)] disabled:text-[var(--color-ash)]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}
