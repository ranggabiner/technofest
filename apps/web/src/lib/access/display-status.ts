export type DoctorAccessDisplayStatus = "ongoing" | "completed";

export function getDoctorAccessDisplayStatus(
  grant: {
    expiresAt: string;
    isRevoked: boolean;
    replacedByGrantId: string | null;
  },
  now: Date = new Date(),
): DoctorAccessDisplayStatus {
  if (grant.isRevoked || grant.replacedByGrantId) return "completed";

  const expiresMs = new Date(grant.expiresAt).getTime();
  if (!Number.isFinite(expiresMs) || expiresMs <= now.getTime()) return "completed";

  return "ongoing";
}
