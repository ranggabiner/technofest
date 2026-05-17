import { DashboardCard } from "@/app/_components/portal-layout";
import { getCurrentRole } from "@/lib/auth/session";
import { loadAdminInvitationsState } from "@/lib/admin/service";
import { getDictionary } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";

import { AdminInvitationList } from "./admin-invitations-list";
import { AddAdminForm } from "./add-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminAddAdminPage() {
  const copy = await getDictionary();
  const locale = await getLocale();
  const role = await getCurrentRole();

  if (role?.kind !== "medical_admin" || role.adminLevel !== "superadmin" || !role.adminId) {
    return (
      <section className="grid gap-8" data-admin-add-admin-page="forbidden">
        <header className="border-b border-[var(--color-stone-surface)] pb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
            {copy.admin.nav.addAdmin}
          </p>
          <h1 className="text-[36px] font-semibold leading-[1.1] text-[var(--color-midnight)] md:text-[44px]">
            {copy.admin.addAdmin.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
            {copy.admin.addAdmin.superadminRequired}
          </p>
        </header>

        <DashboardCard className="p-6 md:p-8">
          <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
            {copy.admin.addAdmin.superadminRequired}
          </p>
        </DashboardCard>
      </section>
    );
  }

  let invitationState: Awaited<ReturnType<typeof loadAdminInvitationsState>> | null = null;
  let invitationError = false;

  try {
    invitationState = await loadAdminInvitationsState(role.adminId);
  } catch {
    invitationError = true;
  }

  return (
    <section className="grid gap-8" data-admin-add-admin-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ash)]">
          {copy.admin.doctors.title}
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.1] text-[var(--color-midnight)] md:text-[44px]">
          {copy.admin.addAdmin.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.admin.addAdmin.cardTitle}
        </p>
      </header>

      <DashboardCard className="w-full max-w-xl p-6 md:p-8">
        <h2 className="mb-5 text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
          {copy.admin.addAdmin.cardTitle}
        </h2>
        <AddAdminForm copy={copy.admin.addAdmin} />
      </DashboardCard>

      <DashboardCard className="w-full p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-[23px] font-semibold leading-tight text-[var(--color-midnight)]">
            {copy.admin.addAdmin.listTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ash)]">
            {copy.admin.addAdmin.listDescription}
          </p>
        </div>

        {invitationError || !invitationState ? (
          <p className="rounded-[10px] bg-[var(--color-error-surface)] p-4 text-sm text-[var(--color-error-red)]">
            {copy.admin.addAdmin.fetchError}
          </p>
        ) : (
          <AdminInvitationList
            copy={copy.admin.addAdmin}
            invitations={invitationState.invitations}
            locale={locale}
          />
        )}
      </DashboardCard>
    </section>
  );
}
