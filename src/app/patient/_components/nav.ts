export function patientNav(active: string) {
  return [
    { href: "/patient", label: "Dashboard", active: active === "/patient" },
    { href: "/patient/chat", label: "Jurnal AI", active: active === "/patient/chat" },
    { href: "/patient/access", label: "Akses Dokter", active: active === "/patient/access" },
    {
      href: "/patient/access-history",
      label: "Riwayat Akses",
      active: active === "/patient/access-history",
    },
  ];
}
