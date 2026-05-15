import { redirect } from "next/navigation";
import { AlertTriangle, Bot, CheckCircle2, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";
import { proofLabel } from "@/lib/i18n/labels";
import { getDictionary } from "@/lib/i18n/server";

import { AiJournalClient } from "../_components/ai-journal-client";
import { patientNav } from "../_components/nav";

export const dynamic = "force-dynamic";

export default async function PatientChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ ai_error?: string; ai_status?: string }>;
}) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <AppShell title={copy.patient.chat.shortTitle} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = (await searchParams) ?? {};
  const state = await loadPatientJournalState(role);

  return (
    <AppShell title={copy.patient.chat.title} nav={patientNav("/patient/chat", copy)}>
      <div className="grid gap-5">
        {params.ai_error === "finalize_failed" ? (
          <StatusMessage
            tone="failed"
            message={copy.patient.chat.finalizeFailed}
          />
        ) : null}

        {params.ai_status === "finalized" ? (
          <StatusMessage tone="approved" message={copy.patient.chat.finalized} />
        ) : null}

        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusBadge tone={state.consentAccepted ? "approved" : "pending"}>
                {state.consentAccepted ? copy.patient.chat.consentAccepted : copy.patient.chat.consentMissing}
              </StatusBadge>
              <StatusBadge tone={state.profilingComplete ? "approved" : "pending"}>
                {state.profilingComplete ? copy.patient.chat.profileComplete : copy.patient.chat.profileMissing}
              </StatusBadge>
            </div>
            <CardTitle>{copy.patient.chat.cardTitle}</CardTitle>
            <CardDescription>
              {copy.patient.chat.cardDescription}
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 rounded-[10px] bg-[var(--color-teal-muted)] p-4 text-sm text-[var(--color-charcoal-primary)] sm:grid-cols-3">
            <StatusLine icon={<LockKeyhole size={16} />} label={copy.patient.chat.storageLabel} value={copy.patient.chat.storageValue} />
            <StatusLine icon={<Bot size={16} />} label={copy.patient.chat.modelLabel} value="DeepSeek" />
            <StatusLine
              icon={<CheckCircle2 size={16} />}
              label={copy.patient.chat.consentProofLabel}
              value={state.consentBlockchainStatus ? proofLabel(copy, state.consentBlockchainStatus) : copy.common.proofLabel.unavailable}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex gap-2">
              <StatusBadge tone="approved">{copy.patient.chat.aiActive}</StatusBadge>
              <StatusBadge tone={state.latestSummaryStatus === "generated" ? "approved" : "pending"}>
                {state.latestSummaryStatus === "generated"
                  ? copy.patient.chat.summaryReady
                  : state.activeSessionId
                    ? copy.patient.chat.sessionRunning
                    : copy.patient.chat.noSession}
              </StatusBadge>
            </div>
            <CardTitle>{copy.patient.chat.chatTitle}</CardTitle>
            <CardDescription>{copy.patient.chat.chatDescription}</CardDescription>
          </CardHeader>
          <AiJournalClient
            initialSessionId={state.activeSessionId}
            initialMessages={state.messages}
            initialPatientMessageCount={state.activePatientMessageCount}
            copy={copy.patient.chat}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.patient.chat.latestSummaryTitle}</CardTitle>
            <CardDescription>{copy.patient.chat.latestSummaryDescription}</CardDescription>
          </CardHeader>
          {state.latestSummary ? (
            <p className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm leading-6 text-[var(--color-charcoal-primary)]">
              {state.latestSummary}
            </p>
          ) : (
            <EmptyState message={copy.patient.dashboard.noSummary} />
          )}
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
