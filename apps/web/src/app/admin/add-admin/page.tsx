import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { adminNavItems } from "@/lib/admin/navigation";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import { AddAdminForm } from "./add-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminAddAdminPage() {
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "medical_admin") {
    return (
      <AppShell title={copy.admin.addAdmin.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }

  return (
    <AppShell title={copy.admin.addAdmin.title} nav={adminNavItems(copy, "addAdmin")}>
      <div className="grid min-h-[calc(100vh-12rem)] place-items-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>{copy.admin.addAdmin.cardTitle}</CardTitle>
          </CardHeader>
          <AddAdminForm copy={copy.admin.addAdmin} />
        </Card>
      </div>
    </AppShell>
  );
}
