import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorStatusPage() {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title={copy.doctor.status.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (role.status === "approved") redirect("/doctor");
  const onboardingPath = roleOnboardingPath(role);
  if (onboardingPath) redirect(onboardingPath);

  return (
    <AppShell
      title={copy.doctor.status.title}
      nav={[
        { href: "/doctor/status", label: copy.doctor.nav.status },
        { href: "/doctor/onboarding/step-1", label: copy.doctor.nav.kyc },
      ]}
    >
      <Card>
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
      </Card>
    </AppShell>
  );
}
