import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const typography = {
  pageEyebrow: "text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]",
  pageTitle: "text-3xl font-semibold leading-tight tracking-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl",
  pageDescription: "max-w-2xl text-base leading-7 text-[var(--color-ash)]",
  sectionTitle: "text-2xl font-semibold leading-tight tracking-tight text-[var(--color-midnight)]",
  cardTitle: "text-xl font-semibold leading-tight tracking-tight text-[var(--color-midnight)]",
  itemTitle: "text-base font-semibold leading-snug tracking-tight text-[var(--color-midnight)]",
  body: "text-sm leading-6 text-[var(--color-graphite)]",
  bodyLarge: "text-base leading-7 text-[var(--color-graphite)]",
  muted: "text-sm leading-6 text-[var(--color-ash)]",
  caption: "text-xs leading-5 text-[var(--color-ash)]",
  label: "text-sm font-medium leading-5 text-[var(--color-charcoal-primary)]",
  overline: "text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]",
  nav: "text-sm font-medium leading-5 text-[var(--color-graphite)]",
  button: "text-sm font-semibold leading-tight tracking-tight",
  displayTitle:
    "text-4xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] sm:text-5xl md:text-6xl",
  displaySectionTitle:
    "text-3xl font-semibold leading-tight tracking-tight text-[var(--color-charcoal-primary)] md:text-5xl",
  displayDescription: "text-base leading-7 text-[var(--color-graphite)]",
  monoCode: "font-mono text-sm leading-6 tracking-normal",
} as const;

type HeaderProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: HeaderProps) {
  return (
    <header className={cn("border-b border-[var(--color-stone-surface)] pb-5", className)} {...props}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className={cn("mb-2", typography.pageEyebrow)}>{eyebrow}</p> : null}
          <h1 className={typography.pageTitle}>{title}</h1>
          {description ? <p className={cn("mt-3", typography.pageDescription)}>{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function SectionHeader({
  actions,
  className,
  description,
  title,
  ...props
}: Omit<HeaderProps, "eyebrow">) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)} {...props}>
      <div className="min-w-0">
        <h2 className={typography.sectionTitle}>{title}</h2>
        {description ? <p className={cn("mt-2", typography.muted)}>{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
