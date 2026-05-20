import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  className,
  icon = true,
  message,
}: {
  className?: string;
  icon?: boolean;
  message: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]", className)}>
      {icon ? <CircleDashed size={16} className="shrink-0" /> : null}
      {message}
    </div>
  );
}

export function InlineStatusMessage({
  className,
  icon = true,
  message,
  tone,
}: {
  className?: string;
  icon?: boolean;
  message: string;
  tone: "success" | "danger";
}) {
  const isDanger = tone === "danger";
  const Icon = isDanger ? AlertTriangle : CheckCircle2;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[10px] border p-4 text-sm",
        isDanger
          ? "border-[var(--color-error-red)] bg-[var(--color-error-surface)] text-[var(--color-error-red)]"
          : "border-[var(--color-teal-primary)] bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]",
        className,
      )}
    >
      {icon ? <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
      {message}
    </div>
  );
}
