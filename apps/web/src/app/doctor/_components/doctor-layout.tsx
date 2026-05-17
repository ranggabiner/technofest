import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  PortalForbiddenLayout,
  PortalLayout,
} from "@/app/_components/portal-layout";
import { roleEntryPath, type ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { DoctorDesktopNavigation, DoctorMobileNavigation, DoctorNavigationContent } from "./doctor-navigation";
import { doctorNavigationTargets } from "./doctor-navigation-transition-model";

export function DoctorLayout({
  children,
  copy,
  role,
}: {
  children: ReactNode;
  copy: Dictionary;
  role: ResolvedRole;
}) {
  if (role.kind !== "doctor") {
    return <PortalForbiddenLayout title={copy.doctor.dashboard.title} role={role} />;
  }

  if (!role.canAccessDoctorFeatures || !role.doctorId) {
    redirect(roleEntryPath(role));
  }

  return (
    <PortalLayout
      copy={copy}
      desktopNavigation={<DoctorDesktopNavigation copy={copy} />}
      mobileNavigation={<DoctorMobileNavigation copy={copy} />}
      navigationTargets={doctorNavigationTargets}
      profileHref="/doctor/profile"
      profileLabel={copy.doctor.dashboard.editProfile}
      role="doctor"
      sectionLabel={copy.doctor.dashboard.sidebarSection}
      title={copy.doctor.dashboard.title}
      userEmail={role.email}
      userName={role.fullName}
    >
      <DoctorNavigationContent>{children}</DoctorNavigationContent>
    </PortalLayout>
  );
}
