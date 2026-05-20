import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileText, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardCard, PortalForbiddenLayout, PortalLayout } from "@/app/_components/portal-layout";
import { ProfileAvatar } from "@/app/_components/profile-avatar";
import {
  DoctorStatusDesktopNavigation,
  DoctorStatusMobileNavigation,
} from "@/app/doctor/_components/doctor-navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";
import { formatFileSize, getFileTypeLabel } from "@/lib/kyc/preview";
import { requiredKycDocumentTypes } from "@/lib/kyc/types";
import { loadDoctorProfileState } from "@/lib/profile/service";

export const dynamic = "force-dynamic";

const doctorStatusNavigationTargets = [] as const;

export default async function DoctorStatusPage() {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return <PortalForbiddenLayout title={copy.doctor.status.title} role={role} />;
  }
  if (role.status === "approved") redirect("/doctor");
  const onboardingPath = roleOnboardingPath(role);
  if (onboardingPath && onboardingPath !== "/doctor/status") redirect(onboardingPath);

  const profileState = role.doctorId ? await loadDoctorProfileState(role) : null;
  const doctor = profileState?.doctor;
  const documentRows =
    profileState?.documents ??
    requiredKycDocumentTypes.map((documentType) => ({
      documentType,
      documentId: null,
      fileId: null,
      filename: null,
      mimeType: null,
      fileSizeBytes: null,
      uploaded: false,
    }));
  const doctorName = doctor?.full_name ?? role.fullName;
  const doctorEmail = doctor?.email ?? role.email;
  const statusLabel =
    role.status === "pending" ? copy.doctor.status.pendingBadge : copy.doctor.status.rejectedBadge;
  const statusTitle =
    role.status === "pending" ? copy.doctor.status.pendingTitle : copy.doctor.status.rejectedTitle;
  const statusDescription =
    role.status === "pending"
      ? copy.doctor.status.pendingDescription
      : role.rejectionReason ?? copy.doctor.status.noRejectionReason;

  return (
    <PortalLayout
      copy={copy}
      desktopNavigation={<DoctorStatusDesktopNavigation copy={copy} />}
      mobileNavigation={<DoctorStatusMobileNavigation copy={copy} />}
      navigationTargets={doctorStatusNavigationTargets}
      profileHref="/doctor/onboarding/step-1"
      profileLabel={copy.doctor.status.updateKyc}
      role="doctor"
      sectionLabel={copy.doctor.dashboard.sidebarSection}
      showProfileAction={false}
      title={copy.doctor.status.title}
      userAvatarUrl={role.avatarUrl}
      userEmail={doctorEmail}
      userName={doctorName}
    >
      <section className="grid gap-8" data-doctor-status-page="review">
        <header className="border-b border-[var(--color-stone-surface)] pb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
            {copy.doctor.dashboard.sidebarSection}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
            {copy.doctor.status.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
            {copy.doctor.onboarding.step3.cardDescription}
          </p>
        </header>

        <DashboardCard className="p-6 md:p-8" data-doctor-status-review-card>
          <CardHeader className="mb-0">
            <div className="mb-2">
              <StatusBadge tone={role.status}>{statusLabel}</StatusBadge>
            </div>
            <CardTitle>{statusTitle}</CardTitle>
            <CardDescription>{statusDescription}</CardDescription>
          </CardHeader>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/doctor/onboarding/step-1">{copy.doctor.status.updateKyc}</Link>
            </Button>
          </div>
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard className="p-6 md:p-8" data-doctor-status-profile>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <ProfileAvatar src={role.avatarUrl} name={doctorName} fallback="D" className="size-16 text-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
                      <UserRound size={15} aria-hidden="true" />
                      {copy.profile.doctor.profileCardTitle}
                    </p>
                    <h2 className="break-words text-2xl font-semibold leading-tight text-[var(--color-midnight)]">
                      {doctorName}
                    </h2>
                    <p className="mt-1 break-all text-sm leading-6 text-[var(--color-ash)]">
                      {doctorEmail}
                    </p>
                  </div>
                  <StatusBadge tone={role.status}>{statusLabel}</StatusBadge>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ProfileDetail label={copy.profile.doctor.specialization}>
                    {displayValue(doctor?.specialization, copy.profile.doctor.emptyValue)}
                  </ProfileDetail>
                  <ProfileDetail label={copy.profile.doctor.phoneNumber}>
                    {displayValue(doctor?.phone_number, copy.profile.doctor.emptyValue)}
                  </ProfileDetail>
                  <ProfileDetail label={copy.doctor.onboarding.age}>
                    {doctor?.age_years ? `${doctor.age_years} ${copy.doctor.onboarding.ageSuffix}` : copy.profile.doctor.emptyValue}
                  </ProfileDetail>
                  <ProfileDetail label={copy.doctor.onboarding.gender}>
                    {genderLabel(doctor?.gender, copy)}
                  </ProfileDetail>
                </dl>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="p-6 md:p-8" data-doctor-status-documents>
            <CardHeader>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
                <FileText size={15} aria-hidden="true" />
                {copy.doctor.onboarding.step3.documentsTitle}
              </p>
              <CardTitle>{copy.doctor.onboarding.step2.cardTitle}</CardTitle>
              <CardDescription>{copy.doctor.onboarding.step2.cardDescription}</CardDescription>
            </CardHeader>
            <ul className="grid gap-3">
              {documentRows.map((document) => (
                <li
                  key={document.documentType}
                  className="flex items-start gap-3 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-parchment-card)] p-4"
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-card)] text-[var(--color-teal-deep)]">
                    {document.uploaded ? (
                      <CheckCircle2 size={18} aria-hidden="true" />
                    ) : (
                      <Clock3 size={18} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="break-words font-semibold text-[var(--color-midnight)]">
                        {copy.doctor.onboarding.step2.documentTitles[document.documentType]}
                      </h3>
                      <StatusBadge tone={document.uploaded ? "approved" : "pending"}>
                        {document.uploaded
                          ? copy.doctor.onboarding.step3.uploaded
                          : copy.doctor.onboarding.step3.missing}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 break-words text-sm leading-6 text-[var(--color-ash)]">
                      {document.uploaded
                        ? document.filename ?? copy.doctor.onboarding.step3.filenameFallbacks[document.documentType]
                        : copy.profile.doctor.noDocument}
                    </p>
                    {document.uploaded ? (
                      <p className="text-xs leading-5 text-[var(--color-ash)]">
                        {getFileTypeLabel(document.mimeType, document.filename)} - {formatFileSize(document.fileSizeBytes)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </section>
    </PortalLayout>
  );
}

function ProfileDetail({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium leading-6 text-[var(--color-midnight)]">
        {children}
      </dd>
    </div>
  );
}

function displayValue(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function genderLabel(
  value: string | null | undefined,
  copy: Awaited<ReturnType<typeof getDictionary>>,
) {
  const gender = value?.trim();
  if (!gender) return copy.profile.doctor.emptyValue;
  return (
    copy.doctor.onboarding.genderOptions.find((option) => option.value === gender)?.label ??
    copy.profile.doctor.emptyValue
  );
}
