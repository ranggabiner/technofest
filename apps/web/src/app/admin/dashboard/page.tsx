import Link from "next/link";

import { AdminDoctorTable } from "@/app/admin/_components/admin-doctor-table";
import { AppShell } from "@/components/app-shell";
import { BlockchainRetryButton } from "@/components/blockchain-retry-button";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminNavItems } from "@/lib/admin/navigation";
import { loadAdminDashboardState } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/i18n/format";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "medical_admin") {
    return (
      <AppShell title={copy.admin.dashboard.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }

  const state = await loadAdminDashboardState();

  return (
    <AppShell title={copy.admin.dashboard.title} nav={adminNavItems(copy, "dashboard")}>
      <div className="grid gap-5">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label={copy.admin.dashboard.pendingVerification} value={state.stats.pending} />
          <StatCard label={copy.admin.dashboard.totalApproved} value={state.stats.approved} />
          <StatCard label={copy.admin.dashboard.totalRejected} value={state.stats.rejected} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>{copy.admin.dashboard.priorityQueue}</CardTitle>
              <Button asChild variant="ghost" className="rounded-[10px]">
                <Link href="/admin/approval">{copy.admin.dashboard.viewAll}</Link>
              </Button>
            </CardHeader>
            <AdminDoctorTable
              doctors={state.priorityQueue}
              copy={copy}
              locale={locale}
              returnPath="/admin/dashboard"
              emptyMessage={copy.admin.dashboard.noPendingQueue}
            />
          </Card>

          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle>{copy.admin.dashboard.auditTrail}</CardTitle>
            </CardHeader>
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
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="min-h-[128px]">
      <p className="text-sm font-medium text-[var(--color-ash)]">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-[var(--color-midnight)]">{value.toLocaleString("id-ID")}</p>
    </Card>
  );
}

function describeDashboardAudit(copy: Awaited<ReturnType<typeof getDictionary>>, action: string, doctorName: string | null) {
  const name = doctorName ?? copy.common.noDoctor;
  if (action === "admin_doctor_approved") return copy.admin.dashboard.auditApproved.replace("{doctor}", name);
  if (action === "admin_doctor_rejected") return copy.admin.dashboard.auditRejected.replace("{doctor}", name);
  if (action === "doctor_kyc_email_notification_failed") return copy.admin.dashboard.auditEmailFailed.replace("{doctor}", name);
  return action;
}
