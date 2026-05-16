import * as React from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
