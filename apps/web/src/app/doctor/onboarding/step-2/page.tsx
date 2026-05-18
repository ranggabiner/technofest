import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { OnboardingShell } from "@/components/onboarding-shell";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadKycDocumentSummaries } from "@/lib/kyc/service";

import { DoctorDocumentUploadForm } from "./doctor-document-upload-form";

export const dynamic = "force-dynamic";

export default async function DoctorOnboardingStep2Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "doctor") redirect(roleEntryPath(role));
  if (role.status === "approved") redirect("/doctor");
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");
  if (role.onboardingStep === "profile") redirect("/doctor/onboarding/step-1");
  if (role.onboardingStep === "complete" && role.onboardingCompletedAt) redirect("/doctor/status");

  const documentSummaries = await loadKycDocumentSummaries(role.doctorId);

  return (
    <OnboardingShell
      brand={copy.common.brand}
      steps={copy.doctor.onboarding.steps}
      activeStep={2}
      themeLabels={copy.common.theme}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="text-3xl font-medium leading-tight tracking-normal text-[var(--color-charcoal-primary)] sm:text-3xl md:text-5xl md:leading-tight">
            {copy.doctor.onboarding.step2.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 tracking-normal text-[var(--color-graphite)]">
            {copy.doctor.onboarding.step2.description}
          </p>
        </div>

        <DoctorDocumentUploadForm
          initialDocuments={documentSummaries}
          copy={copy.doctor.onboarding}
        />

        <div className="mt-10 flex items-center justify-between gap-4 sm:mt-12">
          <Link
            href="/doctor/onboarding/step-1"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium leading-6 tracking-normal text-[var(--color-ash)] transition hover:text-[var(--color-midnight)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {copy.doctor.onboarding.back}
          </Link>
        </div>

        <p className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-center text-xs leading-6 tracking-normal text-[var(--color-ash)] sm:mt-12">
          <Lock size={18} aria-hidden="true" />
          <span>{copy.doctor.onboarding.step2.securityNote}</span>
        </p>
      </div>
    </OnboardingShell>
  );
}
