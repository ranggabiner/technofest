"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  PortalDesktopNavigation,
  PortalMobileNavigation,
  PortalNavigationContent,
  PortalTransitionLink,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import {
  DoctorDashboardSkeleton,
  DoctorGrantPageSkeleton,
  DoctorMedicalRecordLibrarySkeleton,
} from "@/components/loading-skeletons";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { doctorNavItems } from "./doctor-nav-model";
import { doctorPendingSkeletonKey } from "./doctor-navigation-transition-model";

export { PortalTransitionLink as DoctorTransitionLink };

export function DoctorDesktopNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/doctor";
  const { pendingPath } = usePortalNavigationTransition();
  const navItems = doctorNavItems(pendingPath ?? pathname, copy);

  return (
    <PortalDesktopNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      sectionLabel={copy.doctor.dashboard.sidebarSection}
    />
  );
}

export function DoctorMobileNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/doctor";
  const { pendingPath } = usePortalNavigationTransition();
  const navItems = doctorNavItems(pendingPath ?? pathname, copy);

  return (
    <PortalMobileNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      role="doctor"
    />
  );
}

export function DoctorNavigationContent({ children }: { children: ReactNode }) {
  return (
    <PortalNavigationContent
      dataPendingAttribute="data-doctor-main-pending"
      renderSkeleton={renderPendingSkeleton}
    >
      {children}
    </PortalNavigationContent>
  );
}

function renderPendingSkeleton(path: string) {
  const key = doctorPendingSkeletonKey(path);

  if (key === "dashboard") return <DoctorDashboardSkeleton />;
  if (key === "medical-record-library") return <DoctorMedicalRecordLibrarySkeleton />;
  if (key === "grant") return <DoctorGrantPageSkeleton />;
  return null;
}
