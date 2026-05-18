import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, Bot, CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";

import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import { PatientOnboardingShell } from "../_components/patient-onboarding-shell";
import { completePatientOnboardingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PatientOnboardingStep3Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "patient") redirect(roleEntryPath(role));
  if (role.onboardingStep === "basic" || role.onboardingStep === "health") redirect(roleEntryPath(role));
  if (role.onboardingStep === "complete" && role.onboardingCompletedAt) redirect("/patient");

  return (
    <PatientOnboardingShell
      steps={copy.patient.onboarding.steps}
      activeStep={3}
      title={copy.patient.onboarding.step3.title}
      description={copy.patient.onboarding.step3.description}
      variant="form-card"
      themeLabels={copy.common.theme}
    >
      <form action={completePatientOnboardingAction} className="space-y-10 sm:space-y-12">
        <PatientOnboardingSection icon={<Bot size={20} aria-hidden="true" />} title={copy.patient.onboarding.step3.cardTitle}>
          <p className="text-sm leading-6 text-[var(--color-graphite)]">
            {copy.patient.onboarding.step3.cardDescription}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <CompletionLine icon={<LockKeyhole size={18} />} label={copy.patient.onboarding.step3.encryptedProfile} />
            <CompletionLine icon={<CheckCircle2 size={18} />} label={copy.patient.onboarding.step3.aiConsent} />
          </div>
        </PatientOnboardingSection>

        <PatientOnboardingSection icon={<ShieldAlert size={20} aria-hidden="true" />} title={copy.patient.onboarding.step3.safetyTitle}>
          <div className="rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4 text-sm leading-6 text-[var(--color-graphite)]">
            {copy.patient.onboarding.step3.warning}
          </div>
        </PatientOnboardingSection>

        <div className="grid gap-3 border-t border-[var(--color-stone-surface)] pt-6 sm:flex sm:items-center sm:justify-between">
          <Link
            href="/patient/onboarding/step-2"
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
            {copy.patient.onboarding.complete}
            <ArrowRight size={16} aria-hidden="true" />
          </PendingSubmitButton>
        </div>
      </form>
    </PatientOnboardingShell>
  );
}

function CompletionLine({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4 text-sm font-semibold text-[var(--color-midnight)]">
      <span className="text-[var(--color-ash)]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

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
