import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpenText,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";

import { DashboardCard } from "../../_components/patient-layout";
import { PatientTransitionLink } from "../../_components/patient-navigation-transition";

export const dynamic = "force-dynamic";

export default async function PatientHealthHistoryPage() {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return null;
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  return (
    <section className="grid gap-12" data-health-history-page="main">
      <header>
        <h1 className="font-serif text-[48px] font-semibold leading-none tracking-[-0.01em] text-[var(--color-midnight)] md:text-[64px]">
          {copy.patient.healthHistory.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-7 text-[var(--color-graphite)]">
          {copy.patient.healthHistory.description}
        </p>
      </header>

      <section
        className="grid gap-8 lg:grid-cols-2"
        data-health-history-section="overview"
      >
        <div id="records" data-health-history-section="records">
          <HealthHistoryOverviewCard
            cta={copy.patient.healthHistory.recordsCta}
            description={copy.patient.healthHistory.recordsDescription}
            cardKey="records"
            href="/patient/health-history/records"
            icon={<ClipboardList size={30} aria-hidden="true" />}
            title={copy.patient.healthHistory.recordsTitle}
          />
        </div>
        <div id="journal" data-health-history-section="journal">
          <HealthHistoryOverviewCard
            cta={copy.patient.healthHistory.journalCta}
            description={copy.patient.healthHistory.journalDescription}
            cardKey="journal"
            href="/patient/health-history/journal"
            icon={<BookOpenText size={30} aria-hidden="true" />}
            title={copy.patient.healthHistory.journalTitle}
          />
        </div>
      </section>
    </section>
  );
}

function HealthHistoryOverviewCard({
  cardKey,
  cta,
  description,
  href,
  icon,
  title,
}: {
  cardKey: "records" | "journal";
  cta: string;
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <DashboardCard
      className="grid min-h-[375px] content-between gap-10 rounded-[16px] p-8 md:p-9"
      data-health-history-card={cardKey}
    >
      <div>
        <span className="mb-10 grid size-16 place-items-center rounded-[10px] bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]">
          {icon}
        </span>
        <h2 className="text-[28px] font-semibold leading-tight text-[var(--color-midnight)]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-[17px] leading-8 text-[var(--color-graphite)]">
          {description}
        </p>
      </div>
      <Button asChild variant="secondary" className="min-h-14 w-fit px-8 text-base">
        <PatientTransitionLink href={href}>
          {cta}
          <ArrowRight size={20} aria-hidden="true" />
        </PatientTransitionLink>
      </Button>
    </DashboardCard>
  );
}
