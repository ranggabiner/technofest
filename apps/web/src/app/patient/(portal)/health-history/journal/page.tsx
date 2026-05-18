import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileHeart,
} from "lucide-react";

import { EmptyState, StatePanel } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import {
  loadPatientHealthJournalState,
  patientHealthJournalFilters,
  resolvePatientHealthJournalFilter,
  type PatientHealthJournalFilter,
} from "@/lib/patient/health-journal";

import { DashboardCard } from "../../../_components/patient-layout";
import { PatientTransitionLink } from "../../../_components/patient-navigation-transition";
import { JournalHistoryClient } from "./_components/journal-history-client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string | string[];
  }>;
};

export default async function PatientHealthJournalPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = await searchParams;
  const activeFilter = resolvePatientHealthJournalFilter(params?.filter);
  const detailCopy = copy.patient.healthHistory.journalDetail;

  let state: Awaited<ReturnType<typeof loadPatientHealthJournalState>> | null = null;
  try {
    state = await loadPatientHealthJournalState(role, activeFilter);
  } catch {
    return (
      <section className="grid gap-8" data-health-history-journal-page="timeline">
        <JournalHeader detailCopy={detailCopy} />
        <StatePanel
          title={detailCopy.errorTitle}
          description={detailCopy.errorDescription}
          tone="warning"
          action={
            <Button asChild variant="secondary" className="mt-4 w-full sm:w-fit">
              <PatientTransitionLink href="/patient/health-history/journal">
                {detailCopy.retry}
              </PatientTransitionLink>
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="grid gap-8" data-health-history-journal-page="timeline">
      <JournalHeader detailCopy={detailCopy} />

      <nav className="flex flex-wrap gap-3" aria-label={detailCopy.filterLabel}>
        {patientHealthJournalFilters.map((filter) => (
          <Button
            key={filter}
            asChild
            variant={filter === state.activeFilter ? "secondary" : "ghost"}
            className="min-h-11 px-5"
          >
            <PatientTransitionLink
              href={journalFilterHref(filter)}
              aria-current={filter === state.activeFilter ? "page" : undefined}
              data-health-history-journal-filter={filter}
            >
              {detailCopy.filters[filter]}
            </PatientTransitionLink>
          </Button>
        ))}
      </nav>

      {state.items.length > 0 ? (
        <section className="grid gap-5" aria-labelledby="journal-history-heading">
          <div>
            <h2
              id="journal-history-heading"
              className="text-2xl font-semibold leading-tight text-[var(--color-midnight)]"
            >
              {detailCopy.historyTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ash)]">
              {detailCopy.historyDescription}
            </p>
          </div>
          <JournalHistoryClient
            copy={detailCopy}
            filter={activeFilter}
            items={state.items}
            locale={locale}
          />
        </section>
      ) : (
        <DashboardCard className="p-6">
          <EmptyState
            message={state.consentAccepted ? detailCopy.noJournal : copy.patient.healthHistory.aiConsentMissing}
          />
        </DashboardCard>
      )}
    </section>
  );
}

function JournalHeader({
  detailCopy,
}: {
  detailCopy: Awaited<ReturnType<typeof getDictionary>>["patient"]["healthHistory"]["journalDetail"];
}) {
  return (
    <header className="border-b border-[var(--color-stone-surface)] pb-6">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ash)]">
        <PatientTransitionLink
          href="/patient/health-history"
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-[var(--color-teal-deep)] transition hover:text-[var(--color-midnight)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {detailCopy.back}
        </PatientTransitionLink>
        <span aria-hidden="true">/</span>
        <span>{detailCopy.parentTitle}</span>
        <span aria-hidden="true">/</span>
        <span>{detailCopy.title}</span>
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="approved">{detailCopy.scopeBadge}</StatusBadge>
            <StatusBadge tone="neutral">{detailCopy.aiBadge}</StatusBadge>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
            {detailCopy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-graphite)]">
            {detailCopy.description}
          </p>
        </div>
        <Button asChild className="min-h-12 w-full shrink-0 px-7 sm:w-fit">
          <PatientTransitionLink href="/patient/chat">
            <FileHeart size={17} aria-hidden="true" />
            {detailCopy.startJournal}
          </PatientTransitionLink>
        </Button>
      </div>
    </header>
  );
}

function journalFilterHref(filter: PatientHealthJournalFilter) {
  if (filter === "all") return "/patient/health-history/journal";
  return `/patient/health-history/journal?filter=${filter}`;
}
