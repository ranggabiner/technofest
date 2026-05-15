import { describe, expect, it } from "vitest";

import {
  actionHash,
  sanitizeBlockchainError,
  toBytes32,
  ZERO_BYTES32,
} from "./proofs";

describe("blockchain proof utilities", () => {
  it("converts 64 character hex hashes into bytes32 values", () => {
    expect(toBytes32("a".repeat(64))).toBe(`0x${"a".repeat(64)}`);
    expect(toBytes32(`0x${"b".repeat(64)}`)).toBe(`0x${"b".repeat(64)}`);
  });

  it("rejects malformed proof hashes before relayer submission", () => {
    expect(() => toBytes32("raw-id-or-short-hash")).toThrow("Invalid proof hash");
  });

  it("hashes audit action identifiers without exposing raw action text on-chain", () => {
    const hash = actionHash("doctor_rag_requested");

    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hash).not.toContain("doctor_rag_requested");
    expect(ZERO_BYTES32).toBe(`0x${"0".repeat(64)}`);
  });

  it("stores sanitized blockchain error summaries only", () => {
    expect(sanitizeBlockchainError(new Error("patient says sakit kepala and diagnosis text"))).toBe(
      "blockchain_request_failed",
    );
    expect(sanitizeBlockchainError(new Error("insufficient funds for gas"))).toBe(
      "relayer_insufficient_funds",
    );
    expect(sanitizeBlockchainError(new Error("execution reverted: DuplicateRecord"))).toBe(
      "duplicate_proof_hash",
    );
  });
});
