import type { VerifyStatus } from "./proofs";

export function classifyProofVerification(input: {
  blockchainStatus: string;
  txHash: string | null;
  recomputedHash: string;
  confirmedEventHash: string | null;
}): VerifyStatus {
  if (input.blockchainStatus === "pending") return "pending";
  if (input.blockchainStatus === "failed") return "failed";
  if (input.blockchainStatus !== "confirmed" || !input.txHash || !input.confirmedEventHash) {
    return "unavailable";
  }

  return normalizeHash(input.confirmedEventHash) === normalizeHash(input.recomputedHash)
    ? "verified"
    : "mismatch";
}

function normalizeHash(value: string) {
  return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
}
