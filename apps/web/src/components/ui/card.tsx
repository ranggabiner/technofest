import * as React from "react";

import { cn } from "@/lib/utils";
import { motion } from "@/components/ui/motion";
import { typography } from "@/components/ui/typography";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-[10px] bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)]",
        motion.card,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 space-y-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(typography.cardTitle, className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(typography.muted, className)} {...props} />;
}
