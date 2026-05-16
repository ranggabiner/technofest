import "server-only";

import { Resend } from "resend";

import { parseEnv } from "@/lib/config/env";

export async function sendDoctorStatusEmail(input: {
  to: string;
  doctorName: string;
  status: "approved" | "rejected";
  reason?: string | null;
}) {
  const env = parseEnv(process.env, ["email"]);
  if (!env.ok) {
    return { ok: false as const, reason: "email_env_missing" };
  }

  const resend = new Resend(env.data.RESEND_API_KEY);
  const subject =
    input.status === "approved"
      ? "Akun dokter MedProof disetujui"
      : "Akun dokter MedProof ditolak";
  const text =
    input.status === "approved"
      ? `Halo ${input.doctorName}, akun dokter MedProof Anda sudah disetujui.`
      : `Halo ${input.doctorName}, akun dokter MedProof Anda ditolak. Alasan: ${input.reason ?? "Tidak tersedia"}`;

  const { error } = await resend.emails.send({
    from: env.data.RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    text,
  });

  if (error) {
    return { ok: false as const, reason: "resend_send_failed" };
  }

  return { ok: true as const };
}
