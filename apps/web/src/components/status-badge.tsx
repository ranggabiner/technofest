import { cn } from "@/lib/utils";

const toneClasses = {
  pending: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)]",
  approved: "bg-[var(--color-success-surface)] text-[var(--color-success-text)]",
  rejected: "bg-[var(--color-error-surface)] text-[var(--color-error-red)]",
  failed: "bg-[var(--color-error-surface)] text-[var(--color-error-red)]",
  neutral: "bg-[var(--color-stone-surface)] text-[var(--color-graphite)]",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", toneClasses[tone])}>
      {children}
    </span>
  );
}
