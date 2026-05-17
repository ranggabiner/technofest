"use client";

import { usePathname } from "next/navigation";

import {
  PortalDesktopNavigation,
  PortalMobileNavigation,
} from "@/app/_components/portal-navigation";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { patientNavItems } from "./patient-nav-model";
import { usePatientNavigationTransition } from "./patient-navigation-transition";

export function PatientDesktopNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/patient";
  const { pendingPath } = usePatientNavigationTransition();
  const navItems = patientNavItems(pendingPath ?? pathname, copy);

  return (
    <PortalDesktopNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      sectionLabel={copy.patient.dashboard.sidebarSection}
    />
  );
}

export function PatientMobileNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/patient";
  const { pendingPath } = usePatientNavigationTransition();
  const navItems = patientNavItems(pendingPath ?? pathname, copy);

  return (
    <PortalMobileNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      role="patient"
    />
  );
}
