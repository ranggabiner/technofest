"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import {
  PortalNavigationContent,
  PortalNavigationTransitionProvider,
  PortalTransitionLink,
  usePortalNavigationTransition,
} from "@/app/_components/portal-navigation";
import {
  patientNavigationTargets,
  patientPendingSkeletonKey,
} from "./patient-navigation-transition-model";

export { patientNavigationTargets, PortalTransitionLink as PatientTransitionLink };

const PatientAccessSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.PatientAccessSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const PatientDashboardSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.PatientDashboardSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const PatientHealthHistorySkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.PatientHealthHistorySkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const PatientHealthHistoryRecordsSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.PatientHealthHistoryRecordsSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);
const PatientHealthHistoryJournalSkeleton = dynamic(
  () => import("@/components/loading-skeletons").then((module) => module.PatientHealthHistoryJournalSkeleton),
  { loading: () => <PendingSkeletonFallback /> },
);

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
  if (key === "health-history-records") return <PatientHealthHistoryRecordsSkeleton />;
  if (key === "health-history-journal") return <PatientHealthHistoryJournalSkeleton />;
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
