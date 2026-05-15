import "server-only";

import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";

import { buildAccessGrantProof } from "@/lib/access/grants";
import { buildAuditEventProof, writeAuditLog } from "@/lib/audit/audit";
import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { buildScope1RecordProof } from "@/lib/doctor-records/scope1";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import { sanitizeBlockchainError, toBytes32, type ProofType, type VerifyStatus } from "./proofs";
import {
  buildProofContractCall,
  medProofProofRegistryAbi,
  type ClaimedBlockchainProof,
} from "./registry";
import { classifyProofVerification } from "./verify";

const proofTypes: ProofType[] = ["scope1_record", "access_grant", "audit_log"];
const retryTimeoutMs = 15_000;

type RetryResult = {
  claimed: number;
  submitted: number;
  confirmed: number;
  pending: number;
  failed: number;
};

type BlockchainClients = ReturnType<typeof createBlockchainClients>;

type ProofStatusPatch = {
  blockchain_status?: "pending" | "confirmed" | "failed";
  blockchain_tx_hash?: string | null;
  blockchain_last_error?: string | null;
};

type Scope1RecordProofRow = Pick<
  Database["public"]["Tables"]["scope_1_medical_records"]["Row"],
  | "record_id"
  | "patient_id"
  | "doctor_id"
  | "amends_record_id"
  | "record_type_ciphertext"
  | "record_type_iv"
  | "record_type_tag"
  | "title_ciphertext"
  | "title_iv"
  | "title_tag"
  | "description_ciphertext"
  | "description_iv"
  | "description_tag"
  | "attachment_file_id"
  | "record_hash"
  | "blockchain_status"
  | "blockchain_tx_hash"
  | "key_version"
  | "created_at"
> & {
  secure_files?: Pick<Database["public"]["Tables"]["secure_files"]["Row"], "file_id" | "file_sha256"> | Array<Pick<Database["public"]["Tables"]["secure_files"]["Row"], "file_id" | "file_sha256">> | null;
};

type AccessGrantProofRow = Pick<
  Database["public"]["Tables"]["access_grants"]["Row"],
  | "grant_id"
  | "patient_id"
  | "doctor_id"
  | "can_view_scope1"
  | "can_view_scope2_mental"
  | "can_view_scope2_physical"
  | "can_download_attachments"
  | "granted_at"
  | "expires_at"
  | "is_revoked"
  | "revoked_at"
  | "replaced_by_grant_id"
  | "consent_hash"
  | "blockchain_status"
  | "blockchain_tx_hash"
  | "created_at"
>;

type AuditProofRow = Pick<
  Database["public"]["Tables"]["audit_logs"]["Row"],
  | "log_id"
  | "actor_auth_user_id"
  | "actor_role"
  | "action"
  | "target_type"
  | "target_id"
  | "patient_id"
  | "doctor_id"
  | "access_status"
  | "reason"
  | "audit_event_hash"
  | "blockchain_status"
  | "blockchain_tx_hash"
  | "created_at"
>;

export async function retryPendingProofs(limit = 10): Promise<RetryResult> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 25);
  const env = requireEnv(["core", "blockchain"]);
  const admin = createAdminClient();
  const clients = createBlockchainClients(env.data);
  const result: RetryResult = {
    claimed: 0,
    submitted: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
  };

  let remaining = safeLimit;
  for (const proofType of proofTypes) {
    if (remaining <= 0) break;
    const proofs = await claimProofs(proofType, remaining);
    result.claimed += proofs.length;
    remaining -= proofs.length;

    for (const proof of proofs) {
      const outcome = await processClaimedProof(admin, proof, env.data.HASH_PEPPER, clients);
      result[outcome] += 1;
      if (outcome === "pending" && !proof.blockchainTxHash) result.submitted += 1;
    }
  }

  return result;
}

export async function verifyProofForRole(
  role: ResolvedRole,
  target: { proofType: ProofType; id: string },
): Promise<{ status: VerifyStatus; txHash: string | null; message: string }> {
  const env = requireEnv(["core", "blockchain"]);
  const clients = createBlockchainClients(env.data);
  const proof = await loadRecomputedProofForRole(role, target, env.data.HASH_PEPPER);
  const eventHash = proof.txHash
    ? await readConfirmedProofHash({
        clients,
        proofType: target.proofType,
        proofHash: proof.recomputedHash,
        txHash: proof.txHash,
      })
    : null;
  const status = classifyProofVerification({
    blockchainStatus: proof.blockchainStatus,
    txHash: proof.txHash,
    recomputedHash: proof.recomputedHash,
    confirmedEventHash: eventHash,
  });

  if (status === "mismatch") {
    await writeAuditLog({
      actorAuthUserId: role.authUserId,
      actorRole: role.kind,
      action: "blockchain_verification_mismatch",
      accessStatus: "mismatch",
      targetType: target.proofType,
      targetId: target.id,
      patientId: proof.patientId,
      doctorId: proof.doctorId,
      reason: "verified_hash_mismatch",
    });
  }

  return {
    status,
    txHash: proof.txHash,
    message: verifyMessage(status),
  };
}

async function claimProofs(proofType: ProofType, limit: number): Promise<ClaimedBlockchainProof[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_blockchain_proofs", {
    target_proof_type: proofType,
    batch_limit: limit,
  });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    proofType: row.proof_type as ProofType,
    id: row.id,
    proofHash: row.proof_hash,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    actorAuthUserId: row.actor_auth_user_id,
    targetId: row.target_id,
    action: row.action,
    expiresAt: row.expires_at,
    isRevoked: row.is_revoked,
    blockchainTxHash: row.blockchain_tx_hash,
  }));
}

async function processClaimedProof(
  admin: ReturnType<typeof createAdminClient>,
  proof: ClaimedBlockchainProof,
  hashPepper: string,
  clients: BlockchainClients,
): Promise<"confirmed" | "pending" | "failed"> {
  try {
    if (proof.blockchainTxHash) {
      const existing = await readReceiptProofHash({
        clients,
        proofType: proof.proofType,
        txHash: proof.blockchainTxHash as Hex,
      });
      if (existing.status === "confirmed") {
        if (!eventHashMatchesProof(proof, existing.eventHash)) {
          await updateProofStatus(admin, proof, {
            blockchain_status: "failed",
            blockchain_last_error: "proof_hash_mismatch",
          });
          return "failed";
        }
        await updateProofStatus(admin, proof, {
          blockchain_status: "confirmed",
          blockchain_last_error: null,
        });
        return "confirmed";
      }
      if (existing.status === "failed") {
        await updateProofStatus(admin, proof, {
          blockchain_status: "failed",
          blockchain_last_error: "transaction_reverted",
        });
        return "failed";
      }
      return "pending";
    }

    const call = buildProofContractCall(proof, hashPepper);
    const hash = await clients.walletClient.writeContract({
      address: clients.contractAddress,
      abi: medProofProofRegistryAbi,
      functionName: call.functionName,
      args: call.args,
    } as never);
    await updateProofStatus(admin, proof, {
      blockchain_status: "pending",
      blockchain_tx_hash: hash,
      blockchain_last_error: null,
    });

    const receipt = await clients.publicClient
      .waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: retryTimeoutMs,
      })
      .catch(() => null);

    if (!receipt) return "pending";
    if (receipt.status !== "success") {
      await updateProofStatus(admin, proof, {
        blockchain_status: "failed",
        blockchain_last_error: "transaction_reverted",
      });
      return "failed";
    }

    const eventHash = extractEventHash(proof.proofType, receipt.logs);
    if (!eventHash || !eventHashMatchesProof(proof, eventHash)) {
      await updateProofStatus(admin, proof, {
        blockchain_status: "failed",
        blockchain_tx_hash: hash,
        blockchain_last_error: "proof_hash_mismatch",
      });
      return "failed";
    }

    await updateProofStatus(admin, proof, {
      blockchain_status: "confirmed",
      blockchain_tx_hash: hash,
      blockchain_last_error: null,
    });
    return "confirmed";
  } catch (error) {
    const summary = sanitizeBlockchainError(error);
    if (summary === "duplicate_proof_hash") {
      const duplicate = await findConfirmedEventByHash(clients, proof);
      if (duplicate) {
        await updateProofStatus(admin, proof, {
          blockchain_status: "confirmed",
          blockchain_tx_hash: duplicate,
          blockchain_last_error: null,
        });
        return "confirmed";
      }
    }

    await updateProofStatus(admin, proof, {
      blockchain_status: "failed",
      blockchain_last_error: summary,
    });
    return "failed";
  }
}

async function updateProofStatus(
  admin: ReturnType<typeof createAdminClient>,
  proof: Pick<ClaimedBlockchainProof, "proofType" | "id">,
  patch: ProofStatusPatch,
) {
  const config = tableConfig(proof.proofType);
  const { error } = await (admin.from(config.table) as never as {
    update: (values: ProofStatusPatch) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  })
    .update(patch)
    .eq(config.idColumn, proof.id);
  if (error) throw error;
}

async function loadRecomputedProofForRole(
  role: ResolvedRole,
  target: { proofType: ProofType; id: string },
  hashPepper: string,
) {
  if (target.proofType === "scope1_record") {
    const row = await loadScope1RecordProofRow(target.id);
    await assertCanVerifyPatientDoctorRow(role, row.patient_id, row.doctor_id);
    const file = normalizeJoin(row.secure_files);
    const proof = buildScope1RecordProof({
      pepper: hashPepper,
      recordId: row.record_id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      amendsRecordId: row.amends_record_id,
      recordType: {
        ciphertext: row.record_type_ciphertext,
        iv: row.record_type_iv,
        tag: row.record_type_tag,
      },
      title: {
        ciphertext: row.title_ciphertext,
        iv: row.title_iv,
        tag: row.title_tag,
      },
      description: row.description_ciphertext && row.description_iv && row.description_tag
        ? {
            ciphertext: row.description_ciphertext,
            iv: row.description_iv,
            tag: row.description_tag,
          }
        : null,
      attachmentFileId: row.attachment_file_id,
      attachmentFileSha256: file?.file_sha256 ?? null,
      keyVersion: row.key_version,
      createdAt: row.created_at,
    });

    return {
      recomputedHash: proof.hash,
      blockchainStatus: row.blockchain_status,
      txHash: row.blockchain_tx_hash,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
    };
  }

  if (target.proofType === "access_grant") {
    const row = await loadAccessGrantProofRow(target.id);
    await assertCanVerifyPatientDoctorRow(role, row.patient_id, row.doctor_id);
    const proof = buildAccessGrantProof({
      pepper: hashPepper,
      grantId: row.grant_id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      canViewScope1: row.can_view_scope1,
      canViewScope2Mental: row.can_view_scope2_mental,
      canViewScope2Physical: row.can_view_scope2_physical,
      canDownloadAttachments: row.can_download_attachments,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      isRevoked: row.is_revoked,
      revokedAt: row.revoked_at,
      replacedByGrantId: row.replaced_by_grant_id,
      createdAt: row.created_at,
    });

    return {
      recomputedHash: proof.hash,
      blockchainStatus: row.blockchain_status,
      txHash: row.blockchain_tx_hash,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
    };
  }

  const row = await loadAuditProofRow(target.id);
  await assertCanVerifyAuditRow(role, row);
  const proof = buildAuditEventProof({
    hashPepper,
    logId: row.log_id,
    actorAuthUserId: row.actor_auth_user_id,
    actorRole: row.actor_role as "medical_admin" | "doctor" | "patient",
    action: row.action as never,
    accessStatus: row.access_status as never,
    targetType: row.target_type,
    targetId: row.target_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    reason: row.reason,
    createdAt: row.created_at,
  });

  return {
    recomputedHash: proof.hash,
    blockchainStatus: row.blockchain_status,
    txHash: row.blockchain_tx_hash,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
  };
}

async function loadScope1RecordProofRow(id: string): Promise<Scope1RecordProofRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scope_1_medical_records")
    .select(
      "record_id,patient_id,doctor_id,amends_record_id,record_type_ciphertext,record_type_iv,record_type_tag,title_ciphertext,title_iv,title_tag,description_ciphertext,description_iv,description_tag,attachment_file_id,record_hash,blockchain_status,blockchain_tx_hash,key_version,created_at,secure_files(file_id,file_sha256)",
    )
    .eq("record_id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Proof tidak ditemukan");
  return data as Scope1RecordProofRow;
}

async function loadAccessGrantProofRow(id: string): Promise<AccessGrantProofRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_grants")
    .select(
      "grant_id,patient_id,doctor_id,can_view_scope1,can_view_scope2_mental,can_view_scope2_physical,can_download_attachments,granted_at,expires_at,is_revoked,revoked_at,replaced_by_grant_id,consent_hash,blockchain_status,blockchain_tx_hash,created_at",
    )
    .eq("grant_id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Proof tidak ditemukan");
  return data as AccessGrantProofRow;
}

async function loadAuditProofRow(id: string): Promise<AuditProofRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select(
      "log_id,actor_auth_user_id,actor_role,action,target_type,target_id,patient_id,doctor_id,access_status,reason,audit_event_hash,blockchain_status,blockchain_tx_hash,created_at",
    )
    .eq("log_id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Proof tidak ditemukan");
  return data as AuditProofRow;
}

async function assertCanVerifyPatientDoctorRow(
  role: ResolvedRole,
  patientId: string,
  doctorId: string,
) {
  if (role.kind === "patient" && role.patientId === patientId) return;
  if (role.kind === "doctor" && role.doctorId === doctorId && role.canAccessDoctorFeatures) {
    if (await hasActiveGrant(doctorId, patientId)) return;
  }
  throw new Error("Tidak berwenang memverifikasi proof ini");
}

async function assertCanVerifyAuditRow(role: ResolvedRole, row: AuditProofRow) {
  if (role.kind === "patient" && role.patientId && row.patient_id === role.patientId) return;
  if (
    role.kind === "doctor" &&
    role.doctorId &&
    role.doctorId === row.doctor_id &&
    row.patient_id &&
    (await hasActiveGrant(role.doctorId, row.patient_id))
  ) {
    return;
  }
  if (
    role.kind === "medical_admin" &&
    ["admin_doctor_approved", "admin_doctor_rejected", "doctor_kyc_email_notification_failed"].includes(
      row.action,
    ) &&
    row.patient_id == null
  ) {
    return;
  }

  throw new Error("Tidak berwenang memverifikasi proof ini");
}

async function hasActiveGrant(doctorId: string, patientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_grants")
    .select("grant_id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function readConfirmedProofHash(input: {
  clients: BlockchainClients;
  proofType: ProofType;
  proofHash: string;
  txHash: string;
}) {
  const receipt = await readReceiptProofHash({
    clients: input.clients,
    proofType: input.proofType,
    txHash: input.txHash as Hex,
  });
  if (receipt.status === "confirmed") return receipt.eventHash;
  const eventTx = await findConfirmedEventByHash(input.clients, {
    proofType: input.proofType,
    proofHash: input.proofHash,
  });
  return eventTx ? input.proofHash : null;
}

async function readReceiptProofHash(input: {
  clients: BlockchainClients;
  proofType: ProofType;
  txHash: Hex;
}): Promise<{ status: "confirmed"; eventHash: string } | { status: "pending" | "failed" }> {
  const receipt = await input.clients.publicClient.getTransactionReceipt({ hash: input.txHash }).catch(() => null);
  if (!receipt) return { status: "pending" };
  if (receipt.status !== "success") return { status: "failed" };
  const eventHash = extractEventHash(input.proofType, receipt.logs);
  return eventHash ? { status: "confirmed", eventHash } : { status: "failed" };
}

async function findConfirmedEventByHash(
  clients: BlockchainClients,
  proof: Pick<ClaimedBlockchainProof, "proofType" | "proofHash">,
) {
  const event = eventConfig(proof.proofType);
  const events = await clients.publicClient.getContractEvents({
    address: clients.contractAddress,
    abi: medProofProofRegistryAbi,
    eventName: event.name,
    args: {
      [event.hashArg]: toBytes32(proof.proofHash),
    },
    fromBlock: BigInt(0),
    toBlock: "latest",
  } as never);

  const first = Array.isArray(events) ? events[0] : null;
  return first && "transactionHash" in first ? (first.transactionHash as Hex) : null;
}

function extractEventHash(proofType: ProofType, logs: Log[]) {
  const event = eventConfig(proofType);
  const parsed = parseEventLogs({
    abi: medProofProofRegistryAbi,
    logs,
  });
  const match = parsed.find((item) => item.eventName === event.name);
  const args = (match?.args ?? {}) as Record<string, unknown>;
  const hash = args[event.hashArg];
  return typeof hash === "string" ? normalizeProofHash(hash) : null;
}

function eventHashMatchesProof(proof: Pick<ClaimedBlockchainProof, "proofHash">, eventHash: string) {
  return normalizeProofHash(eventHash) === normalizeProofHash(proof.proofHash);
}

function normalizeProofHash(value: string) {
  return value.replace(/^0x/i, "").toLowerCase();
}

function createBlockchainClients(env: Record<string, string>) {
  const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Hex);
  const transport = http(env.AMOY_RPC_URL);
  return {
    contractAddress: getAddress(env.MEDPROOF_CONTRACT_ADDRESS) as Address,
    publicClient: createPublicClient({
      chain: polygonAmoy,
      transport,
    }),
    walletClient: createWalletClient({
      account,
      chain: polygonAmoy,
      transport,
    }),
  };
}

function eventConfig(proofType: ProofType) {
  if (proofType === "scope1_record") {
    return { name: "HealthRecordRegistered", hashArg: "recordHash" } as const;
  }
  if (proofType === "access_grant") {
    return { name: "ConsentRecorded", hashArg: "consentHash" } as const;
  }
  return { name: "AuditEventRecorded", hashArg: "auditEventHash" } as const;
}

function tableConfig(proofType: ProofType) {
  if (proofType === "scope1_record") {
    return { table: "scope_1_medical_records", idColumn: "record_id" } as const;
  }
  if (proofType === "access_grant") {
    return { table: "access_grants", idColumn: "grant_id" } as const;
  }
  return { table: "audit_logs", idColumn: "log_id" } as const;
}

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function verifyMessage(status: VerifyStatus) {
  if (status === "verified") return "Proof cocok dengan catatan blockchain.";
  if (status === "mismatch") return "Integritas data tidak cocok dengan proof blockchain.";
  if (status === "pending") return "Proof belum terkonfirmasi, verifikasi belum tersedia.";
  if (status === "failed") return "Proof blockchain gagal, verifikasi belum tersedia.";
  return "Proof blockchain belum tersedia.";
}
