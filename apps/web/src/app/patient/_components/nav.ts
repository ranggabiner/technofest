import type { Dictionary } from "@/lib/i18n/dictionary";

export function patientNav(active: string, copy: Dictionary) {
  return [
    { href: "/patient", label: copy.patient.nav.dashboard, active: active === "/patient" },
    { href: "/patient/chat", label: copy.patient.nav.journal, active: active === "/patient/chat" },
    { href: "/patient/access", label: copy.patient.nav.access, active: active === "/patient/access" },
    {
      href: "/patient/access-history",
      label: copy.patient.nav.history,
      active: active === "/patient/access-history",
    },
  ];
}
