import { AdminDashboardContent } from "@/app/admin/_components/admin-dashboard-content";
import { loadAdminDashboardState } from "@/lib/admin/service";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const state = await loadAdminDashboardState();

  return (
    <AdminDashboardContent
      copy={copy}
      locale={locale}
      returnPath="/admin/dashboard"
      state={state}
      viewAllHref="/admin/approval"
    />
  );
}
