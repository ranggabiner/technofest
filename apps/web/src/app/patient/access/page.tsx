import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, History } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import { DoctorAccessClient } from "../_components/doctor-access-client";
import { patientNav } from "../_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ access_error?: string; access_status?: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title={copy.patient.access.shortTitle} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = (await searchParams) ?? {};
  const accessState = await loadPatientAccessState(role);

  return (
    <AppShell title={copy.patient.access.title} nav={patientNav("/patient/access", copy)}>
      <div className="grid gap-5">
        {params.access_error ? (
          <StatusMessage tone="failed" message={params.access_error} />
        ) : null}

        {params.access_status === "granted" || params.access_status === "revoked" ? (
          <StatusMessage
            tone="approved"
            message={
              params.access_status === "granted"
                ? copy.patient.access.granted
                : copy.patient.access.revoked
            }
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{copy.patient.access.cardTitle}</CardTitle>
            <CardDescription>
              {copy.patient.access.cardDescription}
            </CardDescription>
          </CardHeader>
          <DoctorAccessClient state={accessState} locale={locale} copy={copy} />
        </Card>

        <Button asChild variant="ghost" className="w-fit">
          <Link href="/patient/access-history">
            <History size={16} />
            {copy.patient.access.openHistory}
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}

function StatusMessage({ tone, message }: { tone: "approved" | "failed"; message: string }) {
  const isFailed = tone === "failed";

  return (
    <div className={`flex items-start gap-3 rounded-[10px] border p-4 text-sm ${
      isFailed
        ? "border-[var(--color-error-red)] bg-[var(--color-error-surface)] text-[var(--color-error-red)]"
        : "border-[var(--color-teal-primary)] bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]"
    }`}
    >
      {isFailed ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {message}
    </div>
  );
}
