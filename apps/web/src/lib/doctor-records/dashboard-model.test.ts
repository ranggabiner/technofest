import { describe, expect, it } from "vitest";

import {
  deriveDoctorSessionStatus,
  filterDoctorDashboardSessions,
  type DoctorDashboardSession,
} from "./dashboard-model";

const baseSession: DoctorDashboardSession = {
  grantId: "grant-1",
  patientName: "Pasien Demo",
  patientEmail: "pasien@example.test",
  grantedAt: "2026-05-16T09:00:00.000Z",
  expiresAt: "2026-05-16T12:00:00.000Z",
  isRevoked: false,
  revokedAt: null,
  canViewScope1: true,
  canViewScope2Mental: false,
  canViewScope2Physical: true,
  canDownloadAttachments: false,
  scopes: ["Scope 1", "Scope 2 fisik"],
  blockchainStatus: "pending",
  blockchainTxHash: null,
};

describe("doctor dashboard session model", () => {
  it("marks active, expired, and revoked sessions from server timestamps", () => {
    expect(
      deriveDoctorSessionStatus(baseSession, new Date("2026-05-16T10:00:00.000Z")),
    ).toEqual({ kind: "active", reason: "active" });
    expect(
      deriveDoctorSessionStatus(baseSession, new Date("2026-05-16T13:00:00.000Z")),
    ).toEqual({ kind: "finished", reason: "expired" });
    expect(
      deriveDoctorSessionStatus(
        { ...baseSession, isRevoked: true },
        new Date("2026-05-16T11:00:00.000Z"),
      ),
    ).toEqual({ kind: "finished", reason: "revoked" });
  });

  it("filters dashboard table by all, active, and finished without changing server data", () => {
    const active = baseSession;
    const finished = {
      ...baseSession,
      grantId: "grant-2",
      expiresAt: "2026-05-16T08:00:00.000Z",
    };
    const now = new Date("2026-05-16T10:00:00.000Z");

    expect(filterDoctorDashboardSessions([active, finished], "all", now)).toEqual([
      active,
      finished,
    ]);
    expect(filterDoctorDashboardSessions([active, finished], "active", now)).toEqual([active]);
    expect(filterDoctorDashboardSessions([active, finished], "finished", now)).toEqual([
      finished,
    ]);
  });
});
