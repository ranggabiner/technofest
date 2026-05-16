import type { Hex } from "viem";

import { sha256Hex } from "@/lib/crypto/hashing";

export const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;

export type ProofType = "scope1_record" | "access_grant" | "audit_log";
export type VerifyStatus = "verified" | "pending" | "failed" | "unavailable" | "mismatch";

export function toBytes32(value: string): Hex {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (!/^[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("Invalid proof hash");
  }
  return `0x${normalized.toLowerCase()}` as Hex;
}

export function actionHash(action: string): Hex {
  return toBytes32(sha256Hex(action));
}

export function sanitizeBlockchainError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("duplicate")) return "duplicate_proof_hash";
  if (message.includes("insufficient funds")) return "relayer_insufficient_funds";
  if (message.includes("timeout") || message.includes("timed out")) return "rpc_timeout";
  if (message.includes("missing contract") || message.includes("contract address")) {
    return "contract_config_missing";
  }
  if (message.includes("private key") || message.includes("relayer")) {
    return "relayer_config_missing";
  }
  return "blockchain_request_failed";
}
