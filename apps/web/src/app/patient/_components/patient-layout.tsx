import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

import { SharedHeader } from "@/components/shared-header";
import { ForbiddenState } from "@/components/state-panel";
import type { ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

import { PatientDesktopNavigation, PatientMobileNavigation } from "./patient-navigation";

type PatientLayoutProps = {
  children: ReactNode;
  copy: Dictionary;
  header?: ReactNode;
  patientEmail: string;
  patientName: string;
  title: string;
};

export function PatientLayout({
  children,
  copy,
  header,
  patientEmail,
  patientName,
  title,
}: PatientLayoutProps) {
  return (
    <div
      className="min-h-screen bg-[var(--color-warm-canvas)]"
      data-patient-layout="portal-shell"
    >
      {header ?? (
        <SharedHeader
          authMode="authenticated"
          contextTitle={title}
          isAuthenticated
          maxWidth="none"
          position="fixed"
          className="shadow-none"
        />
      )}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 pb-[120px] pt-[100px] md:grid-cols-12">
        <aside className="hidden md:col-span-3 md:block">
          <div className="sticky top-[100px] flex flex-col gap-6">
            <DashboardCard className="p-8" data-patient-sidebar="profile">
              <div className="flex flex-col items-center gap-4">
                <div className="grid size-20 place-items-center overflow-hidden rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] text-[23px] font-semibold text-[var(--color-midnight)]">
                  {getInitials(patientName)}
                </div>
                <div className="min-w-0 text-center">
                  <h2 className="text-[19px] font-semibold leading-tight text-[var(--color-midnight)]">
                    {patientName}
                  </h2>
                  <p className="mb-4 mt-1 break-all text-xs leading-5 text-[var(--color-ash)]">
                    {patientEmail}
                  </p>
                  <Link
                    href="/patient/onboarding/step-1"
                    className="inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-midnight)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-teal-deep)]"
                  >
                    {copy.patient.dashboard.editProfile}
                  </Link>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-4" data-patient-sidebar="navigation">
              <PatientDesktopNavigation copy={copy} />
            </DashboardCard>
          </div>
        </aside>

        <div className="col-span-1 flex flex-col gap-8 md:col-span-9">
          <h1 className="sr-only">{title}</h1>
          <PatientMobileNavigation copy={copy} />

          {children}
        </div>
      </main>
    </div>
  );
}

export async function PatientForbiddenLayout({
  role,
  title,
}: {
  role: ResolvedRole;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <SharedHeader
        authMode="authenticated"
        contextTitle={title}
        isAuthenticated
        maxWidth="none"
        position="fixed"
        className="shadow-none"
      />
      <main className="mx-auto max-w-[860px] px-6 pb-[120px] pt-[100px]">
        <ForbiddenState role={role} />
      </main>
    </div>
  );
}

export function DashboardCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-8 shadow-[inset_0_0_0_1px_var(--color-stone-surface)]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "P";
}
