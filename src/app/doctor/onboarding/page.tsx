import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/session";

import { submitDoctorKycAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DoctorOnboardingPage() {
  const role = await requireRole();
  if (role.kind !== "doctor") {
    return (
      <AppShell title="Verifikasi Dokter" nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }
  if (role.status === "approved") redirect("/doctor");

  return (
    <AppShell
      title="Verifikasi Dokter"
      nav={[
        { href: "/doctor/status", label: "Status" },
        { href: "/doctor/onboarding", label: "KYC Dokter" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Lengkapi KYC dokter</CardTitle>
          <CardDescription>
            Unggah STR, SIP, dan KTP. Format PDF/JPG/PNG, maksimal 10MB per dokumen.
          </CardDescription>
        </CardHeader>
        <form action={submitDoctorKycAction} className="grid gap-5">
          <Field>
            <Label htmlFor="full_name">Nama lengkap</Label>
            <Input id="full_name" name="full_name" defaultValue={role.fullName} required />
          </Field>
          <Field>
            <Label htmlFor="specialization">Spesialisasi</Label>
            <Input id="specialization" name="specialization" required />
          </Field>
          <Field>
            <Label htmlFor="phone_number">Nomor telepon</Label>
            <Input id="phone_number" name="phone_number" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <Label htmlFor="str">STR</Label>
              <Input id="str" name="str" type="file" accept="application/pdf,image/jpeg,image/png" required />
            </Field>
            <Field>
              <Label htmlFor="sip">SIP</Label>
              <Input id="sip" name="sip" type="file" accept="application/pdf,image/jpeg,image/png" required />
            </Field>
            <Field>
              <Label htmlFor="ktp">KTP</Label>
              <Input id="ktp" name="ktp" type="file" accept="application/pdf,image/jpeg,image/png" required />
            </Field>
          </div>
          <Button type="submit">Kirim untuk verifikasi</Button>
        </form>
      </Card>
    </AppShell>
  );
}
