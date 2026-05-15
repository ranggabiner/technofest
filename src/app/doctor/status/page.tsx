import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DoctorStatusPage() {
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title="Status Dokter" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (role.status === "approved") redirect("/doctor");

  return (
    <AppShell
      title="Status Dokter"
      nav={[
        { href: "/doctor/status", label: "Status" },
        { href: "/doctor/onboarding", label: "KYC Dokter" },
      ]}
    >
      <Card>
        <CardHeader>
          <div className="mb-2">
            <StatusBadge tone={role.status}>{role.status === "pending" ? "Menunggu" : "Ditolak"}</StatusBadge>
          </div>
          <CardTitle>
            {role.status === "pending" ? "Akun dokter sedang ditinjau" : "Akun dokter ditolak"}
          </CardTitle>
          <CardDescription>
            {role.status === "pending"
              ? "Admin medis akan memeriksa STR, SIP, dan KTP secara manual sebelum memberi akses dokter."
              : role.rejectionReason ?? "Alasan penolakan tidak tersedia."}
          </CardDescription>
        </CardHeader>
        <Button asChild variant="secondary">
          <Link href="/doctor/onboarding">Perbarui dokumen KYC</Link>
        </Button>
      </Card>
    </AppShell>
  );
}
