"use client";

import type { ReactNode } from "react";

import {
  PortalNavigationContent,
  PortalNavigationTransitionProvider,
  PortalTransitionLink,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import {
  PatientAccessSkeleton,
  PatientDashboardSkeleton,
  PatientHealthHistorySkeleton,
} from "@/components/loading-skeletons";

import {
  patientNavigationTargets,
  patientPendingSkeletonKey,
} from "./patient-navigation-transition-model";

export { patientNavigationTargets, PortalTransitionLink as PatientTransitionLink };

export function PatientNavigationTransitionProvider({ children }: { children: ReactNode }) {
  return (
    <PortalNavigationTransitionProvider targets={patientNavigationTargets}>
      {children}
    </PortalNavigationTransitionProvider>
  );
}

export function usePatientNavigationTransition() {
  const { beginPortalNavigation, pendingPath } = usePortalNavigationTransition();

  return {
    beginPatientNavigation: beginPortalNavigation,
    pendingPath,
  };
}

export function PatientNavigationContent({ children }: { children: ReactNode }) {
  return (
    <PortalNavigationContent
      dataPendingAttribute="data-patient-main-pending"
      renderSkeleton={renderPendingSkeleton}
    >
      {children}
    </PortalNavigationContent>
  );
}

function renderPendingSkeleton(path: string) {
  const key = patientPendingSkeletonKey(path);

  if (key === "dashboard") return <PatientDashboardSkeleton />;
  if (key === "access") return <PatientAccessSkeleton />;
  if (key === "health-history") return <PatientHealthHistorySkeleton />;
  return null;
}
