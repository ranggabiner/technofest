import { describe, expect, it } from "vitest";

import {
  ActiveDoctorAccessSessionError,
  assertNoActiveDoctorAccessSession,
  buildAccessGrantProof,
  getDoctorLookupLimitState,
  isActiveDoctorAccessSessionError,
  parseDoctorLookupInput,
} from "./grants";

describe("doctor access lookup input", () => {
  it("parses native QR payloads and manual six digit codes", () => {
    expect(parseDoctorLookupInput(" medproof://doctor/qr-token-123 ")).toEqual({
      kind: "qr_token",
      value: "qr-token-123",
    });
    expect(parseDoctorLookupInput("123 456")).toEqual({
      kind: "doctor_access_code",
      value: "123456",
    });
  });

  it("rejects malformed lookup values with one generic message", () => {
    expect(() => parseDoctorLookupInput("abc")).toThrow("Kode dokter tidak valid atau tidak tersedia");
  });
});

describe("doctor lookup rate limits", () => {
  const now = new Date("2026-05-15T12:00:00.000Z");

  it("allows attempts below both failed lookup windows", () => {
    const attempts = Array.from({ length: 9 }, (_, index) =>
      new Date(now.getTime() - index * 60_000).toISOString(),
    );

    expect(getDoctorLookupLimitState(attempts, now)).toEqual({
      limited: false,
      reason: null,
      failedInShortWindow: 9,
      failedInDailyWindow: 9,
    });
  });

  it("blocks after ten failed lookups in fifteen minutes", () => {
    const attempts = Array.from({ length: 10 }, (_, index) =>
      new Date(now.getTime() - index * 60_000).toISOString(),
    );

    expect(getDoctorLookupLimitState(attempts, now)).toMatchObject({
      limited: true,
      reason: "short_window",
      failedInShortWindow: 10,
    });
  });

  it("blocks after twenty failed lookups in twenty four hours", () => {
    const attempts = Array.from({ length: 20 }, (_, index) =>
      new Date(now.getTime() - (20 + index) * 60_000).toISOString(),
    );

    expect(getDoctorLookupLimitState(attempts, now)).toMatchObject({
      limited: true,
      reason: "daily_window",
      failedInDailyWindow: 20,
    });
  });
});

describe("doctor access grant action errors", () => {
  it("blocks creating another active session for the same doctor", () => {
    expect(() => assertNoActiveDoctorAccessSession({ grantId: "active-grant" })).toThrow(
      ActiveDoctorAccessSessionError,
    );
  });

  it("classifies duplicate active grant invariant failures", () => {
    expect(isActiveDoctorAccessSessionError({ message: "active grant invariant failed" })).toBe(true);
    expect(isActiveDoctorAccessSessionError({ details: "active grant invariant failed" })).toBe(true);
    expect(isActiveDoctorAccessSessionError({ message: "replacement consent_hash is required" })).toBe(true);
  });

  it("does not classify unrelated Supabase or RPC errors", () => {
    expect(isActiveDoctorAccessSessionError({ message: "scope2 filter mode is invalid" })).toBe(false);
    expect(isActiveDoctorAccessSessionError(new Error("Akses dokter gagal disimpan"))).toBe(false);
  });
});

describe("access grant proof hashing", () => {
  const baseInput = {
    pepper: "test-pepper-with-enough-length",
    grantId: "80000000-0000-0000-0000-000000000001",
    patientId: "10000000-0000-0000-0000-000000000001",
    doctorId: "20000000-0000-0000-0000-000000000001",
    canViewScope1: true,
    canViewScope2Mental: false,
    canViewScope2Physical: true,
    canDownloadAttachments: false,
    grantedAt: "2026-05-15T12:00:00.000Z",
    expiresAt: "2026-05-16T12:00:00.000Z",
    isRevoked: false,
    revokedAt: null,
    replacedByGrantId: null,
    createdAt: "2026-05-15T12:00:00.000Z",
  };

  it("creates deterministic privacy-preserving consent hashes", () => {
    const first = buildAccessGrantProof(baseInput);
    const second = buildAccessGrantProof(baseInput);

    expect(first.hash).toEqual(second.hash);
    expect(first.hash).toHaveLength(64);
    expect(first.canonicalPayload).not.toContain(baseInput.patientId);
    expect(first.canonicalPayload).not.toContain(baseInput.doctorId);
  });

  it("changes when a grant is revoked or replaced", () => {
    const active = buildAccessGrantProof(baseInput);
    const revoked = buildAccessGrantProof({
      ...baseInput,
      isRevoked: true,
      revokedAt: "2026-05-15T13:00:00.000Z",
      replacedByGrantId: "80000000-0000-0000-0000-000000000099",
    });

    expect(revoked.hash).not.toEqual(active.hash);
  });

  it("uses the exact Feature 06 consent proof payload keys", () => {
    const proof = buildAccessGrantProof(baseInput);
    const payload = JSON.parse(proof.canonicalPayload) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual([
      "can_download_attachments",
      "can_view_scope1",
      "can_view_scope2_mental",
      "can_view_scope2_physical",
      "created_at",
      "doctor_hash",
      "expires_at",
      "grant_ref_hash",
      "granted_at",
      "granular_scope_hash",
      "is_revoked",
      "patient_hash",
      "proof_type",
      "replaced_by_grant_ref_hash",
      "revoked_at",
      "schema_version",
    ]);
    expect(payload.patient_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.doctor_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.created_at).toBe(baseInput.createdAt);
    expect(payload).not.toHaveProperty("patient_ref_hash");
    expect(payload).not.toHaveProperty("doctor_ref_hash");
  });
});
