"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  PortalDesktopNavigation,
  PortalMobileNavigation,
  PortalNavigationContent,
  PortalTransitionLink,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { doctorNavItems, doctorStatusNavItems } from "./doctor-nav-model";
import { doctorPendingSkeletonKey } from "./doctor-navigation-transition-model";

export { PortalTransitionLink as DoctorTransitionLink };

const DoctorDashboardSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.DoctorDashboardSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const DoctorGrantPageSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.DoctorGrantPageSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const DoctorMedicalRecordLibrarySkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.DoctorMedicalRecordLibrarySkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);

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

export function DoctorStatusDesktopNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/doctor/status";
  const navItems = doctorStatusNavItems(pathname, copy);

  return (
    <PortalDesktopNavigation
      ariaLabel={copy.appShell.mainNavLabel}
      items={navItems}
      sectionLabel={copy.doctor.dashboard.sidebarSection}
    />
  );
}

export function DoctorStatusMobileNavigation({ copy }: { copy: Dictionary }) {
  const pathname = usePathname() ?? "/doctor/status";
  const navItems = doctorStatusNavItems(pathname, copy);

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

function PendingSkeletonFallback() {
  return (
    <div className="grid min-h-[360px] animate-pulse gap-4">
      <div className="h-28 rounded-[10px] bg-[var(--color-stone-surface)]" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-40 rounded-[10px] bg-[var(--color-stone-surface)]" />
        <div className="h-40 rounded-[10px] bg-[var(--color-stone-surface)]" />
      </div>
      <div className="h-32 rounded-[10px] bg-[var(--color-stone-surface)]" />
    </div>
  );
}
