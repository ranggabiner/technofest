import type { ReactNode } from "react";

import { DoctorLayout } from "@/app/doctor/_components/doctor-layout";
import { requireRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DoctorPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const copy = await getDictionary();
  const role = await requireRole();

  return (
    <DoctorLayout copy={copy} role={role}>
      {children}
    </DoctorLayout>
  );
}
