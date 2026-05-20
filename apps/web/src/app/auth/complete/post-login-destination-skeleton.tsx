import type { ReactNode } from "react";

import {
  AdminDashboardSkeleton,
  DoctorDashboardSkeleton,
  DoctorStatusSkeleton,
  HeaderSkeleton,
  LoadingCard,
  OnboardingPageSkeleton,
  PatientDashboardSkeleton,
  RoleSelectionSkeleton,
  SuperAdminDashboardSkeleton,
} from "@/components/loading-skeletons";

type PostLoginDestinationSkeletonProps = {
  nextPath?: string | null;
};

export function PostLoginDestinationSkeleton({ nextPath }: PostLoginDestinationSkeletonProps) {
  const path = normalizePostLoginPath(nextPath);

  if (path === "/login/role") return <RoleSelectionSkeleton />;

  if (path.startsWith("/patient/onboarding/step-1")) {
    return <OnboardingPageSkeleton role="patient" variant="intro" />;
  }

  if (path.startsWith("/patient/onboarding/step-2") || path.startsWith("/patient/onboarding/step-3")) {
    return <OnboardingPageSkeleton role="patient" variant="form" />;
  }

  if (path.startsWith("/patient")) {
    return (
      <PortalDashboardSkeleton>
        <PatientDashboardSkeleton />
      </PortalDashboardSkeleton>
    );
  }

  if (path.startsWith("/doctor/onboarding/step-1")) {
    return <OnboardingPageSkeleton role="doctor" variant="form" />;
  }

  if (path.startsWith("/doctor/onboarding/step-2")) {
    return <OnboardingPageSkeleton role="doctor" variant="documents" />;
  }

  if (path.startsWith("/doctor/onboarding/step-3")) {
    return <OnboardingPageSkeleton role="doctor" variant="review" />;
  }

  if (path.startsWith("/doctor/status")) return <DoctorStatusSkeleton />;

  if (path.startsWith("/doctor")) {
    return (
      <PortalDashboardSkeleton>
        <DoctorDashboardSkeleton />
      </PortalDashboardSkeleton>
    );
  }

  if (path.startsWith("/superadmin")) return <SuperAdminDashboardSkeleton />;

  if (path.startsWith("/admin")) {
    return (
      <PortalDashboardSkeleton>
        <AdminDashboardSkeleton />
      </PortalDashboardSkeleton>
    );
  }

  return (
    <PortalDashboardSkeleton>
      <GenericDashboardContentSkeleton />
    </PortalDashboardSkeleton>
  );
}

function PortalDashboardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]" data-post-login-skeleton="dashboard-shell">
      <HeaderSkeleton position="fixed" />
      <main className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-5 px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-[100px] md:grid-cols-12 lg:gap-8">
        <aside className="hidden md:col-span-3 md:block">
          <div className="sticky top-[100px] flex flex-col gap-6">
            <LoadingCard className="p-8" lines={2} />
            <LoadingCard className="p-4" lines={3} />
          </div>
        </aside>
        <div className="col-span-1 flex flex-col gap-5 md:col-span-9 md:gap-8">
          <LoadingCard className="md:hidden" lines={2} />
          {children}
        </div>
      </main>
    </div>
  );
}

function GenericDashboardContentSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="dashboard">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <div className="mb-3 h-4 w-28 animate-pulse rounded-full bg-[var(--color-stone-surface)]" />
        <div className="h-12 w-full max-w-[520px] animate-pulse rounded-full bg-[var(--color-stone-surface)]" />
        <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-[var(--color-stone-surface)]" />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingCard lines={1} />
        <LoadingCard lines={1} />
        <LoadingCard lines={1} />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </section>
    </div>
  );
}

function normalizePostLoginPath(path: string | null | undefined) {
  if (!path) return "";
  const [withoutHash] = path.split("#", 1);
  const [withoutSearch] = withoutHash.split("?", 1);
  return withoutSearch || "";
}
