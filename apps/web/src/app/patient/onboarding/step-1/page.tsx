import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import { PatientOnboardingShell } from "../_components/patient-onboarding-shell";
import { savePatientBasicOnboardingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PatientOnboardingStep1Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "patient") redirect(roleEntryPath(role));
  if (role.onboardingStep === "complete" && role.onboardingCompletedAt) redirect("/patient");

  return (
    <PatientOnboardingShell
      steps={copy.patient.onboarding.steps}
      activeStep={1}
      title={copy.patient.onboarding.step1.title}
      description={copy.patient.onboarding.step1.description}
      variant="intro-card"
      themeLabels={copy.common.theme}
    >
      <form action={savePatientBasicOnboardingAction} className="mt-10 space-y-6 sm:mt-20">
        <div className="space-y-6">
          <Field className="md:col-span-2">
            <Label
              htmlFor="full_name"
              className="mb-2 block text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-midnight)]"
            >
              {copy.patient.onboarding.step1.fullName}
            </Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={role.fullName}
              placeholder={copy.patient.onboarding.step1.fullNamePlaceholder}
              className="min-h-12 border-[var(--color-stone-surface)] px-4 text-sm leading-6 placeholder:text-[var(--color-ash)] focus:border-[var(--color-stone-surface)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              required
            />
          </Field>
          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <Label
                htmlFor="age_years"
                className="mb-2 block text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-midnight)]"
              >
                {copy.patient.onboarding.step1.age}
              </Label>
              <div className="relative">
                <Input
                  id="age_years"
                  name="age_years"
                  type="number"
                  min={1}
                  max={120}
                  inputMode="numeric"
                  placeholder={copy.patient.onboarding.step1.agePlaceholder}
                  className="min-h-12 border-[var(--color-stone-surface)] px-4 pr-16 text-sm leading-6 placeholder:text-[var(--color-ash)] focus:border-[var(--color-stone-surface)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs leading-6 text-[var(--color-ash)]">
                  {copy.patient.onboarding.step1.ageSuffix}
                </span>
              </div>
            </Field>
            <Field>
              <Label
                htmlFor="gender"
                className="mb-2 block text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-midnight)]"
              >
                {copy.patient.onboarding.step1.gender}
              </Label>
              <Select
                id="gender"
                name="gender"
                defaultValue=""
                className="min-h-12 border-[var(--color-stone-surface)] px-4 text-sm leading-6 focus:border-[var(--color-stone-surface)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                required
              >
                <option value="" disabled>
                  {copy.patient.onboarding.step1.genderPlaceholder}
                </option>
                {copy.patient.onboarding.step1.genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="flex pt-10 sm:justify-end sm:pt-12">
          <PendingSubmitButton
            type="submit"
            variant="secondary"
            className="min-h-12 w-full px-8 text-base font-medium leading-snug sm:w-auto sm:text-lg"
            loadingLabel={copy.marketing.role.submitting}
            slotClassName="w-full sm:w-auto"
          >
            {copy.patient.onboarding.next}
            <ArrowRight size={20} aria-hidden="true" />
          </PendingSubmitButton>
        </div>
      </form>
    </PatientOnboardingShell>
  );
}
