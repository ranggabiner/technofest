import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function HeaderSkeleton({ position = "sticky" }: { position?: "fixed" | "sticky" | "static" }) {
  return (
    <header
      className={cn(
        position === "fixed" && "fixed inset-x-0 top-0 z-50",
        position === "sticky" && "sticky top-0 z-40",
        position === "static" && "relative z-40",
        "border-b border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] shadow-[var(--shadow-subtle)]",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-none items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="hidden h-5 w-28 lg:block" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function AppShellSkeleton({
  children,
  navItems = 3,
}: {
  children: React.ReactNode;
  navItems?: number;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton />
      <div className="min-h-[calc(100vh-4rem)] md:grid md:grid-cols-[260px_1fr]">
        <aside className="border-b border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 py-3 md:border-b-0 md:border-r md:py-6">
          <nav className="flex gap-2 overflow-x-auto pb-1 md:grid md:overflow-visible md:pb-0">
            {Array.from({ length: navItems }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-32 shrink-0 md:w-full" />
            ))}
          </nav>
        </aside>
        <main>
          <div className="mx-auto max-w-[860px] px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function LoadingCard({
  className,
  lines = 2,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <Card className={cn("grid gap-5", className)} data-skeleton-card>
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-2/3 max-w-[360px]" />
        <Skeleton className="h-4 w-4/5 max-w-[480px]" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            data-skeleton-line
            className={cn("h-4", index % 3 === 0 ? "w-full" : index % 3 === 1 ? "w-5/6" : "w-2/3")}
          />
        ))}
      </div>
    </Card>
  );
}

export function LoadingList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          data-skeleton-row
          className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 sm:grid-cols-[1fr_auto]"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-4 w-52 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--color-stone-surface)]">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

export function LoadingForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton position="fixed" />
      <main className="flex flex-1 items-center justify-center px-6 pt-16">
        <div className="grid w-full max-w-[1100px] gap-12 md:grid-cols-2 md:items-center">
          <div className="hidden flex-col gap-12 md:flex">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-6">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
          <Card className="mx-auto grid w-full max-w-md gap-6 p-8">
            <Skeleton className="mx-auto h-12 w-56" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="mx-auto h-4 w-64 max-w-full" />
          </Card>
        </div>
      </main>
    </div>
  );
}

export function RoleSelectionSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton />
      <main className="flex flex-1 items-center justify-center px-6 pb-24 pt-32">
        <Card className="w-full max-w-[640px] p-8 md:p-20">
          <div className="mx-auto mb-16 max-w-[480px] space-y-4">
            <Skeleton className="mx-auto h-12 w-80 max-w-full" />
            <Skeleton className="mx-auto h-4 w-full" />
            <Skeleton className="mx-auto h-4 w-5/6" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="min-h-[180px] rounded-xl" />
            <Skeleton className="min-h-[180px] rounded-xl" />
          </div>
          <Skeleton className="ml-auto mt-12 h-10 w-40 rounded-full" />
        </Card>
      </main>
    </div>
  );
}

export function OnboardingPageSkeleton({ variant = "form" }: { variant?: "intro" | "form" | "documents" | "review" }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-20">
        <div className="mx-auto mb-20 flex w-full max-w-2xl items-start justify-center gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-24" />
          ))}
        </div>
        <div className="mx-auto w-full max-w-2xl">
          {variant !== "intro" ? (
            <header className="mb-12 space-y-4 text-center">
              <Skeleton className="mx-auto h-12 w-80 max-w-full" />
              <Skeleton className="mx-auto h-4 w-full max-w-lg" />
              <Skeleton className="mx-auto h-4 w-4/5 max-w-md" />
            </header>
          ) : null}
          <Card className="grid gap-6 p-8 md:p-12">
            {variant === "documents" ? (
              <>
                <DocumentUploadSkeleton />
                <DocumentUploadSkeleton />
                <DocumentUploadSkeleton />
              </>
            ) : variant === "review" ? (
              <>
                <LoadingList rows={2} />
                <LoadingList rows={3} />
              </>
            ) : (
              <LoadingForm fields={variant === "intro" ? 3 : 5} />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

export function PatientDashboardSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-dashboard">
      <section className="border-b border-[var(--color-stone-surface)] pb-4">
        <Skeleton className="mb-4 h-5 w-28" />
        <Skeleton className="h-12 w-full max-w-[620px]" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <Skeleton className="mt-6 h-12 w-40 rounded-full" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <LoadingCard lines={5} />
        <LoadingCard lines={4} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <TimelineSkeleton />
        <LoadingCard className="min-h-[400px]" lines={6} />
      </section>
    </div>
  );
}

export function PatientChatSkeleton() {
  return (
    <div
      className="h-screen overflow-hidden bg-[var(--color-warm-canvas)]"
      data-loading-pattern="patient-chat"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="grid min-h-0 shrink-0 gap-6 overflow-hidden border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-stone-surface)_55%,var(--color-warm-canvas))] p-4 lg:border-b-0 lg:border-r lg:p-6">
          <div data-chat-header="navigation-group" className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="mt-auto grid gap-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        </aside>
        <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden px-5 py-8 md:px-10">
          <div className="mx-auto grid min-h-0 w-full max-w-[720px] flex-1 place-content-center gap-10 text-center">
            <div className="grid justify-items-center gap-3">
              <Skeleton className="h-12 w-72 md:h-16 md:w-96" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Skeleton className="h-[190px] rounded-xl" />
              <Skeleton className="h-[190px] rounded-xl" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[800px]">
            <Skeleton className="h-14 w-full rounded-full" />
            <Skeleton className="mx-auto mt-4 h-4 w-full max-w-[560px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientAccessSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-access">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <Card className="grid gap-8 p-6 md:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] p-5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="min-h-[178px] w-full rounded-xl" />
          </div>
        </div>
      </Card>
      <section className="grid gap-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Card className="grid gap-4 p-6">
          <Skeleton className="h-6 w-36" />
          <LoadingList rows={2} />
        </Card>
        <div className="grid gap-5 xl:grid-cols-2">
          <LoadingCard lines={4} />
          <LoadingCard lines={5} />
        </div>
      </section>
    </div>
  );
}

export function PatientHealthHistorySkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-health-history">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <LoadingCard lines={3} />
        <LoadingCard lines={3} />
      </section>
      <section className="grid gap-5 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <TimelineSkeleton />
        <LoadingCard className="min-h-[420px]" lines={7} />
      </section>
    </div>
  );
}

export function PatientHealthJournalSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-health-journal">
      <section className="border-b border-[var(--color-stone-surface)] pb-6">
        <Skeleton className="mb-5 h-4 w-52" />
        <Skeleton className="mb-3 h-6 w-36 rounded-full" />
        <Skeleton className="h-12 w-full max-w-[520px] md:h-14" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-6 h-12 w-40 rounded-full" />
      </section>
      <nav className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </nav>
      <section className="grid gap-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <TimelineSkeleton />
      </section>
    </div>
  );
}

export function DoctorDashboardSkeleton() {
  return (
    <AppShellSkeleton navItems={1}>
      <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
        <LoadingCard lines={1} />
        <LoadingCard lines={2} />
      </div>
      <div className="mt-5">
        <LoadingCard lines={1} />
        <LoadingList rows={3} />
      </div>
    </AppShellSkeleton>
  );
}

export function DoctorGrantPageSkeleton() {
  return (
    <AppShellSkeleton navItems={2}>
      <div className="grid gap-5" data-loading-pattern="doctor-grant">
        <LoadingCard lines={3} />
        <LoadingCard lines={6} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </div>
    </AppShellSkeleton>
  );
}

export function DoctorStatusSkeleton() {
  return (
    <AppShellSkeleton navItems={2}>
      <LoadingCard lines={3} />
    </AppShellSkeleton>
  );
}

export function AdminDoctorsSkeleton() {
  return (
    <AppShellSkeleton navItems={1}>
      <Card>
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="my-5">
          <BlockchainRetrySkeleton />
        </div>
        <LoadingForm fields={3} />
        <LoadingTable rows={6} />
      </Card>
    </AppShellSkeleton>
  );
}

export function AdminDoctorDetailSkeleton() {
  return (
    <AppShellSkeleton navItems={1}>
      <div className="grid gap-5">
        <LoadingCard lines={3} />
        <LoadingCard lines={3} />
        <LoadingCard lines={4} />
        <LoadingCard lines={5} />
      </div>
    </AppShellSkeleton>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <AppShellSkeleton navItems={3}>
      <div className="grid gap-5" data-loading-pattern="admin-dashboard">
        <section className="grid gap-4 md:grid-cols-3">
          <LoadingCard lines={1} />
          <LoadingCard lines={1} />
          <LoadingCard lines={1} />
        </section>
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
          <LoadingCard lines={5} />
          <LoadingCard lines={5} />
        </section>
      </div>
    </AppShellSkeleton>
  );
}

export function AdminApprovalSkeleton() {
  return (
    <AppShellSkeleton navItems={3}>
      <div className="grid gap-4" data-loading-pattern="admin-approval">
        <LoadingCard lines={2} />
        <LoadingTable rows={6} />
      </div>
    </AppShellSkeleton>
  );
}

export function AdminAddAdminSkeleton() {
  return (
    <AppShellSkeleton navItems={3}>
      <div className="grid min-h-[calc(100vh-12rem)] place-items-center" data-loading-pattern="admin-add-admin">
        <Card className="w-full max-w-xl">
          <LoadingForm fields={1} />
        </Card>
      </div>
    </AppShellSkeleton>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]" data-loading-pattern="home">
      <LandingHeaderSkeleton />
      <main className="flex flex-col items-center pt-20">
        <LandingHeroSkeleton />
        <LandingAboutSkeleton />
        <LandingFeatureSkeleton />
        <LandingArticleSkeleton />
        <LandingWorkflowSkeleton />
      </main>
      <LandingFooterSkeleton />
    </div>
  );
}

function LandingHeaderSkeleton() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-warm-canvas)_90%,transparent)] shadow-[var(--shadow-subtle)] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1100px] items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <nav className="hidden items-center gap-6 lg:flex" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20 rounded-full" />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-11 w-14 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="hidden h-11 w-28 rounded-full lg:block" />
          <Skeleton className="h-11 w-11 rounded-full lg:hidden" />
        </div>
      </div>
    </header>
  );
}

function LandingHeroSkeleton() {
  return (
    <section
      className="w-full overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-teal-surface)_70%,var(--color-warm-canvas))_0%,var(--color-warm-canvas)_100%)] px-6 py-20 lg:py-32"
      data-home-skeleton-section="hero"
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-12 lg:flex-row">
        <div className="z-10 flex flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <Skeleton className="h-28 w-full max-w-2xl rounded-3xl sm:h-32 lg:h-40" />
          <div className="mx-auto mt-2 grid w-full max-w-xl gap-3 lg:mx-0">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-11/12 rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-12 w-44 rounded-full" />
        </div>
        <div className="w-full flex-1">
          <div className="mx-auto max-w-lg">
            <Skeleton className="aspect-square w-full rounded-3xl shadow-[var(--shadow-elevated)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingAboutSkeleton() {
  return (
    <section
      className="w-full scroll-mt-24 bg-[var(--color-card)] px-6 py-20 lg:py-32"
      data-home-skeleton-section="about"
    >
      <LandingSectionIntroSkeleton />
      <div className="mx-auto grid w-full max-w-[1100px] items-center gap-12 lg:grid-cols-[5fr_7fr]">
        <Skeleton className="aspect-square w-full rounded-3xl shadow-[var(--shadow-elevated)]" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <LandingInfoCardSkeleton key={index} align="left" />
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFeatureSkeleton() {
  return (
    <section
      className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-6 py-20 lg:py-32"
      data-home-skeleton-section="features"
    >
      <LandingSectionIntroSkeleton />
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <LandingInfoCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function LandingArticleSkeleton() {
  return (
    <section
      className="w-full scroll-mt-24 bg-[var(--color-card)] px-6 py-20 lg:py-32"
      data-home-skeleton-section="articles"
    >
      <LandingSectionIntroSkeleton />
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex overflow-hidden rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)]"
          >
            <article className="flex w-full flex-col">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="flex flex-1 flex-col p-6">
                <Skeleton className="mb-3 h-6 w-4/5 rounded-full" />
                <div className="mb-5 grid flex-1 gap-3">
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-11/12 rounded-full" />
                  <Skeleton className="h-4 w-2/3 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
            </article>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex w-full max-w-[1100px] justify-end">
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
    </section>
  );
}

function LandingWorkflowSkeleton() {
  return (
    <section
      className="w-full scroll-mt-24 bg-[var(--color-parchment-card)] px-6 py-20 lg:py-32"
      data-home-skeleton-section="workflow"
    >
      <LandingSectionIntroSkeleton />
      <div className="relative mx-auto w-full max-w-4xl px-4">
        <div className="absolute left-12 right-12 top-12 z-0 hidden h-1 rounded-full bg-[var(--color-stone-surface)] md:block" />
        <div className="relative z-10 grid gap-10 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <Skeleton className="mb-4 h-24 w-24 rounded-full" />
              <Skeleton className="mb-2 h-6 w-36 rounded-full" />
              <div className="grid w-full gap-3">
                <Skeleton className="mx-auto h-4 w-full max-w-[220px] rounded-full" />
                <Skeleton className="mx-auto h-4 w-4/5 max-w-[180px] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooterSkeleton() {
  return (
    <footer className="w-full bg-[var(--color-card)] px-6 pb-10 pt-20 text-[var(--color-graphite)]" data-home-skeleton-section="footer">
      <div className="mx-auto mb-10 flex w-full max-w-[1100px] flex-col items-start justify-between gap-10 border-b border-[var(--color-stone-surface)] pb-10 md:flex-row">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="mx-auto h-4 w-72 max-w-full rounded-full" />
    </footer>
  );
}

function LandingSectionIntroSkeleton() {
  return (
    <div className="mx-auto mb-16 w-full max-w-[1100px] text-center">
      <Skeleton className="mx-auto h-12 w-full max-w-xl rounded-3xl lg:h-14" />
      <div className="mx-auto mt-4 grid max-w-3xl gap-3">
        <Skeleton className="mx-auto h-4 w-full rounded-full" />
        <Skeleton className="mx-auto h-4 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

function LandingInfoCardSkeleton({ align = "center" }: { align?: "center" | "left" }) {
  const left = align === "left";

  return (
    <div
      className={
        left
          ? "flex flex-col items-center gap-6 rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-8 text-center shadow-[var(--shadow-elevated)] lg:flex-row lg:items-start lg:text-left"
          : "flex flex-col items-center rounded-3xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-elevated)]"
      }
    >
      <LandingIconSkeleton className={left ? "shrink-0" : "mb-6"} />
      <div className="w-full">
        <Skeleton className={left ? "mb-2 h-4 w-32 rounded-full" : "mx-auto mb-4 h-6 w-40 rounded-full"} />
        <div className="grid gap-3">
          <Skeleton className={left ? "h-4 w-full rounded-full" : "mx-auto h-4 w-full rounded-full"} />
          <Skeleton className={left ? "h-4 w-4/5 rounded-full" : "mx-auto h-4 w-4/5 rounded-full"} />
        </div>
      </div>
    </div>
  );
}

function LandingIconSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-teal-surface)] ${className}`}>
      <Skeleton className="h-8 w-8 rounded-full bg-[var(--color-teal-muted)]" />
    </div>
  );
}

export function ChatWindowSkeleton() {
  return (
    <div className="min-h-[360px] rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4">
      <div className="grid gap-3">
        <Skeleton className="ml-auto h-16 w-[68%]" />
        <Skeleton className="mr-auto h-20 w-[74%]" />
        <Skeleton className="ml-auto h-14 w-[52%]" />
      </div>
    </div>
  );
}

export function AssistantBubbleSkeleton() {
  return (
    <div className="mr-auto grid w-[78%] max-w-[78%] gap-2 rounded-[10px] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-subtle)]">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DoctorLookupSkeleton() {
  return (
    <div className="grid gap-4 rounded-[10px] bg-[var(--color-card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-10 w-40 rounded-full" />
    </div>
  );
}

export function RagAnswerSkeleton() {
  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DocumentUploadSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="min-h-[140px] w-full rounded-lg" />
    </div>
  );
}

export function BlockchainRetrySkeleton() {
  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <section className="min-h-[400px] rounded-[10px] bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)]">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-8 grid gap-6 pl-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 rounded-[10px] border border-[var(--color-stone-surface)] p-5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-3 h-5 w-52 max-w-full" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
