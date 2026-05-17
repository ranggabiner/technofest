import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardCard, PortalForbiddenLayout } from "@/app/_components/portal-layout";
import { SharedHeader } from "@/components/shared-header";
import { SiteFooterContent } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorStatusPage() {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return <PortalForbiddenLayout title={copy.doctor.status.title} role={role} />;
  }
  if (role.status === "approved") redirect("/doctor");
  const onboardingPath = roleOnboardingPath(role);
  if (onboardingPath) redirect(onboardingPath);

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <SharedHeader
        authMode="authenticated"
        contextTitle={copy.doctor.status.title}
        isAuthenticated
        maxWidth="none"
        position="fixed"
        className="shadow-none"
      />
      <main className="mx-auto min-h-screen max-w-[860px] px-6 pb-[120px] pt-[100px]">
        <DashboardCard className="p-6 md:p-8">
          <CardHeader>
            <div className="mb-2">
              <StatusBadge tone={role.status}>
                {role.status === "pending" ? copy.doctor.status.pendingBadge : copy.doctor.status.rejectedBadge}
              </StatusBadge>
            </div>
            <CardTitle>
              {role.status === "pending" ? copy.doctor.status.pendingTitle : copy.doctor.status.rejectedTitle}
            </CardTitle>
            <CardDescription>
              {role.status === "pending"
                ? copy.doctor.status.pendingDescription
                : role.rejectionReason ?? copy.doctor.status.noRejectionReason}
            </CardDescription>
          </CardHeader>
          <Button asChild variant="secondary">
            <Link href="/doctor/onboarding/step-1">{copy.doctor.status.updateKyc}</Link>
          </Button>
        </DashboardCard>
      </main>
      <SiteFooterContent copy={copy} />
    </div>
  );
}
