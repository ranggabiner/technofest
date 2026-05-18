import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function DashboardCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] sm:p-6 lg:p-8",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
