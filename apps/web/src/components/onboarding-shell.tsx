import { Check } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

import {
  getOnboardingProgressItems,
  type OnboardingProgressItem,
} from "./onboarding-progress";

export async function OnboardingShell({
  steps,
  activeStep,
  children,
  footer,
}: {
  brand: string;
  steps: readonly string[];
  activeStep: number;
  themeLabels: {
    light: string;
    dark: string;
    switchToLight: string;
    switchToDark: string;
  };
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader
        authMode="authenticated"
        isAuthenticated
        position="sticky"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-1 flex-col px-4 py-16 sm:px-6 sm:py-20">
        <OnboardingProgress steps={steps} activeStep={activeStep} />
        {children}
      </main>

      {footer}
      <SiteFooter />
    </div>
  );
}

function OnboardingProgress({
  steps,
  activeStep,
}: {
  steps: readonly string[];
  activeStep: number;
}) {
  const items = getOnboardingProgressItems(steps, activeStep);

  return (
    <ol className="mx-auto mb-12 flex w-full max-w-2xl items-start justify-center sm:mb-28">
      {items.map((item, index) => (
        <li key={item.label} className="contents">
          <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 bg-[var(--color-warm-canvas)] px-1 sm:min-w-16 sm:px-2">
            <StepCircle item={item} />
            <span
              className={cn(
                "text-center text-xs font-semibold uppercase leading-6 tracking-widest sm:text-xs",
                item.status === "active" ? "text-[var(--color-midnight)]" : "text-[var(--color-ash)]",
              )}
            >
              {item.label}
            </span>
          </div>
          {index < items.length - 1 ? (
            <div
              className={cn(
                "mt-5 h-0.5 min-w-6 flex-1 sm:min-w-12",
                items[index + 1]?.status === "complete"
                  ? "bg-[var(--color-valid-green)]"
                  : "bg-[var(--color-stone-surface)]",
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function StepCircle({ item }: { item: OnboardingProgressItem }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-base font-semibold leading-snug sm:size-10 sm:text-lg",
        item.status === "complete" && "bg-[var(--color-valid-green)] text-[var(--color-inverted)]",
        item.status === "active" && "bg-[var(--color-midnight)] text-[var(--color-inverted)]",
        item.status === "upcoming" && "bg-[var(--color-stone-surface)] text-[var(--color-ash)]",
      )}
    >
      {item.status === "complete" ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : item.number}
    </span>
  );
}
