import { describe, expect, it } from "vitest";

import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildAuditEventProof } from "./audit";

describe("audit event proof hashing", () => {
  it("builds exact Feature 06 audit payload without raw identifiers", () => {
    const proof = buildAuditEventProof({
      hashPepper: "test-pepper-with-enough-length",
      logId: "90000000-0000-0000-0000-000000000001",
      actorAuthUserId: "00000000-0000-0000-0000-000000000001",
      actorRole: "doctor",
      action: "doctor_rag_requested",
      accessStatus: "allowed",
      targetType: "access_grant",
      targetId: "80000000-0000-0000-0000-000000000001",
      patientId: "10000000-0000-0000-0000-000000000001",
      doctorId: "20000000-0000-0000-0000-000000000001",
      reason: null,
      createdAt: "2026-05-15T12:00:00.000Z",
    });
    const payload = JSON.parse(proof.canonicalPayload) as Record<string, unknown>;

    expect(proof.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(payload).sort()).toEqual([
      "access_status",
      "action",
      "actor_hash",
      "actor_role",
      "created_at",
      "doctor_hash",
      "log_ref_hash",
      "patient_hash",
      "proof_type",
      "reason_code",
      "schema_version",
      "target_ref_hash",
      "target_type",
    ]);
    expect(proof.canonicalPayload).not.toContain("90000000-0000-0000-0000-000000000001");
    expect(proof.canonicalPayload).not.toContain("10000000-0000-0000-0000-000000000001");
    expect(payload.action).toBe("doctor_rag_requested");
    expect(payload.access_status).toBe("allowed");
  });
});
