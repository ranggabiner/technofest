import { BookOpenText, ClipboardCheck, Grid2X2, type LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";

export type DoctorNavItem = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
};

export function doctorNavItems(activePath: string, copy: Dictionary): DoctorNavItem[] {
  const items = [
    { href: "/doctor", label: copy.doctor.nav.dashboard, icon: Grid2X2 },
    {
      href: "/doctor/medical-record-library",
      label: copy.doctor.nav.medicalRecordLibrary,
      icon: BookOpenText,
    },
  ];

  return items.map((item) => ({
    ...item,
    active: isActiveDoctorPath(activePath, item.href),
  }));
}

export function doctorStatusNavItems(activePath: string, copy: Dictionary): DoctorNavItem[] {
  const items = [
    { href: "/doctor/status", label: copy.doctor.status.title, icon: ClipboardCheck },
  ];

  return items.map((item) => ({
    ...item,
    active: isActiveDoctorPath(activePath, item.href),
  }));
}

function isActiveDoctorPath(activePath: string, href: string) {
  if (href === "/doctor") {
    return activePath === href || activePath.startsWith("/doctor/grants/");
  }
  return activePath === href || activePath.startsWith(`${href}/`);
}
