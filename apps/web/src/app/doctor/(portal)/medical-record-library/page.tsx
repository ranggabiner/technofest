import { DashboardCard } from "@/app/_components/portal-layout";
import { EmptyState } from "@/components/state-panel";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorMedicalRecordLibraryPage() {
  const copy = await getDictionary();

  return (
    <section className="grid gap-8" data-doctor-library-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
          {copy.doctor.dashboard.sidebarSection}
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.1] text-[var(--color-midnight)] md:text-[44px]">
          {copy.doctor.library.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.doctor.library.description}
        </p>
      </header>

      <DashboardCard className="grid gap-4 p-6 md:p-8">
        <div className="grid gap-2">
          <h3 className="font-semibold text-[var(--color-midnight)]">{copy.doctor.library.emptyTitle}</h3>
          <EmptyState message={copy.doctor.library.emptyDescription} />
        </div>
      </DashboardCard>
    </section>
  );
}
