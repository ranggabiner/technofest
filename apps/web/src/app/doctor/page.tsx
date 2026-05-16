import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleEntryPath } from "@/lib/auth/roles";
import { loadDoctorDashboardState } from "@/lib/doctor-records/service";
import { formatDateTime } from "@/lib/i18n/format";
import { localizedScopeList, proofLabel, proofStatusMessages, proofTone } from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title={copy.doctor.dashboard.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (!role.canAccessDoctorFeatures || !role.doctorId) redirect(roleEntryPath(role));

  const state = await loadDoctorDashboardState(role);
  const qrData = state.doctor.qr_code_token
    ? await QRCode.toDataURL(`medproof://doctor/${state.doctor.qr_code_token}`)
    : null;

  return (
    <AppShell title={copy.doctor.dashboard.title} nav={[{ href: "/doctor", label: copy.doctor.nav.dashboard }]}>
      <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.doctor.dashboard.qrTitle}</CardTitle>
            <CardDescription>{copy.doctor.dashboard.qrDescription}</CardDescription>
          </CardHeader>
          {qrData ? (
            <Image
              src={qrData}
              alt={copy.doctor.dashboard.qrAlt}
              width={192}
              height={192}
              unoptimized
              className="size-48"
            />
          ) : null}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{state.doctor.full_name}</CardTitle>
            <CardDescription>{state.doctor.specialization ?? copy.common.noSpecialization}</CardDescription>
          </CardHeader>
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-5">
            <p className="text-sm text-[var(--color-ash)]">{copy.doctor.dashboard.accessCode}</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-normal text-[var(--color-midnight)]">
              {state.doctor.doctor_access_code}
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{copy.doctor.dashboard.activePatientsTitle}</CardTitle>
          <CardDescription>
            {copy.doctor.dashboard.activePatientsDescription}
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3">
          {state.activeGrants.length > 0 ? (
            state.activeGrants.map((grant) => (
              <div
                key={grant.grantId}
                className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--color-midnight)]">
                      {grant.patientName}
                    </h3>
                    <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                      {copy.common.proofPrefix} {proofLabel(copy, grant.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ash)]">
                    {grant.patientEmail} · {copy.common.until} {formatDateTime(grant.expiresAt, locale)}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-charcoal-primary)]">
                    <Clock size={15} />
                    {localizedScopeList(copy, grant.scopes).join(", ")}
                  </p>
                  <div className="mt-3">
                    <ProofStatus
                      proofType="access_grant"
                      id={grant.grantId}
                      blockchainStatus={grant.blockchainStatus}
                      txHash={grant.blockchainTxHash}
                      messages={proofStatusMessages(copy)}
                    />
                  </div>
                </div>
                <Button asChild className="self-start rounded-[10px]">
                  <Link href={`/doctor/grants/${grant.grantId}`}>
                    <FileText size={16} />
                    {copy.doctor.dashboard.openData}
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
              {copy.doctor.dashboard.noActivePatients}
            </p>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
