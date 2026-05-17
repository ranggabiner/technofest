import { describe, expect, it } from "vitest";

import { hmacSha256Hex } from "@/lib/crypto/hashing";

import {
  buildProofContractCall,
  buildProofContractWrite,
  medProofProofRegistryAbi,
  proofContractGasLimit,
} from "./registry";
import { actionHash, toBytes32, ZERO_BYTES32 } from "./proofs";

describe("MedProof registry relayer call mapping", () => {
  const pepper = "test-pepper-with-enough-length";

  it("maps Scope 1 proof rows to registerHealthRecord", () => {
    const call = buildProofContractCall(
      {
        proofType: "scope1_record",
        id: "90000000-0000-0000-0000-000000000001",
        proofHash: "a".repeat(64),
        patientId: "10000000-0000-0000-0000-000000000001",
        doctorId: "20000000-0000-0000-0000-000000000001",
      },
      pepper,
    );

    expect(call.functionName).toBe("registerHealthRecord");
    expect(call.args).toEqual([
      toBytes32("a".repeat(64)),
      toBytes32(hmacSha256Hex(pepper, "10000000-0000-0000-0000-000000000001")),
      toBytes32(hmacSha256Hex(pepper, "20000000-0000-0000-0000-000000000001")),
      BigInt(1),
    ]);
    expect(medProofProofRegistryAbi.some((item) => item.type === "event")).toBe(true);
  });

  it("maps consent rows to recordConsent", () => {
    const call = buildProofContractCall(
      {
        proofType: "access_grant",
        id: "80000000-0000-0000-0000-000000000001",
        proofHash: "b".repeat(64),
        patientId: "10000000-0000-0000-0000-000000000001",
        doctorId: "20000000-0000-0000-0000-000000000001",
        expiresAt: "2026-05-16T12:00:00.000Z",
        isRevoked: true,
      },
      pepper,
    );

    expect(call.functionName).toBe("recordConsent");
    expect(call.args).toEqual([
      toBytes32("b".repeat(64)),
      toBytes32(hmacSha256Hex(pepper, "10000000-0000-0000-0000-000000000001")),
      toBytes32(hmacSha256Hex(pepper, "20000000-0000-0000-0000-000000000001")),
      BigInt(1_778_932_800),
      true,
    ]);
  });

  it("maps audit rows to recordAuditEvent with zero target hash when target is null", () => {
    const call = buildProofContractCall(
      {
        proofType: "audit_log",
        id: "90000000-0000-0000-0000-000000000001",
        proofHash: "c".repeat(64),
        actorAuthUserId: "00000000-0000-0000-0000-000000000001",
        targetId: null,
        action: "doctor_rag_requested",
      },
      pepper,
    );

    expect(call.functionName).toBe("recordAuditEvent");
    expect(call.args).toEqual([
      toBytes32("c".repeat(64)),
      toBytes32(hmacSha256Hex(pepper, "00000000-0000-0000-0000-000000000001")),
      ZERO_BYTES32,
      actionHash("doctor_rag_requested"),
    ]);
  });

  it("adds an explicit gas limit for Amoy relayer writes", () => {
    const write = buildProofContractWrite(
      {
        proofType: "scope1_record",
        id: "90000000-0000-0000-0000-000000000001",
        proofHash: "a".repeat(64),
        patientId: "10000000-0000-0000-0000-000000000001",
        doctorId: "20000000-0000-0000-0000-000000000001",
      },
      pepper,
    );

    expect(write.gas).toBe(proofContractGasLimit);
    expect(write.gas).toBeGreaterThan(BigInt(36_593));
  });
});
