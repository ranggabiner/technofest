import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

import { ProofStatus } from "@/components/proof-status";
import { EmptyState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { loadPatientJournalDashboardState } from "@/lib/ai/journal-service";
import { formatDateTime, fillTemplate } from "@/lib/i18n/format";
import {
  proofLabel,
  proofStatusMessages,
  proofTone,
  recordTypeLabel,
} from "@/lib/i18n/labels";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { loadPatientDashboardState } from "@/lib/patient/dashboard";
import { cn } from "@/lib/utils";

import { DashboardCard } from "../_components/patient-layout";
import { PatientDashboardQuickAccess } from "../_components/patient-dashboard-quick-access";
import { PatientTransitionLink } from "../_components/patient-navigation-transition";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const [journalState, dashboardState] = await Promise.all([
    loadPatientJournalDashboardState(role),
    loadPatientDashboardState(role),
  ]);

  return (
    <>
      <section className="flex flex-col gap-8 border-b border-[var(--color-stone-surface)] pb-4 sm:gap-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[620px]">
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[var(--color-midnight)] sm:text-lg sm:tracking-widest">
                  {copy.patient.dashboard.eyebrow}
                </p>
                <h1 className="mb-2 text-3xl font-medium leading-tight tracking-normal text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
                  {fillTemplate(copy.patient.dashboard.dailyPrompt, { name: role.fullName })}
                </h1>
                <p className="max-w-md text-base leading-7 text-[var(--color-ash)]">
                  {copy.patient.dashboard.dailyDescription}
                </p>
              </div>
              <Button asChild className="min-h-12 w-full shrink-0 px-8 sm:w-fit">
                <PatientTransitionLink href="/patient/chat">
                  {copy.patient.dashboard.startNow}
                  <ArrowUpRight size={16} />
                </PatientTransitionLink>
              </Button>
            </div>
      </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,620px)]">
          <DashboardCard>
            <PatientDashboardQuickAccess copy={copy} />
          </DashboardCard>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.patient.dashboard.healthHistoryTitle}
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard className="flex flex-col md:min-h-[400px]">
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold leading-tight text-[var(--color-midnight)]">
                    {copy.patient.dashboard.scope1TimelineTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
                    {copy.patient.dashboard.scope1Description}
                  </p>
                </div>
                <PatientTransitionLink
                  href="/patient/health-history#records"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-[var(--color-stone-surface)] px-4 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)] sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:hover:bg-transparent sm:hover:underline"
                >
                  {copy.patient.dashboard.moreDetails}
                  <ChevronRight size={14} aria-hidden="true" />
                </PatientTransitionLink>
              </div>

              {dashboardState.recentScope1Records.length > 0 ? (
                <div className="relative grid gap-6 pl-2 before:absolute before:bottom-0 before:left-5 before:top-10 before:border-l before:border-dashed before:border-[var(--color-stone-surface)]">
                  {dashboardState.recentScope1Records.map((record, index) => (
                    <div key={record.recordId} className="relative z-10 flex gap-4">
                      <span
                        aria-hidden="true"
                        data-scope1-record-marker
                        className={[
                          "mt-1 grid size-10 shrink-0 place-items-center rounded-full border-2 bg-[var(--color-card)]",
                          index === 0
                            ? "border-[var(--color-teal-primary)] text-[var(--color-teal-deep)]"
                            : "border-[var(--color-stone-surface)] text-[var(--color-ash)]",
                        ].join(" ")}
                      >
                        <span className="size-2.5 rounded-full bg-current" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <StatusBadge tone="neutral">{recordTypeLabel(copy, record.recordType)}</StatusBadge>
                          <StatusBadge tone={proofTone(record.blockchainStatus)}>
                            {copy.common.proofPrefix} {proofLabel(copy, record.blockchainStatus)}
                          </StatusBadge>
                        </div>
                        <p className="break-words font-semibold text-[var(--color-midnight)]">{record.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-ash)]">{formatDateTime(record.createdAt, locale)}</p>
                        <div className="mt-3">
                          <ProofStatus
                            proofType="scope1_record"
                            id={record.recordId}
                            blockchainStatus={record.blockchainStatus}
                            txHash={record.blockchainTxHash}
                            messages={proofStatusMessages(copy)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message={copy.patient.dashboard.noScope1} />
              )}
            </DashboardCard>

            <DashboardCard className="flex flex-col md:min-h-[400px]">
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold leading-tight text-[var(--color-midnight)]">
                    {copy.patient.dashboard.aiSummaryTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ash)]">
                    {copy.patient.dashboard.scope2Description}
                  </p>
                </div>
                <PatientTransitionLink
                  href="/patient/health-history#journal"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-[var(--color-stone-surface)] px-4 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)] sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:hover:bg-transparent sm:hover:underline"
                >
                  {copy.patient.dashboard.moreDetails}
                  <ChevronRight size={14} aria-hidden="true" />
                </PatientTransitionLink>
              </div>

              {journalState.recentSummaries.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {journalState.recentSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className={cn(
                        "rounded-[14px] border border-[var(--color-stone-surface)] bg-[var(--color-parchment-card)] p-4 hover:border-[color-mix(in_srgb,var(--color-teal-primary)_30%,transparent)] hover:bg-[var(--color-teal-surface)] sm:p-6",
                        motion.card,
                      )}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-card)] text-[var(--color-teal-deep)]">
                            <MessageCircle size={18} aria-hidden="true" />
                          </span>
                          <h3 className="truncate font-semibold text-[var(--color-midnight)]">
                            {summary.title ?? copy.patient.dashboard.scope2Title}
                          </h3>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)] sm:shrink-0">
                          {formatDateTime(summary.summaryGeneratedAt, locale)}
                        </p>
                      </div>
                      <p className="text-sm italic leading-6 text-[var(--color-charcoal-primary)]">
                        {summary.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message={journalState.consentAccepted ? copy.patient.dashboard.noSummary : copy.patient.dashboard.aiConsentMissing} />
              )}
            </DashboardCard>
          </div>
        </section>

    </>
  );
}
