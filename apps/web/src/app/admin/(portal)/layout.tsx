import type { ReactNode } from "react";

import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const copy = await getDictionary();
  const role = await requireRole();

  return (
    <AdminLayout copy={copy} role={role}>
      {children}
    </AdminLayout>
  );
}
