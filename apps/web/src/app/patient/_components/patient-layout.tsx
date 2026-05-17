import Link from "next/link";
import { LogOut } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { signOutAction } from "@/app/auth/actions";
import { SharedHeader } from "@/components/shared-header";
import { SiteFooter, SiteFooterContent } from "@/components/site-footer";
import { ForbiddenState } from "@/components/state-panel";
import type { ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

import { PatientDesktopNavigation, PatientMobileNavigation } from "./patient-navigation";
import {
  PatientNavigationContent,
  PatientNavigationTransitionProvider,
} from "./patient-navigation-transition";

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
          showAuthAction={false}
        />
      )}
      <PatientNavigationTransitionProvider>
        <main className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-6 px-6 pb-[120px] pt-[100px] md:grid-cols-12">
          <aside className="hidden md:col-span-3 md:block">
            <div className="sticky top-[100px] flex flex-col gap-6">
              <PatientProfileCard
                copy={copy}
                patientEmail={patientEmail}
                patientName={patientName}
                variant="desktop"
                data-patient-sidebar="profile"
              />

              <DashboardCard className="p-4" data-patient-sidebar="navigation">
                <PatientDesktopNavigation copy={copy} />
              </DashboardCard>
            </div>
          </aside>

          <div className="col-span-1 flex flex-col gap-8 md:col-span-9">
            <h1 className="sr-only">{title}</h1>
            <PatientProfileCard
              copy={copy}
              patientEmail={patientEmail}
              patientName={patientName}
              variant="mobile"
              data-patient-sidebar="mobile-profile"
            />
            <PatientMobileNavigation copy={copy} />

            <PatientNavigationContent>{children}</PatientNavigationContent>
          </div>
        </main>
      </PatientNavigationTransitionProvider>
      <SiteFooterContent copy={copy} />
    </div>
  );
}

type PatientProfileCardProps = HTMLAttributes<HTMLElement> & {
  copy: Dictionary;
  patientEmail: string;
  patientName: string;
  variant: "desktop" | "mobile";
};

function PatientProfileCard({
  className,
  copy,
  patientEmail,
  patientName,
  variant,
  ...props
}: PatientProfileCardProps) {
  const isMobile = variant === "mobile";

  return (
    <DashboardCard
      className={cn(isMobile ? "p-4 md:hidden" : "p-8", className)}
      {...props}
    >
      <div className={cn("flex gap-4", isMobile ? "items-center" : "flex-col items-center")}>
        <div
          className={cn(
            "grid place-items-center overflow-hidden rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] font-semibold text-[var(--color-midnight)]",
            isMobile ? "size-14 shrink-0 text-[18px]" : "size-20 text-[23px]",
          )}
        >
          {getInitials(patientName)}
        </div>
        <div className={cn("min-w-0", isMobile ? "flex-1" : "w-full text-center")}>
          <h2
            className={cn(
              "font-semibold leading-tight text-[var(--color-midnight)]",
              isMobile ? "text-[16px]" : "text-[19px]",
            )}
          >
            {patientName}
          </h2>
          <p className="mt-1 break-all text-xs leading-5 text-[var(--color-ash)]">
            {patientEmail}
          </p>
          <div className={cn("mt-4 grid gap-2", isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            <Link
              href="/patient/onboarding/step-1"
              className="inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-midnight)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-teal-deep)]"
            >
              {copy.patient.dashboard.editProfile}
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 text-xs font-medium text-[var(--color-ash)] transition hover:border-[var(--color-stone-surface)] hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-midnight)]"
              >
                <span>{copy.common.logout}</span>
                <LogOut size={15} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardCard>
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
      <main className="mx-auto min-h-screen max-w-[860px] px-6 pb-[120px] pt-[100px]">
        <ForbiddenState role={role} />
      </main>
      <SiteFooter />
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
