import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Clock, History, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofStatus } from "@/components/proof-status";
import { EmptyState, ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPatientAccessState } from "@/lib/access/doctor-access";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";
import { formatDateTime, fillTemplate } from "@/lib/i18n/format";
import {
  localizedScopeList,
  patientAccessActionLabel,
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
  statusLabel,
  statusTone,
} from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { loadPatientDashboardState } from "@/lib/patient/dashboard";

import { patientNav } from "./_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title={copy.patient.dashboard.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const [journalState, accessState, dashboardState] = await Promise.all([
    loadPatientJournalState(role),
    loadPatientAccessState(role),
    loadPatientDashboardState(role),
  ]);
  const latestHistory = accessState.history.slice(0, 3);

  return (
    <AppShell title={copy.patient.dashboard.title} nav={patientNav("/patient", copy)}>
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{fillTemplate(copy.patient.dashboard.greeting, { name: role.fullName })}</CardTitle>
            <CardDescription>
              {copy.patient.dashboard.description}
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-3 rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)] sm:grid-cols-3">
              <StatusLine icon={<LockKeyhole size={16} />} label={copy.patient.dashboard.statusJournalLabel} value={copy.patient.dashboard.statusJournalValue} />
              <StatusLine
                icon={<KeyRound size={16} />}
                label={copy.patient.dashboard.activeAccessLabel}
                value={`${accessState.activeGrants.length} ${copy.common.grant}`}
              />
              <StatusLine
                icon={<ShieldCheck size={16} />}
                label={copy.patient.dashboard.proofPendingLabel}
                value={`${dashboardState.proofCounts.pending} ${copy.common.item}`}
              />
            </div>
            <Button asChild>
              <Link href="/patient/chat">
                <Bot size={16} />
                {copy.patient.dashboard.openAiJournal}
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{copy.patient.dashboard.scope1Title}</CardTitle>
              <CardDescription>{copy.patient.dashboard.scope1Description}</CardDescription>
            </CardHeader>
            <div className="grid gap-3">
              {dashboardState.recentScope1Records.length > 0 ? (
                dashboardState.recentScope1Records.map((record) => (
                  <div key={record.recordId} className="grid gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">{recordTypeLabel(copy, record.recordType)}</StatusBadge>
                      <StatusBadge tone={proofTone(record.blockchainStatus)}>
                        {copy.common.proofPrefix} {proofLabel(copy, record.blockchainStatus)}
                      </StatusBadge>
                    </div>
                    <p className="font-semibold text-[var(--color-midnight)]">{record.title}</p>
                    <p className="text-xs text-[var(--color-ash)]">{formatDateTime(record.createdAt, locale)}</p>
                    <ProofStatus
                      proofType="scope1_record"
                      id={record.recordId}
                      blockchainStatus={record.blockchainStatus}
                      txHash={record.blockchainTxHash}
                      messages={proofStatusMessages(copy)}
                    />
                  </div>
                ))
              ) : (
                <EmptyState message={copy.patient.dashboard.noScope1} />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.patient.dashboard.scope2Title}</CardTitle>
              <CardDescription>{copy.patient.dashboard.scope2Description}</CardDescription>
            </CardHeader>
            {journalState.latestSummary ? (
              <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
                {journalState.latestSummary}
              </p>
            ) : (
              <EmptyState message={journalState.consentAccepted ? copy.patient.dashboard.noSummary : copy.patient.dashboard.aiConsentMissing} />
            )}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <StatusBadge tone={accessState.activeGrants.length > 0 ? "approved" : "neutral"}>
                {fillTemplate(copy.patient.dashboard.activeAccessBadge, { count: accessState.activeGrants.length })}
              </StatusBadge>
            </div>
            <CardTitle>{copy.patient.dashboard.activeAccessTitle}</CardTitle>
            <CardDescription>{copy.patient.dashboard.activeAccessDescription}</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {accessState.activeGrants.length > 0 ? (
              accessState.activeGrants.map((grant) => (
                <div key={grant.grantId} className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-midnight)]">{grant.doctorName}</p>
                    <StatusBadge tone={proofTone(grant.blockchainStatus)}>
                      {copy.common.proofPrefix} {proofLabel(copy, grant.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-[var(--color-ash)]">
                    <Clock size={15} />
                    {copy.common.until} {formatDateTime(grant.expiresAt, locale)}
                  </p>
                  <p className="text-sm text-[var(--color-charcoal-primary)]">{localizedScopeList(copy, grant.scopes).join(", ")}</p>
                </div>
              ))
            ) : (
              <EmptyState message={copy.patient.dashboard.noActiveAccess} />
            )}
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/patient/access">{copy.patient.dashboard.manageAccess}</Link>
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.patient.dashboard.historyTitle}</CardTitle>
            <CardDescription>{copy.patient.dashboard.historyDescription}</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            {latestHistory.length > 0 ? (
              latestHistory.map((item) => (
                <div key={item.id} className="grid gap-1 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(item.status)}>{statusLabel(copy, item.status)}</StatusBadge>
                    <StatusBadge tone={proofTone(item.blockchainStatus)}>
                      {copy.common.proofPrefix} {proofLabel(copy, item.blockchainStatus)}
                    </StatusBadge>
                  </div>
                  <p className="font-semibold text-[var(--color-midnight)]">
                    {patientAccessActionLabel(copy, item.action, item.label)}
                  </p>
                  <p className="text-[var(--color-ash)]">
                    {item.doctorName ?? copy.common.noDoctor} · {formatDateTime(item.createdAt, locale)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message={copy.patient.dashboard.noHistory} />
            )}
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/patient/access-history">
                <History size={16} />
                {copy.patient.dashboard.viewAllHistory}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatusLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[var(--color-teal-deep)]">{icon}</span>
      <span>
        <span className="block text-xs text-[var(--color-ash)]">{label}</span>
        <span className="font-semibold">{value}</span>
      </span>
    </div>
  );
}
