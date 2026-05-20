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
          className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-4 w-52 max-w-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-[10px] sm:h-10 sm:w-28" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <div data-skeleton-mobile-cards className="grid gap-3 md:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-subtle)]"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 max-w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <Skeleton className="h-11 w-full rounded-[10px]" />
          </div>
        ))}
      </div>
      <div data-skeleton-desktop-table className="hidden overflow-x-auto md:block">
        <div className="min-w-[680px] divide-y divide-[var(--color-stone-surface)]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-4 px-3 pb-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-center gap-4 px-3 py-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-24 rounded-[10px]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function LoadingForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 rounded-[10px] bg-[var(--color-stone-surface)] p-4", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-full sm:w-36" />
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton position="fixed" />
      <main className="flex min-h-screen flex-1 flex-col">
        <section className="hidden flex-1 items-center justify-center px-6 pt-16 md:flex">
          <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 items-center gap-[120px]">
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
            <Card className="mx-auto grid w-full max-w-md gap-5 p-5 sm:p-8">
            <Skeleton className="mx-auto h-12 w-56" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full" />
              <Skeleton className="min-h-[144px] w-full rounded-xl sm:min-h-[168px]" />
              <Skeleton className="min-h-[144px] w-full rounded-xl sm:min-h-[168px]" />
              <Skeleton className="mx-auto h-4 w-64 max-w-full" />
          </Card>
        </div>
        </section>
        <section className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-24 sm:px-6 sm:pt-32 md:hidden">
          <div className="mx-auto w-full max-w-[420px] text-center">
            <Skeleton className="mx-auto mb-4 h-12 w-full max-w-[320px]" />
            <div className="mx-auto mb-8 grid max-w-[340px] gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mx-auto h-4 w-5/6" />
            </div>
            <div className="space-y-5 text-left">
              <Skeleton className="min-h-[144px] w-full rounded-xl sm:min-h-[168px]" />
              <Skeleton className="min-h-[144px] w-full rounded-xl sm:min-h-[168px]" />
            </div>
            <Skeleton className="mx-auto mt-6 h-4 w-full max-w-[320px]" />
          </div>
        </section>
      </main>
    </div>
  );
}

export function RoleSelectionSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]">
      <HeaderSkeleton />
      <main className="flex min-h-screen flex-1 items-center justify-center px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32">
        <Card className="relative w-full max-w-[640px] overflow-hidden p-5 sm:p-8 md:p-20">
          <div className="mx-auto mb-10 max-w-[480px] space-y-4 sm:mb-16">
            <Skeleton className="mx-auto h-10 w-72 max-w-full sm:h-12 sm:w-80" />
            <Skeleton className="mx-auto h-4 w-full" />
            <Skeleton className="mx-auto h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="min-h-[160px] rounded-xl sm:min-h-[180px]" />
            <Skeleton className="min-h-[160px] rounded-xl sm:min-h-[180px]" />
          </div>
          <div className="mt-10 flex sm:mt-12 sm:justify-end">
            <Skeleton className="h-11 w-full min-w-40 rounded-full sm:w-40" />
          </div>
        </Card>
      </main>
    </div>
  );
}

export function ArticlesPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]" data-loading-pattern="articles">
      <HeaderSkeleton position="fixed" />
      <main className="mx-auto min-h-screen w-full max-w-[1100px] px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <section className="mb-10 grid gap-4">
          <Skeleton className="h-12 w-full max-w-[520px] sm:h-14" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </section>
        <Skeleton className="mb-8 h-14 w-full rounded-xl" />
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-6">
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="grid content-center gap-3">
                <Skeleton className="h-8 w-full max-w-[520px]" />
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-4/5 max-w-xl" />
                <Skeleton className="mt-2 h-5 w-32" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]" data-loading-pattern="article-detail">
      <HeaderSkeleton position="fixed" />
      <main className="mx-auto min-h-screen w-full max-w-[860px] px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <div className="mb-8 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-3" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-14 w-full max-w-[720px] sm:h-16" />
        <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-8 aspect-[16/9] w-full rounded-xl" />
        <article className="mt-10 grid gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn("h-4", index % 4 === 0 ? "w-full" : index % 4 === 1 ? "w-11/12" : index % 4 === 2 ? "w-4/5" : "w-2/3")}
            />
          ))}
        </article>
      </main>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div
      className="min-h-screen bg-[var(--color-warm-canvas)] md:grid md:grid-cols-[260px_1fr]"
      data-loading-pattern="profile-page"
    >
      <aside className="border-b border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 md:min-h-screen md:border-b-0 md:border-r">
        <Skeleton className="mb-4 size-11 rounded-full" />
        <nav className="flex gap-2 overflow-hidden md:grid">
          <Skeleton className="h-11 w-36 rounded-lg md:w-full" />
          <Skeleton className="h-11 w-40 rounded-lg md:w-full" />
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-[980px] px-5 py-8 md:px-8">
        <Card className="grid gap-6 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Skeleton className="size-24 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-3">
              <Skeleton className="h-9 w-full max-w-[360px]" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          </div>
          <LoadingForm fields={5} />
        </Card>
      </main>
    </div>
  );
}

export function SuperAdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]" data-loading-pattern="superadmin-dashboard">
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
          <AdminDashboardSkeleton />
        </div>
      </main>
    </div>
  );
}

export function OnboardingPageSkeleton({
  role = "patient",
  variant = "form",
}: {
  role?: "patient" | "doctor";
  variant?: "intro" | "form" | "documents" | "review";
}) {
  if (role === "doctor") return <DoctorOnboardingSkeleton variant={variant} />;
  return <PatientOnboardingSkeleton variant={variant} />;
}

function PatientOnboardingSkeleton({ variant }: { variant: "intro" | "form" | "documents" | "review" }) {
  if (variant === "intro") {
    return (
      <div
        className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]"
        data-onboarding-skeleton="patient-intro"
      >
        <HeaderSkeleton />
        <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
          <Card className="w-full max-w-2xl p-5 sm:p-8 md:p-12">
            <PatientProgressSkeleton variant="compact" />
            <OnboardingHeadingSkeleton />
            <LoadingForm fields={3} className="mt-10 sm:mt-20" />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]"
      data-onboarding-skeleton={`patient-${variant}`}
    >
      <HeaderSkeleton />
      <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto w-full max-w-[720px]">
          <header className="mb-10 text-center sm:mb-20">
            <PatientProgressSkeleton variant="bar" />
            <OnboardingHeadingSkeleton />
          </header>
          <Card className="relative grid gap-6 overflow-hidden p-5 sm:p-6 md:p-12">
            <div className="absolute left-0 top-0 h-1 w-full bg-[var(--color-stone-surface)]" />
            <LoadingForm fields={variant === "review" ? 3 : 5} />
          </Card>
        </div>
      </main>
    </div>
  );
}

function DoctorOnboardingSkeleton({ variant }: { variant: "intro" | "form" | "documents" | "review" }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)]"
      data-onboarding-skeleton={`doctor-${variant}`}
    >
      <HeaderSkeleton />
      <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-1 flex-col px-4 py-16 sm:px-6 sm:py-20">
        <DoctorProgressSkeleton />
        <div className={cn("mx-auto w-full", variant === "review" ? "max-w-3xl" : "max-w-2xl")}>
          {variant !== "form" ? (
            <header className="mb-8 space-y-4 text-center sm:mb-12">
              <Skeleton className="mx-auto h-10 w-full max-w-[420px] sm:h-12" />
              <Skeleton className="mx-auto h-4 w-full max-w-lg" />
              <Skeleton className="mx-auto h-4 w-4/5 max-w-md" />
            </header>
          ) : null}
          <Card className={cn("grid gap-6 p-5 sm:p-8", variant === "review" && "md:p-12")}>
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
              <LoadingForm fields={5} />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function PatientProgressSkeleton({ variant }: { variant: "compact" | "bar" }) {
  if (variant === "bar") {
    return (
      <div className="relative mb-8 flex items-start justify-between before:absolute before:left-0 before:top-4 before:z-0 before:h-px before:w-full before:bg-[var(--color-stone-surface)] sm:mb-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="relative z-10 flex min-w-16 flex-col items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-10 flex items-start justify-center gap-2 px-1 sm:mb-20 sm:gap-4 sm:px-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="contents">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:min-w-14">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
          {index < 2 ? <Skeleton className="mt-4 h-px w-8 shrink sm:w-12" /> : null}
        </div>
      ))}
    </div>
  );
}

function DoctorProgressSkeleton() {
  return (
    <div className="mx-auto mb-12 flex w-full max-w-2xl items-start justify-center sm:mb-28">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="contents">
          <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 bg-[var(--color-warm-canvas)] px-1 sm:min-w-16 sm:px-2">
            <Skeleton className="size-9 rounded-full sm:size-10" />
            <Skeleton className="h-3 w-14" />
          </div>
          {index < 2 ? <Skeleton className="mt-5 h-0.5 min-w-6 flex-1 sm:min-w-12" /> : null}
        </div>
      ))}
    </div>
  );
}

function OnboardingHeadingSkeleton() {
  return (
    <div className="text-center">
      <Skeleton className="mx-auto h-10 w-full max-w-[420px] sm:h-12" />
      <div className="mx-auto mt-4 grid max-w-[560px] gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mx-auto h-4 w-4/5" />
      </div>
    </div>
  );
}

export function PatientDashboardSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-dashboard">
      <section className="flex flex-col gap-8 border-b border-[var(--color-stone-surface)] pb-4 sm:gap-12">
        <Skeleton className="mb-4 h-5 w-28" />
        <Skeleton className="h-12 w-full max-w-[620px]" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <Skeleton className="mt-6 h-12 w-full rounded-full sm:w-40" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,620px)]">
        <LoadingCard lines={3} />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-9 w-64 max-w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <TimelineSkeleton />
          <LoadingCard className="flex flex-col md:min-h-[400px]" lines={4} />
        </div>
      </section>
    </div>
  );
}

export function PatientChatSkeleton() {
  return (
    <div
      className="h-screen h-[100dvh] overflow-hidden bg-[var(--color-warm-canvas)]"
      data-loading-pattern="patient-chat"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="grid min-h-0 max-h-[min(220px,34dvh)] shrink-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden border-b border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-stone-surface)_55%,var(--color-warm-canvas))] p-3 sm:p-4 lg:flex lg:h-full lg:max-h-none lg:flex-col lg:gap-6 lg:border-b-0 lg:border-r lg:p-6">
          <div data-chat-header="navigation-group" className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="min-h-0 overflow-hidden">
            <div className="flex min-w-0 gap-2 overflow-hidden lg:grid lg:gap-2">
              <Skeleton className="h-12 w-[min(220px,70vw)] shrink-0 rounded-xl lg:w-full" />
              <Skeleton className="h-12 w-[min(220px,70vw)] shrink-0 rounded-xl lg:w-full" />
            </div>
          </div>
        </aside>
        <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden px-3 py-5 sm:px-5 sm:py-7 md:px-10 md:py-8">
          <div className="mx-auto grid min-h-0 w-full max-w-[720px] flex-1 place-content-center gap-6 text-center sm:gap-8 md:gap-10">
            <div className="grid justify-items-center gap-3">
              <Skeleton className="h-10 w-64 max-w-full sm:h-12 sm:w-72 md:h-16 md:w-96" />
            </div>
            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <Skeleton className="h-[128px] rounded-xl sm:h-[160px] md:h-[190px]" />
              <Skeleton className="h-[128px] rounded-xl sm:h-[160px] md:h-[190px]" />
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
    <div className="grid gap-8 sm:gap-12" data-loading-pattern="patient-health-history-overview">
      <section>
        <Skeleton className="h-12 w-full max-w-[520px] sm:h-14 md:h-16" />
        <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
      </section>
      <section className="grid gap-8 lg:grid-cols-2">
        <HealthHistoryOverviewCardSkeleton />
        <HealthHistoryOverviewCardSkeleton />
      </section>
    </div>
  );
}

export function PatientHealthHistoryRecordsSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-health-history-records">
      <HealthHistoryDetailHeaderSkeleton />
      <FilterPillsSkeleton count={7} />
      <div
        data-skeleton-record-timeline
        className="relative grid gap-6 pl-5 before:absolute before:bottom-0 before:left-[7px] before:top-2 before:border-l-2 before:border-[var(--color-stone-surface)] sm:gap-8 sm:pl-7 sm:before:left-[9px]"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="relative">
            <Skeleton className="absolute -left-[20px] top-1 size-5 rounded-full sm:-left-[27px]" />
            <Skeleton className="mb-4 h-5 w-36" />
            <Card className="grid gap-5 rounded-[14px] p-4 sm:p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-7 w-full max-w-[420px]" />
                <Skeleton className="h-4 w-full max-w-[300px]" />
              </div>
              <Skeleton className="h-20 w-full rounded-[10px]" />
              <BlockchainRetrySkeleton />
            </Card>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PatientHealthHistoryJournalSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="patient-health-history-journal">
      <HealthHistoryDetailHeaderSkeleton action />
      <FilterPillsSkeleton count={3} />
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

export const PatientHealthJournalSkeleton = PatientHealthHistoryJournalSkeleton;

function HealthHistoryOverviewCardSkeleton() {
  return (
    <Card className="grid content-between gap-8 rounded-[16px] p-5 sm:p-8 md:min-h-[375px] md:p-9">
      <div>
        <Skeleton className="mb-8 size-14 rounded-[10px] sm:mb-10 sm:size-16" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <div className="mt-6 grid max-w-xl gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-full sm:w-48" />
    </Card>
  );
}

function HealthHistoryDetailHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <header className="border-b border-[var(--color-stone-surface)] pb-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-3" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-3" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className={cn("grid gap-5", action && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end")}>
        <div>
          {action ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ) : null}
          <Skeleton className="h-11 w-full max-w-[520px] sm:h-12 md:h-14" />
          <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        </div>
        {action ? <Skeleton className="h-12 w-full rounded-full sm:w-40" /> : null}
      </div>
    </header>
  );
}

function FilterPillsSkeleton({ count }: { count: number }) {
  return (
    <nav className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-11 rounded-full", index % 3 === 0 ? "w-24" : index % 3 === 1 ? "w-32" : "w-36")}
        />
      ))}
    </nav>
  );
}

export function DoctorDashboardSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="doctor-dashboard">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <Card className="p-6 md:p-8" data-doctor-profile-skeleton>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid min-w-0 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="size-24 rounded-[10px]" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="rounded-[10px] bg-[var(--color-parchment-card)] p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-9 w-36" />
          </div>
          <Skeleton className="h-11 w-full rounded-[10px] sm:w-36" />
        </div>
      </Card>
      <section>
        <div className="mb-4 grid gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Card className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-10 rounded-[10px]" />
              <Skeleton className="h-10 w-20 rounded-[10px]" />
              <Skeleton className="h-10 w-24 rounded-[10px]" />
              <Skeleton className="h-10 w-28 rounded-[10px]" />
            </div>
          </div>
          <DoctorSessionListSkeleton rows={3} />
        </Card>
      </section>
    </div>
  );
}

export function DoctorGrantPageSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="doctor-grant">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <LoadingCard lines={3} />
      <LoadingCard lines={6} />
      <LoadingCard lines={4} />
      <LoadingCard lines={4} />
      <LoadingCard lines={4} />
    </div>
  );
}

function DoctorSessionListSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <div data-doctor-session-skeleton-cards className="grid gap-3 md:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-subtle)]"
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-44 max-w-full" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-11 w-full rounded-[10px]" />
              <Skeleton className="h-11 w-full rounded-[10px]" />
              <Skeleton className="h-11 w-full rounded-[10px]" />
            </div>
          </div>
        ))}
      </div>
      <div data-doctor-session-skeleton-table className="hidden overflow-x-auto md:block">
        <div className="min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
          <div className="grid grid-cols-[1fr_1.15fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 px-3 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-24" />
            ))}
          </div>
          <div className="grid gap-2">
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1.15fr_1fr_0.8fr_0.8fr_0.8fr] items-center gap-3 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] px-3 py-3 shadow-[var(--shadow-subtle)]"
              >
                <Skeleton className="h-4 w-32" />
                <div className="grid gap-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-[10px]" />
                <Skeleton className="h-9 w-20 rounded-[10px]" />
                <Skeleton className="h-9 w-20 rounded-[10px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function DoctorStatusSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]" data-loading-pattern="doctor-status">
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
          <div className="flex gap-2 overflow-hidden rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-2 md:hidden">
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
          <section className="grid gap-8">
            <div className="border-b border-[var(--color-stone-surface)] pb-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="h-12 w-full max-w-[360px]" />
              <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
            </div>
            <LoadingCard lines={3} />
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <LoadingCard lines={4} />
              <LoadingCard lines={5} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function DoctorMedicalRecordLibrarySkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="doctor-medical-record-library">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <LoadingCard lines={3} />
    </div>
  );
}

export function AdminDoctorDetailSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="admin-doctor-detail">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-36" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <LoadingCard lines={3} />
      <Card className="p-6 md:p-8">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-14 rounded-[10px]" />
          <Skeleton className="h-14 rounded-[10px]" />
          <Skeleton className="h-14 rounded-[10px]" />
        </div>
      </Card>
      <Card className="p-6 md:p-8">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-full" />
          <LoadingForm fields={1} />
        </div>
      </Card>
      <Card className="p-6 md:p-8">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <LoadingList rows={3} />
      </Card>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="admin-dashboard">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingCard lines={1} />
        <LoadingCard lines={1} />
        <LoadingCard lines={1} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <Card className="p-6 md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-11 w-full rounded-[10px] sm:w-28" />
          </div>
          <LoadingTable rows={3} />
        </Card>
        <Card className="p-6 md:min-h-[420px] md:p-8">
          <Skeleton className="mb-5 h-7 w-40" />
          <BlockchainRetrySkeleton />
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-20 rounded-[10px]" />
            <Skeleton className="h-20 rounded-[10px]" />
          </div>
        </Card>
      </section>
    </div>
  );
}

export function AdminApprovalSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="admin-approval">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-36" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <Card className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          <Skeleton className="h-11 w-24 rounded-[10px]" />
          <Skeleton className="h-11 w-28 rounded-[10px]" />
          <Skeleton className="h-11 w-28 rounded-[10px]" />
        </div>
        <LoadingTable rows={6} />
        <div className="mt-5 grid gap-4 lg:flex lg:flex-wrap lg:items-center lg:justify-between">
          <div className="grid gap-2 sm:flex sm:items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-24 rounded-[10px]" />
            <Skeleton className="h-11 w-full rounded-[10px] sm:w-24" />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-14 rounded-[10px]" />
            <Skeleton className="h-11 w-11 rounded-[10px]" />
            <Skeleton className="h-11 w-16 rounded-[10px]" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AdminAddAdminSkeleton() {
  return (
    <div className="grid gap-8" data-loading-pattern="admin-add-admin">
      <section className="border-b border-[var(--color-stone-surface)] pb-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-12 w-full max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </section>
      <Card className="w-full max-w-xl">
        <LoadingForm fields={1} />
      </Card>
      <Card className="w-full">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full rounded-[10px]" />
          <Skeleton className="h-20 w-full rounded-[10px]" />
        </div>
      </Card>
    </div>
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
    <div className="mr-auto grid w-[92%] max-w-[92%] gap-2 rounded-[22px] rounded-bl-lg border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-3.5 py-3 shadow-[var(--shadow-subtle)] sm:w-[82%] sm:max-w-[82%] sm:px-4">
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
