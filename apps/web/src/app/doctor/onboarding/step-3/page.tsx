import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText, UserRound } from "lucide-react";

import { SaveStatusToast } from "@/app/_components/save-status-toast";
import { KycDocumentCompactPreview } from "@/components/kyc-document-preview";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { motion } from "@/components/ui/motion";
import { roleEntryPath } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getKycDocumentPreviewUrl } from "@/lib/kyc/preview";
import { loadKycDocumentSummaries } from "@/lib/kyc/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

import { completeDoctorOnboardingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DoctorOnboardingStep3Page() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "doctor") redirect(roleEntryPath(role));
  if (role.status === "approved") redirect("/doctor");
  if (!role.doctorId) redirect("/doctor/status?error=doctor_missing");
  if (role.onboardingStep === "profile" || role.onboardingStep === "documents") redirect(roleEntryPath(role));
  if (role.onboardingStep === "complete" && role.onboardingCompletedAt) redirect("/doctor/status");

  const [documentSummaries, doctorResult] = await Promise.all([
    loadKycDocumentSummaries(role.doctorId),
    createAdminClient()
      .from("doctors")
      .select("full_name,age_years,gender,specialization,phone_number")
      .eq("doctor_id", role.doctorId)
      .single(),
  ]);

  if (doctorResult.error) throw doctorResult.error;
  if (documentSummaries.some((document) => !document.uploaded)) redirect("/doctor/onboarding/step-2");

  const doctor = doctorResult.data;
  const genderLabel =
    copy.doctor.onboarding.genderOptions.find((option) => option.value === doctor.gender)?.label ??
    copy.common.notAvailable;
  const ageAndGender =
    doctor.age_years && genderLabel
      ? `${doctor.age_years} ${copy.doctor.onboarding.ageSuffix} • ${genderLabel}`
      : copy.common.notAvailable;

  return (
    <OnboardingShell
      brand={copy.common.brand}
      steps={copy.doctor.onboarding.steps}
      activeStep={3}
      themeLabels={copy.common.theme}
    >
      <SaveStatusToast messages={copy.common.successToast} />
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="text-3xl font-medium leading-tight tracking-normal text-[var(--color-charcoal-primary)] sm:text-3xl md:text-5xl md:leading-tight">
            {copy.doctor.onboarding.step3.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 tracking-normal text-[var(--color-graphite)]">
            {copy.doctor.onboarding.step3.description}
          </p>
        </div>

        <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6 md:p-12">
          <div className="mb-10 sm:mb-12">
            <div className="mb-6 flex items-center gap-4 border-b border-[var(--color-stone-surface)] pb-2">
              <UserRound size={22} className="text-[var(--color-midnight)]" aria-hidden="true" />
              <h2 className="text-xl font-semibold leading-tight tracking-normal text-[var(--color-charcoal-primary)]">
                {copy.doctor.onboarding.step3.profileTitle}
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <ReviewItem label={copy.doctor.onboarding.fullName} value={doctor.full_name ?? role.fullName} strong />
              <ReviewItem
                label={copy.doctor.onboarding.specialization}
                value={doctor.specialization ?? copy.common.noSpecialization}
                strong
              />
              <ReviewItem label={copy.doctor.onboarding.step3.ageGender} value={ageAndGender} />
              <ReviewItem label={copy.doctor.onboarding.phone} value={doctor.phone_number ?? copy.common.noPhone} />
            </dl>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-4 border-b border-[var(--color-stone-surface)] pb-2">
              <FileText size={22} className="text-[var(--color-midnight)]" aria-hidden="true" />
              <h2 className="text-xl font-semibold leading-tight tracking-normal text-[var(--color-charcoal-primary)]">
                {copy.doctor.onboarding.step3.documentsTitle}
              </h2>
            </div>
            <div className="mx-auto w-full max-w-xl space-y-6">
              {documentSummaries.map((document) => {
                const previewUrl = getKycDocumentPreviewUrl(document);

                return previewUrl ? (
                  <div key={document.documentType} className="space-y-3">
                    <h3 className="text-lg font-medium leading-snug tracking-normal text-[var(--color-charcoal-primary)]">
                      {copy.doctor.onboarding.step2.documentTitles[document.documentType]}
                    </h3>
                    <KycDocumentCompactPreview
                      key={previewUrl}
                      document={document}
                      title={copy.doctor.onboarding.step2.documentTitles[document.documentType]}
                      previewUrl={previewUrl}
                      labels={copy.doctor.onboarding.uploadPreview}
                    />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </section>

        <form action={completeDoctorOnboardingAction} className="mt-10 grid gap-3 sm:mt-12 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/doctor/onboarding/step-2"
            className={cn("inline-flex min-h-11 items-center gap-2 text-sm font-medium leading-6 tracking-normal text-[var(--color-ash)] hover:text-[var(--color-midnight)]", motion.navLink)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {copy.doctor.onboarding.back}
          </Link>
          <PendingSubmitButton
            type="submit"
            className="min-h-12 w-full rounded-full bg-[var(--color-midnight)] px-8 py-[14px] text-base font-medium leading-snug tracking-normal text-[var(--color-inverted)] shadow-[var(--shadow-elevated)] hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)] sm:w-auto sm:px-12 sm:text-lg"
            loadingLabel={copy.marketing.role.submitting}
            slotClassName="w-full sm:w-auto"
          >
            {copy.doctor.onboarding.complete}
          </PendingSubmitButton>
        </form>
      </div>
    </OnboardingShell>
  );
}

function ReviewItem({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase leading-6 tracking-widest text-[var(--color-ash)]">
        {label}
      </dt>
      <dd
        className={
          strong
            ? "break-words text-lg font-medium leading-snug tracking-normal text-[var(--color-charcoal-primary)]"
            : "text-sm leading-6 tracking-normal text-[var(--color-charcoal-primary)]"
        }
      >
        {value}
      </dd>
    </div>
  );
}
