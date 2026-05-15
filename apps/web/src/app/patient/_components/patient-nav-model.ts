import { Grid2X2, History, MessageCircle, Stethoscope, type LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";

export type PatientNavItem = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
};

export function patientNavItems(activePath: string, copy: Dictionary): PatientNavItem[] {
  const items = [
    { href: "/patient", label: copy.patient.nav.dashboard, icon: Grid2X2 },
    { href: "/patient/chat", label: copy.patient.nav.journal, icon: MessageCircle },
    { href: "/patient/access", label: copy.patient.nav.access, icon: Stethoscope },
    { href: "/patient/access-history", label: copy.patient.nav.history, icon: History },
  ];

  return items.map((item) => ({
    ...item,
    active: isActivePatientPath(activePath, item.href),
  }));
}

function isActivePatientPath(activePath: string, href: string) {
  if (href === "/patient") return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}
