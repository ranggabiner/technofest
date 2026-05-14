import { ShieldCheck, Stethoscope, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { startGoogleOAuthAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-[760px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-[var(--color-teal-muted)]">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="font-serif text-3xl font-medium text-[var(--color-midnight)]">MedProof</p>
            <p className="text-sm text-[var(--color-ash)]">Akses rekam medis demo yang aman dan terbatas.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Masuk ke MedProof</CardTitle>
            <CardDescription>
              Pilih peran untuk memulai sesi Google. Admin medis tetap ditentukan dari allowlist email.
            </CardDescription>
          </CardHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <form action={startGoogleOAuthAction} className="rounded-[10px] bg-[var(--color-parchment-card)] p-5">
              <input type="hidden" name="intent" value="patient" />
              <UserRound className="mb-4 text-[var(--color-teal-deep)]" />
              <h2 className="font-semibold text-[var(--color-midnight)]">Pasien</h2>
              <p className="mb-5 mt-2 text-sm leading-6 text-[var(--color-ash)]">
                Simpan jurnal kesehatan dan kelola akses dokter secara terbatas.
              </p>
              <Button type="submit" className="w-full">
                Lanjutkan dengan Google
              </Button>
            </form>

            <form action={startGoogleOAuthAction} className="rounded-[10px] bg-white p-5 shadow-[var(--shadow-subtle)]">
              <input type="hidden" name="intent" value="doctor" />
              <Stethoscope className="mb-4 text-[var(--color-teal-deep)]" />
              <h2 className="font-semibold text-[var(--color-midnight)]">Dokter</h2>
              <p className="mb-5 mt-2 text-sm leading-6 text-[var(--color-ash)]">
                Ajukan verifikasi STR, SIP, dan KTP sebelum mengakses fitur dokter.
              </p>
              <Button type="submit" variant="secondary" className="w-full">
                Daftar sebagai Dokter
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </main>
  );
}
