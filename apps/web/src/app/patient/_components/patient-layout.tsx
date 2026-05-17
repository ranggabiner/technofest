import type { ReactNode } from "react";

import {
  DashboardCard,
  PortalForbiddenLayout,
  PortalLayout,
} from "@/app/_components/portal-layout";
import type { ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { PatientDesktopNavigation, PatientMobileNavigation } from "./patient-navigation";
import { PatientNavigationContent } from "./patient-navigation-transition";
import { patientNavigationTargets } from "./patient-navigation-transition-model";

type PatientLayoutProps = {
  children: ReactNode;
  copy: Dictionary;
  header?: ReactNode;
  patientEmail: string;
  patientName: string;
  title: string;
};

export function PatientLayout({
  children,
  copy,
  header,
  patientEmail,
  patientName,
  title,
}: PatientLayoutProps) {
  return (
    <PortalLayout
      copy={copy}
      desktopNavigation={<PatientDesktopNavigation copy={copy} />}
      header={header}
      mobileNavigation={<PatientMobileNavigation copy={copy} />}
      navigationTargets={patientNavigationTargets}
      profileHref="/patient/profile"
      profileLabel={copy.patient.dashboard.editProfile}
      role="patient"
      sectionLabel={copy.patient.dashboard.sidebarSection}
      title={title}
      userEmail={patientEmail}
      userName={patientName}
    >
      <PatientNavigationContent>{children}</PatientNavigationContent>
    </PortalLayout>
  );
}

export async function PatientForbiddenLayout({
  role,
  title,
}: {
  role: ResolvedRole;
  title: string;
}) {
  return <PortalForbiddenLayout title={title} role={role} />;
}

export { DashboardCard };
