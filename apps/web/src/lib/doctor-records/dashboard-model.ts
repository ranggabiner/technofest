export type DoctorDashboardSession = {
  grantId: string;
  patientName: string;
  patientEmail: string;
  grantedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  canViewScope1: boolean;
  canViewScope2Mental: boolean;
  canViewScope2Physical: boolean;
  canDownloadAttachments: boolean;
  scopes: string[];
  blockchainStatus: string;
  blockchainTxHash: string | null;
};

export type DoctorDashboardFilter = "all" | "active" | "finished";

export type DoctorSessionStatus =
  | { kind: "active"; reason: "active" }
  | { kind: "finished"; reason: "expired" | "revoked" };

export function deriveDoctorSessionStatus(
  session: Pick<DoctorDashboardSession, "expiresAt" | "isRevoked">,
  now = new Date(),
): DoctorSessionStatus {
  if (session.isRevoked) return { kind: "finished", reason: "revoked" };
  if (new Date(session.expiresAt).getTime() <= now.getTime()) {
    return { kind: "finished", reason: "expired" };
  }
  return { kind: "active", reason: "active" };
}

export function filterDoctorDashboardSessions(
  sessions: DoctorDashboardSession[],
  filter: DoctorDashboardFilter,
  now = new Date(),
) {
  if (filter === "all") return sessions;
  return sessions.filter((session) => deriveDoctorSessionStatus(session, now).kind === filter);
}
