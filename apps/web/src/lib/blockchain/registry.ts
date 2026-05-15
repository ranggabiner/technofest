import type { Hex } from "viem";

import { hmacSha256Hex } from "@/lib/crypto/hashing";

import { actionHash, toBytes32, ZERO_BYTES32, type ProofType } from "./proofs";

export const medProofProofRegistryAbi = [
  {
    type: "function",
    name: "registerHealthRecord",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordHash", type: "bytes32" },
      { name: "patientHash", type: "bytes32" },
      { name: "issuerHash", type: "bytes32" },
      { name: "version", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordConsent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "consentHash", type: "bytes32" },
      { name: "patientHash", type: "bytes32" },
      { name: "granteeHash", type: "bytes32" },
      { name: "expiresAt", type: "uint256" },
      { name: "isRevoked", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordAuditEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "auditEventHash", type: "bytes32" },
      { name: "actorHash", type: "bytes32" },
      { name: "targetHash", type: "bytes32" },
      { name: "actionHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "HealthRecordRegistered",
    inputs: [
      { name: "recordHash", type: "bytes32", indexed: true },
      { name: "patientHash", type: "bytes32", indexed: true },
      { name: "issuerHash", type: "bytes32", indexed: true },
      { name: "version", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ConsentRecorded",
    inputs: [
      { name: "consentHash", type: "bytes32", indexed: true },
      { name: "patientHash", type: "bytes32", indexed: true },
      { name: "granteeHash", type: "bytes32", indexed: true },
      { name: "expiresAt", type: "uint256", indexed: false },
      { name: "isRevoked", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AuditEventRecorded",
    inputs: [
      { name: "auditEventHash", type: "bytes32", indexed: true },
      { name: "actorHash", type: "bytes32", indexed: true },
      { name: "targetHash", type: "bytes32", indexed: true },
      { name: "actionHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export type ClaimedBlockchainProof = {
  proofType: ProofType;
  id: string;
  proofHash: string;
  patientId?: string | null;
  doctorId?: string | null;
  actorAuthUserId?: string | null;
  targetId?: string | null;
  action?: string | null;
  expiresAt?: string | null;
  isRevoked?: boolean | null;
  blockchainTxHash?: string | null;
};

export type ProofContractCall =
  | {
      functionName: "registerHealthRecord";
      args: readonly [Hex, Hex, Hex, bigint];
    }
  | {
      functionName: "recordConsent";
      args: readonly [Hex, Hex, Hex, bigint, boolean];
    }
  | {
      functionName: "recordAuditEvent";
      args: readonly [Hex, Hex, Hex, Hex];
    };

export function buildProofContractCall(
  proof: ClaimedBlockchainProof,
  hashPepper: string,
): ProofContractCall {
  if (proof.proofType === "scope1_record") {
    return {
      functionName: "registerHealthRecord",
      args: [
        toBytes32(proof.proofHash),
        hmacId(hashPepper, required(proof.patientId, "patient_id")),
        hmacId(hashPepper, required(proof.doctorId, "doctor_id")),
        BigInt(1),
      ],
    };
  }

  if (proof.proofType === "access_grant") {
    return {
      functionName: "recordConsent",
      args: [
        toBytes32(proof.proofHash),
        hmacId(hashPepper, required(proof.patientId, "patient_id")),
        hmacId(hashPepper, required(proof.doctorId, "doctor_id")),
        toUnixSeconds(required(proof.expiresAt, "expires_at")),
        Boolean(proof.isRevoked),
      ],
    };
  }

  return {
    functionName: "recordAuditEvent",
    args: [
      toBytes32(proof.proofHash),
      hmacId(hashPepper, required(proof.actorAuthUserId, "actor_auth_user_id")),
      proof.targetId ? hmacId(hashPepper, proof.targetId) : ZERO_BYTES32,
      actionHash(required(proof.action, "action")),
    ],
  };
}

function hmacId(hashPepper: string, value: string): Hex {
  return toBytes32(hmacSha256Hex(hashPepper, value));
}

function toUnixSeconds(value: string): bigint {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error("Invalid proof timestamp");
  return BigInt(Math.floor(ms / 1000));
}

function required(value: string | null | undefined, field: string): string {
  if (!value) throw new Error(`Missing ${field} for proof`);
  return value;
}
