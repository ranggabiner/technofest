import { Check } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
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

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-20">
        <OnboardingProgress steps={steps} activeStep={activeStep} />
        {children}
      </main>

      {footer}
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
    <ol className="mx-auto mb-28 flex w-full max-w-2xl items-start justify-center">
      {items.map((item, index) => (
        <li key={item.label} className="contents">
          <div className="relative z-10 flex min-w-16 flex-col items-center gap-2 bg-[var(--color-warm-canvas)] px-2">
            <StepCircle item={item} />
            <span
              className={cn(
                "text-center text-[12px] font-semibold uppercase leading-[1.58] tracking-[0.5px]",
                item.status === "active" ? "text-[var(--color-midnight)]" : "text-[var(--color-ash)]",
              )}
            >
              {item.label}
            </span>
          </div>
          {index < items.length - 1 ? (
            <div
              className={cn(
                "mt-5 h-0.5 min-w-12 flex-1",
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
        "flex size-10 items-center justify-center rounded-full text-[19px] font-semibold leading-[1.38]",
        item.status === "complete" && "bg-[var(--color-valid-green)] text-[var(--color-inverted)]",
        item.status === "active" && "bg-[var(--color-midnight)] text-[var(--color-inverted)]",
        item.status === "upcoming" && "bg-[var(--color-stone-surface)] text-[var(--color-ash)]",
      )}
    >
      {item.status === "complete" ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : item.number}
    </span>
  );
}
