import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Activity, ArrowRight, Home, Smile } from "lucide-react";

import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import { PatientOnboardingShell } from "../_components/patient-onboarding-shell";
import { savePatientHealthOnboardingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PatientOnboardingStep2Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "patient") redirect(roleEntryPath(role));
  if (role.onboardingStep === "basic") redirect("/patient/onboarding/step-1");
  if (role.onboardingStep === "complete" && role.onboardingCompletedAt) redirect("/patient");

  return (
    <PatientOnboardingShell
      steps={copy.patient.onboarding.steps}
      activeStep={2}
      title={copy.patient.onboarding.step2.title}
      description={copy.patient.onboarding.step2.description}
      variant="form-card"
      themeLabels={copy.common.theme}
    >
      <form action={savePatientHealthOnboardingAction} className="space-y-10 sm:space-y-12">
        <PatientOnboardingSection
          icon={<Activity size={20} aria-hidden="true" />}
          title={copy.patient.onboarding.step2.activitySectionTitle}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <PatientLabel htmlFor="activity_level">{copy.patient.onboarding.step2.activityLevel}</PatientLabel>
              <Select
                id="activity_level"
                name="activity_level"
                defaultValue=""
                className={fieldControlClassName}
                required
              >
                <option value="" disabled>
                  {copy.patient.onboarding.step2.activityPlaceholder}
                </option>
                {copy.patient.onboarding.step2.activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <PatientLabel htmlFor="sleep_hours">{copy.patient.onboarding.step2.sleepHours}</PatientLabel>
              <Input
                id="sleep_hours"
                name="sleep_hours"
                type="number"
                min={0}
                max={24}
                step={0.5}
                inputMode="decimal"
                placeholder={copy.patient.onboarding.step2.sleepPlaceholder}
                required
                className={fieldControlClassName}
              />
            </Field>
          </div>
        </PatientOnboardingSection>

        <PatientOnboardingSection
          icon={<Smile size={20} aria-hidden="true" />}
          title={copy.patient.onboarding.step2.feelingSectionTitle}
        >
          <Field>
            <PatientLabel>{copy.patient.onboarding.step2.currentFeeling}</PatientLabel>
            <div className="flex flex-wrap gap-2">
              {copy.patient.onboarding.step2.feelingOptions.map((option, index) => (
                <label key={option.value} className="relative cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="current_feeling"
                    value={option.value}
                    defaultChecked={index === 0}
                    required
                  />
                  <span className="flex min-h-11 items-center justify-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 text-sm text-[var(--color-graphite)] transition-colors peer-checked:border-[var(--color-midnight)] peer-checked:bg-[var(--color-stone-surface)] peer-checked:text-[var(--color-midnight)]">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </PatientOnboardingSection>

        <PatientOnboardingSection
          icon={<Home size={20} aria-hidden="true" />}
          title={copy.patient.onboarding.step2.environmentSectionTitle}
        >
          <div className="space-y-6">
            <Field>
              <PatientLabel htmlFor="living_environment">{copy.patient.onboarding.step2.livingEnvironment}</PatientLabel>
              <Input
                id="living_environment"
                name="living_environment"
                placeholder={copy.patient.onboarding.step2.livingEnvironmentPlaceholder}
                className={fieldControlClassName}
              />
            </Field>
            <Field>
              <PatientLabel htmlFor="allergies">{copy.patient.onboarding.step2.allergies}</PatientLabel>
              <Textarea
                id="allergies"
                name="allergies"
                placeholder={copy.patient.onboarding.step2.allergiesPlaceholder}
                className="min-h-28 resize-none border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 py-2 text-sm leading-6 placeholder:text-[var(--color-ash)] focus:border-[var(--color-stone-surface)] hover:ring-1 hover:ring-inset hover:ring-[var(--color-stone-surface)]"
              />
            </Field>
          </div>
        </PatientOnboardingSection>

        <div className="grid gap-3 border-t border-[var(--color-stone-surface)] pt-6 sm:flex sm:items-center sm:justify-between">
          <Link
            href="/patient/onboarding/step-1"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm leading-6 text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-warm-canvas)] hover:text-[var(--color-midnight)]"
          >
            {copy.patient.onboarding.back}
          </Link>
          <PendingSubmitButton
            type="submit"
            variant="secondary"
            className="w-full px-4 text-sm font-medium leading-6 sm:w-auto"
            loadingLabel={copy.marketing.role.submitting}
            slotClassName="w-full sm:w-auto"
          >
            {copy.patient.onboarding.step2.confirmNext}
            <ArrowRight size={16} aria-hidden="true" />
          </PendingSubmitButton>
        </div>
      </form>
    </PatientOnboardingShell>
  );
}

const fieldControlClassName =
  "min-h-11 border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 py-2 text-sm leading-6 placeholder:text-[var(--color-ash)] focus:border-[var(--color-stone-surface)] hover:ring-1 hover:ring-inset hover:ring-[var(--color-stone-surface)]";

function PatientOnboardingSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b border-[var(--color-stone-surface)] pb-2">
        <span className="text-[var(--color-ash)]">{icon}</span>
        <h2 className="text-xl font-semibold leading-tight text-[var(--color-charcoal-primary)] sm:text-xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PatientLabel({ className, ...props }: ComponentPropsWithoutRef<typeof Label>) {
  return (
    <Label
      className={[
        "mb-2 block text-xs font-semibold leading-6 tracking-widest text-[var(--color-charcoal-primary)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
