import { Check } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

import { getPatientOnboardingProgressItems } from "./patient-onboarding-progress";

type PatientOnboardingShellVariant = "intro-card" | "form-card";
type ThemeLabels = {
  light: string;
  dark: string;
  switchToLight: string;
  switchToDark: string;
};

export async function PatientOnboardingShell({
  steps,
  activeStep,
  title,
  description,
  variant,
  children,
}: {
  steps: readonly string[];
  activeStep: number;
  title: string;
  description: string;
  variant: PatientOnboardingShellVariant;
  themeLabels: ThemeLabels;
  children: React.ReactNode;
}) {
  if (variant === "intro-card") {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
        <SharedHeader authMode="authenticated" isAuthenticated position="sticky" />
        <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-20">
          <section className="w-full max-w-2xl rounded-xl bg-[var(--color-card)] p-8 shadow-[var(--shadow-subtle)] md:p-12">
            <PatientOnboardingProgress steps={steps} activeStep={activeStep} variant="compact" />
            <PatientOnboardingHeading title={title} description={description} />
            {children}
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="authenticated" isAuthenticated position="sticky" />
      <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-20 md:py-24">
        <div className="mx-auto w-full max-w-[720px]">
          <header className="mb-20 text-center">
            <PatientOnboardingProgress steps={steps} activeStep={activeStep} variant="bar" />
            <PatientOnboardingHeading title={title} description={description} />
          </header>
          <section className="relative overflow-hidden rounded-xl bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)] transition md:p-12">
            <div className="absolute left-0 top-0 h-1 w-full bg-[var(--color-stone-surface)]" />
            {children}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PatientOnboardingHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <h1 className="mx-auto max-w-[560px] font-serif text-[32px] font-medium leading-[1.15] text-[var(--color-charcoal-primary)] md:text-[44px] md:leading-[1.09]">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.47] text-[var(--color-graphite)]">
        {description}
      </p>
    </div>
  );
}

function PatientOnboardingProgress({
  steps,
  activeStep,
  variant,
}: {
  steps: readonly string[];
  activeStep: number;
  variant: "compact" | "bar";
}) {
  const items = getPatientOnboardingProgressItems(steps, activeStep);

  if (variant === "bar") {
    return (
      <ol className="relative mb-12 flex items-start justify-between before:absolute before:left-0 before:top-4 before:z-0 before:h-px before:w-full before:bg-[var(--color-stone-surface)]">
        {items.map((item) => (
          <li key={item.label} className="relative z-10 flex min-w-16 flex-col items-center gap-2">
            <StepCircle item={item} ring={item.status === "active"} />
            <StepLabel item={item} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="mb-20 flex items-start justify-center gap-3 px-2 sm:gap-4 sm:px-4">
      {items.map((item, index) => (
        <li key={item.label} className="contents">
          <div className="flex min-w-14 flex-col items-center gap-2">
            <StepCircle item={item} />
            <StepLabel item={item} />
          </div>
          {index < items.length - 1 ? (
            <div className="mt-4 h-px w-8 shrink bg-[var(--color-stone-surface)] sm:w-12" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function StepCircle({
  item,
  ring = false,
}: {
  item: ReturnType<typeof getPatientOnboardingProgressItems>[number];
  ring?: boolean;
}) {
  const isCurrentOrComplete = item.status === "active" || item.status === "complete";

  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
        isCurrentOrComplete
          ? "bg-[var(--color-midnight)] text-[var(--color-inverted)]"
          : "bg-[var(--color-stone-surface)] text-[var(--color-ash)]",
        ring && "ring-4 ring-[var(--color-warm-canvas)]",
      )}
    >
      {item.status === "complete" ? <Check size={15} strokeWidth={2.25} aria-hidden="true" /> : item.number}
    </span>
  );
}

function StepLabel({
  item,
}: {
  item: ReturnType<typeof getPatientOnboardingProgressItems>[number];
}) {
  return (
    <span
      className={cn(
        "text-center text-[10px] font-semibold uppercase leading-[1.58] tracking-[0.5px]",
        item.status === "active" ? "text-[var(--color-midnight)]" : "text-[var(--color-ash)]",
      )}
    >
      {item.label}
    </span>
  );
}
