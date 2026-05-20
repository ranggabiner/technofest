import { AdminDashboardContent } from "@/app/admin/_components/admin-dashboard-content";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { requireSuperAdminRole } from "@/lib/auth/session";
import { loadAdminDashboardState } from "@/lib/admin/service";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireSuperAdminRole();
  const state = await loadAdminDashboardState();

  return (
    <AdminLayout copy={copy} role={role}>
      <AdminDashboardContent
        auditCardClassName="min-h-[420px]"
        copy={copy}
        locale={locale}
        queueHeaderClassName="flex-row items-center justify-between"
        returnPath="/superadmin/dashboard"
        state={state}
        titleClassName="text-4xl sm:text-4xl"
        viewAllButtonClassName="w-auto"
        viewAllHref="/admin/approval"
      />
    </AdminLayout>
  );
}
