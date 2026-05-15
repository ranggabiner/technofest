import "server-only";

import type { ResolvedRole } from "@/lib/auth/roles";
import { requireEnv } from "@/lib/config/env";
import { decryptString } from "@/lib/crypto/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import { PATIENT_DASHBOARD_ITEM_LIMIT } from "./dashboard-limits";

type Scope1Row = Pick<
  Database["public"]["Tables"]["scope_1_medical_records"]["Row"],
  | "record_id"
  | "record_type_ciphertext"
  | "record_type_iv"
  | "record_type_tag"
  | "title_ciphertext"
  | "title_iv"
  | "title_tag"
  | "blockchain_status"
  | "blockchain_tx_hash"
  | "key_version"
  | "created_at"
>;

export type PatientScope1SummaryItem = {
  recordId: string;
  recordType: string;
  title: string;
  blockchainStatus: string;
  blockchainTxHash: string | null;
  createdAt: string;
};

export type PatientDashboardState = {
  recentScope1Records: PatientScope1SummaryItem[];
  proofCounts: {
    pending: number;
    failed: number;
    confirmed: number;
  };
};

export async function loadPatientDashboardState(role: ResolvedRole): Promise<PatientDashboardState> {
  if (role.kind !== "patient" || !role.patientId) {
    throw new Error("Peran pasien wajib untuk dashboard pasien");
  }

  const admin = createAdminClient();
  const [scope1Result, grantProofResult, auditProofResult] = await Promise.all([
    admin
      .from("scope_1_medical_records")
      .select(
        "record_id,record_type_ciphertext,record_type_iv,record_type_tag,title_ciphertext,title_iv,title_tag,blockchain_status,blockchain_tx_hash,key_version,created_at",
      )
      .eq("patient_id", role.patientId)
      .order("created_at", { ascending: false })
      .limit(PATIENT_DASHBOARD_ITEM_LIMIT),
    admin
      .from("access_grants")
      .select("blockchain_status")
      .eq("patient_id", role.patientId),
    admin
      .from("audit_logs")
      .select("blockchain_status")
      .eq("patient_id", role.patientId)
      .in("action", [
        "ai_processing_consent_accepted",
        "patient_grant_created",
        "patient_grant_replaced",
        "patient_grant_revoked",
        "doctor_patient_view_allowed",
        "doctor_patient_view_denied",
        "scope1_record_created",
        "scope1_record_amended",
        "doctor_rag_requested",
        "blockchain_verification_mismatch",
      ]),
  ]);

  if (scope1Result.error) throw scope1Result.error;
  if (grantProofResult.error) throw grantProofResult.error;
  if (auditProofResult.error) throw auditProofResult.error;

  const encryptionKey = requireEnv(["core"]).data.ENCRYPTION_MASTER_KEY;
  const recentScope1Records = ((scope1Result.data ?? []) as Scope1Row[]).map((row) => ({
    recordId: row.record_id,
    recordType: decryptScope1Field(row, "record_type", encryptionKey),
    title: decryptScope1Field(row, "title", encryptionKey),
    blockchainStatus: row.blockchain_status,
    blockchainTxHash: row.blockchain_tx_hash,
    createdAt: row.created_at,
  }));

  return {
    recentScope1Records,
    proofCounts: countProofStatuses([
      ...recentScope1Records.map((record) => record.blockchainStatus),
      ...(grantProofResult.data ?? []).map((row) => row.blockchain_status),
      ...(auditProofResult.data ?? []).map((row) => row.blockchain_status),
    ]),
  };
}

function decryptScope1Field(row: Scope1Row, field: "record_type" | "title", encryptionKey: string) {
  return decryptString(
    {
      ciphertext: row[`${field}_ciphertext`],
      iv: row[`${field}_iv`],
      tag: row[`${field}_tag`],
      keyVersion: row.key_version,
    },
    encryptionKey,
  );
}

function countProofStatuses(statuses: string[]) {
  return statuses.reduce(
    (counts, status) => {
      if (status === "pending") counts.pending += 1;
      if (status === "failed") counts.failed += 1;
      if (status === "confirmed") counts.confirmed += 1;
      return counts;
    },
    { pending: 0, failed: 0, confirmed: 0 },
  );
}
