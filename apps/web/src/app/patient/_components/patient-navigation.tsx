"use client";

import { usePathname } from "next/navigation";

import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

import { patientNavItems } from "./patient-nav-model";
import { PatientTransitionLink, usePatientNavigationTransition } from "./patient-navigation-transition";

export function PatientDesktopNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/patient";
  const { pendingPath } = usePatientNavigationTransition();
  const navItems = patientNavItems(pendingPath ?? pathname, copy);

  return (
    <nav className="flex flex-col gap-1" aria-label={copy.appShell.mainNavLabel}>
      <span className="mb-4 block px-3 text-[19px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
        {copy.patient.dashboard.sidebarSection}
      </span>
      {navItems.map((item) => (
        <PatientTransitionLink
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex min-h-10 cursor-pointer items-center gap-4 rounded-lg px-3 py-2 text-[15px] font-medium text-[var(--color-ash)] transition hover:bg-[color-mix(in_srgb,var(--color-teal-primary)_5%,transparent)] hover:text-[var(--color-teal-deep)]",
            item.active && "bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]",
          )}
        >
          <item.icon size={20} aria-hidden="true" />
          {item.label}
        </PatientTransitionLink>
      ))}
    </nav>
  );
}

export function PatientMobileNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/patient";
  const { pendingPath } = usePatientNavigationTransition();
  const navItems = patientNavItems(pendingPath ?? pathname, copy);

  return (
    <nav
      className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-2 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] md:hidden"
      aria-label={copy.appShell.mainNavLabel}
      data-patient-sidebar="mobile-navigation"
    >
      {navItems.map((item) => (
        <PatientTransitionLink
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ash)]",
            item.active && "bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]",
          )}
        >
          <item.icon size={18} aria-hidden="true" />
          {item.label}
        </PatientTransitionLink>
      ))}
    </nav>
  );
}
