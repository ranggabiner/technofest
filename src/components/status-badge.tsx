import { cn } from "@/lib/utils";

const toneClasses = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal-50 text-teal-700",
  rejected: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
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
