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
      exitHref="/doctor/status"
      exitLabel={copy.doctor.onboarding.exit}
      steps={copy.doctor.onboarding.steps}
      activeStep={2}
      themeLabels={copy.common.theme}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[var(--color-charcoal-primary)] md:text-[44px] md:leading-[1.09] md:tracking-[-1.14px]">
            {copy.doctor.onboarding.step2.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.47] tracking-[-0.2px] text-[var(--color-graphite)]">
            {copy.doctor.onboarding.step2.description}
          </p>
        </div>

        <DoctorDocumentUploadForm
          initialDocuments={documentSummaries}
          copy={copy.doctor.onboarding}
        />

        <div className="mt-12 flex items-center justify-between gap-4">
          <Link
            href="/doctor/onboarding/step-1"
            className="inline-flex items-center gap-2 text-[15px] font-medium leading-[1.47] tracking-[-0.2px] text-[var(--color-ash)] transition hover:text-[var(--color-midnight)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {copy.doctor.onboarding.back}
          </Link>
        </div>

        <p className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-2 text-center text-[12px] leading-[1.58] tracking-[-0.14px] text-[var(--color-ash)]">
          <Lock size={18} aria-hidden="true" />
          <span>{copy.doctor.onboarding.step2.securityNote}</span>
        </p>
      </div>
    </OnboardingShell>
  );
}
