import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { OnboardingShell } from "@/components/onboarding-shell";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { saveDoctorProfileStepAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DoctorOnboardingStep1Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "doctor") redirect(roleEntryPath(role));
  if (role.status === "approved") redirect("/doctor");
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctors")
    .select("full_name,age_years,gender,specialization,phone_number")
    .eq("doctor_id", role.doctorId)
    .single();

  if (error) throw error;

  return (
    <OnboardingShell
      brand={copy.common.brand}
      steps={copy.doctor.onboarding.steps}
      activeStep={1}
      themeLabels={copy.common.theme}
    >
      <section className="mx-auto w-full max-w-2xl rounded-xl bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-8">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-xl font-semibold leading-tight tracking-normal text-[var(--color-charcoal-primary)]">
            {copy.doctor.onboarding.step1.cardTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 tracking-normal text-[var(--color-ash)]">
            {copy.doctor.onboarding.step1.cardDescription}
          </p>
        </div>

        <form action={saveDoctorProfileStepAction} className="space-y-6">
          <Field className="md:col-span-2">
            <Label htmlFor="full_name" className={doctorOnboardingLabelClass}>
              {copy.doctor.onboarding.fullName}
            </Label>
            <Input
              id="full_name"
              name="full_name"
              className={doctorOnboardingControlClass}
              defaultValue={data.full_name ?? role.fullName}
              placeholder={copy.doctor.onboarding.fullNamePlaceholder}
              required
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <Label htmlFor="age_years" className={doctorOnboardingLabelClass}>
                {copy.doctor.onboarding.age}
              </Label>
              <Input
                id="age_years"
                name="age_years"
                type="number"
                min={18}
                max={120}
                inputMode="numeric"
                className={doctorOnboardingControlClass}
                defaultValue={data.age_years ?? ""}
                placeholder={copy.doctor.onboarding.agePlaceholder}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="gender" className={doctorOnboardingLabelClass}>
                {copy.doctor.onboarding.gender}
              </Label>
              <Select
                id="gender"
                name="gender"
                className={doctorOnboardingControlClass}
                defaultValue={data.gender ?? ""}
                required
              >
                <option value="" disabled>
                  {copy.doctor.onboarding.genderPlaceholder}
                </option>
                {copy.doctor.onboarding.genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <Label htmlFor="specialization" className={doctorOnboardingLabelClass}>
              {copy.doctor.onboarding.specialization}
            </Label>
            <Select
              id="specialization"
              name="specialization"
              className={doctorOnboardingControlClass}
              defaultValue={data.specialization ?? ""}
              required
            >
              <option value="" disabled>
                {copy.doctor.onboarding.specializationPlaceholder}
              </option>
              {copy.doctor.onboarding.specializationOptions.map((option) => (
                <option key={option.value} value={option.label}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="phone_number" className={doctorOnboardingLabelClass}>
              {copy.doctor.onboarding.phone}
            </Label>
            <div className="flex gap-2">
              <span className="flex min-h-11 items-center rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 text-sm leading-6 tracking-normal text-[var(--color-ash)]">
                +62
              </span>
              <Input
                id="phone_number"
                name="phone_number"
                className={doctorOnboardingControlClass}
                defaultValue={data.phone_number ?? ""}
                placeholder={copy.doctor.onboarding.phonePlaceholder}
                required
              />
            </div>
          </Field>

          <div className="mt-10 flex border-t border-[var(--color-stone-surface)] pt-6 sm:mt-12 sm:justify-end">
            <PendingSubmitButton
              type="submit"
              className="min-h-11 w-full rounded-full bg-[var(--color-midnight)] px-4 py-0 text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)] sm:w-auto"
              loadingLabel={copy.marketing.role.submitting}
              slotClassName="w-full sm:w-auto"
            >
              {copy.doctor.onboarding.next}
              <ArrowRight size={18} aria-hidden="true" />
            </PendingSubmitButton>
          </div>
        </form>
      </section>
    </OnboardingShell>
  );
}

const doctorOnboardingLabelClass =
  "mb-2 block text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-charcoal-primary)]";

const doctorOnboardingControlClass =
  "min-h-11 border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 py-2 text-sm leading-6 tracking-normal placeholder:text-[var(--color-ash)] focus:border-[var(--color-stone-surface)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]";
