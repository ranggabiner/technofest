import { DashboardCard } from "@/app/_components/portal-layout";
import { PortalTransitionLink } from "@/app/_components/portal-navigation";
import { AdminDoctorTable } from "@/app/admin/_components/admin-doctor-table";
import { BlockchainRetryButton } from "@/components/blockchain-retry-button";
import { Button } from "@/components/ui/button";
import { loadAdminDashboardState } from "@/lib/admin/service";
import { formatDateTime } from "@/lib/i18n/format";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const state = await loadAdminDashboardState();

  return (
    <section className="grid gap-8" data-admin-dashboard-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
          {copy.admin.doctors.title}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
          {copy.admin.dashboard.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.admin.doctors.queueDescription}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={copy.admin.dashboard.pendingVerification} value={state.stats.pending} />
        <StatCard label={copy.admin.dashboard.totalApproved} value={state.stats.approved} />
        <StatCard label={copy.admin.dashboard.totalRejected} value={state.stats.rejected} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <DashboardCard className="p-6 md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.admin.dashboard.priorityQueue}
            </h2>
            <Button asChild variant="ghost" className="w-full rounded-[10px] sm:w-auto">
              <PortalTransitionLink href="/admin/approval">{copy.admin.dashboard.viewAll}</PortalTransitionLink>
            </Button>
          </div>
          <AdminDoctorTable
            doctors={state.priorityQueue}
            copy={copy}
            locale={locale}
            returnPath="/admin/dashboard"
            emptyMessage={copy.admin.dashboard.noPendingQueue}
          />
        </DashboardCard>

        <DashboardCard className="p-6 md:min-h-[420px] md:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold leading-tight text-[var(--color-midnight)]">
              {copy.admin.dashboard.auditTrail}
            </h2>
          </div>
          <div className="grid gap-3">
            <BlockchainRetryButton copy={copy.blockchainRetry} />
          </div>
          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {state.auditTrail.length === 0 ? (
              <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
                {copy.admin.dashboard.noAuditTrail}
              </p>
            ) : (
              state.auditTrail.map((audit) => (
                <div key={audit.logId} className="rounded-[10px] border border-[var(--color-stone-surface)] p-4">
                  <p className="font-semibold text-[var(--color-midnight)]">
                    {describeDashboardAudit(copy, audit.action, audit.doctorName)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-ash)]">{formatDateTime(audit.createdAt, locale)}</p>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </section>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <DashboardCard className="min-h-[128px] p-6">
      <p className="text-sm font-medium text-[var(--color-ash)]">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-[var(--color-midnight)]">{value.toLocaleString("id-ID")}</p>
    </DashboardCard>
  );
}

function describeDashboardAudit(copy: Awaited<ReturnType<typeof getDictionary>>, action: string, doctorName: string | null) {
  const name = doctorName ?? copy.common.noDoctor;
  if (action === "admin_doctor_approved") return copy.admin.dashboard.auditApproved.replace("{doctor}", name);
  if (action === "admin_doctor_rejected") return copy.admin.dashboard.auditRejected.replace("{doctor}", name);
  if (action === "doctor_kyc_email_notification_failed") return copy.admin.dashboard.auditEmailFailed.replace("{doctor}", name);
  return action;
}
