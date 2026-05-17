import "server-only";

import { requireAdminRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const adminDoctorStatuses = ["pending", "approved", "rejected"] as const;
export type AdminDoctorStatus = (typeof adminDoctorStatuses)[number];

export const rowsPerPageOptions = [5, 10, 25, 50] as const;
export type AdminRowsPerPage = (typeof rowsPerPageOptions)[number];

const kycAuditActions = [
  "admin_doctor_approved",
  "admin_doctor_rejected",
  "doctor_kyc_email_notification_failed",
] as const;

const documentOrder = ["str", "sip", "ktp"] as const;

export type AdminDoctorDocument = {
  documentId: string | null;
  documentType: (typeof documentOrder)[number];
};

export type AdminDoctorReview = {
  doctorId: string;
  fullName: string;
  email: string;
  specialization: string | null;
  phoneNumber: string | null;
  ageYears: number | null;
  accountStatus: AdminDoctorStatus;
  createdAt: string;
  documents: AdminDoctorDocument[];
};

export type AdminAuditTrailItem = {
  logId: string;
  action: string;
  accessStatus: string;
  reason: string | null;
  doctorId: string | null;
  doctorName: string | null;
  createdAt: string;
};

export type AdminDashboardState = {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  priorityQueue: AdminDoctorReview[];
  auditTrail: AdminAuditTrailItem[];
};

export type AdminApprovalState = {
  status: AdminDoctorStatus;
  doctors: AdminDoctorReview[];
  page: number;
  pageSize: AdminRowsPerPage;
  totalDoctors: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
};

export type AdminDoctorDetailState = {
  doctor: {
    doctor_id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    specialization: string | null;
    account_status: string;
    rejection_reason: string | null;
    created_at: string;
    doctor_access_code: string | null;
    qr_code_token: string | null;
  };
  documents: Array<{
    document_id: string;
    document_type: string;
    created_at: string;
  }>;
  audits: Array<{
    log_id: string;
    action: string;
    access_status: string;
    reason: string | null;
    blockchain_status: string;
    blockchain_tx_hash: string | null;
    blockchain_last_error: string | null;
    created_at: string;
  }>;
};

export type AdminInvitationListItem = {
  invitationId: string;
  email: string;
  status: "pending" | "active";
  createdAt: string;
  acceptedAt: string | null;
};

export type AdminInvitationsState = {
  invitations: AdminInvitationListItem[];
};

type DoctorRow = {
  doctor_id: string;
  full_name: string;
  email: string;
  specialization: string | null;
  phone_number: string | null;
  age_years: number | null;
  account_status: string;
  created_at: string;
};

export function normalizeAdminDoctorStatus(value: string | null | undefined): AdminDoctorStatus {
  return adminDoctorStatuses.includes(value as AdminDoctorStatus)
    ? (value as AdminDoctorStatus)
    : "pending";
}

export function normalizeAdminPage(value: string | null | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function normalizeAdminRowsPerPage(value: string | null | undefined): AdminRowsPerPage {
  const parsed = Number(value);
  return rowsPerPageOptions.includes(parsed as AdminRowsPerPage)
    ? (parsed as AdminRowsPerPage)
    : 10;
}

export async function loadAdminDashboardState(): Promise<AdminDashboardState> {
  await requireAdminRole();

  const admin = createAdminClient();
  const [pendingCount, approvedCount, rejectedCount, queue, audits] = await Promise.all([
    countDoctorsByStatus("pending"),
    countDoctorsByStatus("approved"),
    countDoctorsByStatus("rejected"),
    admin
      .from("doctors")
      .select("doctor_id,full_name,email,specialization,phone_number,age_years,account_status,created_at")
      .not("onboarding_completed_at", "is", null)
      .eq("account_status", "pending")
      .order("created_at", { ascending: true })
      .limit(5),
    admin
      .from("audit_logs")
      .select("log_id,action,access_status,reason,doctor_id,created_at")
      .is("patient_id", null)
      .in("action", [...kycAuditActions])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (queue.error) throw queue.error;
  if (audits.error) throw audits.error;

  return {
    stats: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
    priorityQueue: await hydrateDoctors(queue.data ?? []),
    auditTrail: await hydrateAuditTrail(audits.data ?? []),
  };
}

export async function loadAdminApprovalState(input: {
  status?: string;
  page?: string;
  pageSize?: string;
}): Promise<AdminApprovalState> {
  await requireAdminRole();

  const admin = createAdminClient();
  const status = normalizeAdminDoctorStatus(input.status);
  const page = normalizeAdminPage(input.page);
  const pageSize = normalizeAdminRowsPerPage(input.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await admin
    .from("doctors")
    .select("doctor_id,full_name,email,specialization,phone_number,age_years,account_status,created_at", {
      count: "exact",
    })
    .not("onboarding_completed_at", "is", null)
    .eq("account_status", status)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;

  const totalDoctors = count ?? 0;
  const doctors = await hydrateDoctors(data ?? []);

  return {
    status,
    doctors,
    page,
    pageSize,
    totalDoctors,
    totalPages: Math.max(1, Math.ceil(totalDoctors / pageSize)),
    showingFrom: totalDoctors === 0 ? 0 : from + 1,
    showingTo: from + doctors.length,
  };
}

export async function loadAdminDoctorDetailState(doctorId: string): Promise<AdminDoctorDetailState> {
  await requireAdminRole();

  const admin = createAdminClient();
  const doctorResult = await admin
    .from("doctors")
    .select(
      "doctor_id,full_name,email,phone_number,specialization,account_status,rejection_reason,created_at,doctor_access_code,qr_code_token",
    )
    .eq("doctor_id", doctorId)
    .single();

  if (doctorResult.error) throw doctorResult.error;

  const documents = await admin
    .from("doctor_kyc_documents")
    .select("document_id,document_type,created_at")
    .eq("doctor_id", doctorId)
    .order("document_type", { ascending: true });

  if (documents.error) throw documents.error;

  const audits = await admin
    .from("audit_logs")
    .select("log_id,action,access_status,reason,blockchain_status,blockchain_tx_hash,blockchain_last_error,created_at")
    .eq("doctor_id", doctorId)
    .is("patient_id", null)
    .in("action", [...kycAuditActions])
    .order("created_at", { ascending: false })
    .limit(10);

  if (audits.error) throw audits.error;

  return {
    doctor: doctorResult.data,
    documents: documents.data ?? [],
    audits: audits.data ?? [],
  };
}

export async function loadAdminInvitationsState(adminId: string): Promise<AdminInvitationsState> {
  const role = await requireAdminRole();
  if (role.adminLevel !== "superadmin" || role.adminId !== adminId) {
    throw new Error("Superadmin access is required");
  }

  const { data, error } = await createAdminClient()
    .from("admin_invitations")
    .select("invitation_id,email,accepted_at,created_at")
    .eq("invited_by", adminId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    invitations: (data ?? []).map((invitation) => ({
      invitationId: invitation.invitation_id,
      email: invitation.email,
      status: invitation.accepted_at ? "active" : "pending",
      createdAt: invitation.created_at,
      acceptedAt: invitation.accepted_at,
    })),
  };
}

async function countDoctorsByStatus(status: AdminDoctorStatus) {
  const { count, error } = await createAdminClient()
    .from("doctors")
    .select("doctor_id", { count: "exact", head: true })
    .not("onboarding_completed_at", "is", null)
    .eq("account_status", status);

  if (error) throw error;
  return count ?? 0;
}

async function hydrateDoctors(rows: DoctorRow[]): Promise<AdminDoctorReview[]> {
  const documentMap = await loadDocumentsByDoctor(rows.map((row) => row.doctor_id));

  return rows.map((row) => ({
    doctorId: row.doctor_id,
    fullName: row.full_name,
    email: row.email,
    specialization: row.specialization,
    phoneNumber: row.phone_number,
    ageYears: row.age_years,
    accountStatus: normalizeAdminDoctorStatus(row.account_status),
    createdAt: row.created_at,
    documents: documentOrder.map((documentType) => ({
      documentType,
      documentId: documentMap.get(row.doctor_id)?.get(documentType) ?? null,
    })),
  }));
}

async function loadDocumentsByDoctor(doctorIds: string[]) {
  const documentMap = new Map<string, Map<(typeof documentOrder)[number], string>>();
  if (doctorIds.length === 0) return documentMap;

  const { data, error } = await createAdminClient()
    .from("doctor_kyc_documents")
    .select("doctor_id,document_id,document_type")
    .in("doctor_id", doctorIds);

  if (error) throw error;

  for (const document of data ?? []) {
    if (!documentOrder.includes(document.document_type as (typeof documentOrder)[number])) continue;
    const type = document.document_type as (typeof documentOrder)[number];
    const doctorDocuments = documentMap.get(document.doctor_id) ?? new Map();
    doctorDocuments.set(type, document.document_id);
    documentMap.set(document.doctor_id, doctorDocuments);
  }

  return documentMap;
}

async function hydrateAuditTrail(
  rows: Array<{
    log_id: string;
    action: string;
    access_status: string;
    reason: string | null;
    doctor_id: string | null;
    created_at: string;
  }>,
): Promise<AdminAuditTrailItem[]> {
  const doctorIds = [...new Set(rows.map((row) => row.doctor_id).filter(Boolean))] as string[];
  const doctorNames = new Map<string, string>();

  if (doctorIds.length > 0) {
    const { data, error } = await createAdminClient()
      .from("doctors")
      .select("doctor_id,full_name")
      .in("doctor_id", doctorIds);

    if (error) throw error;
    for (const doctor of data ?? []) {
      doctorNames.set(doctor.doctor_id, doctor.full_name);
    }
  }

  return rows.map((row) => ({
    logId: row.log_id,
    action: row.action,
    accessStatus: row.access_status,
    reason: row.reason,
    doctorId: row.doctor_id,
    doctorName: row.doctor_id ? doctorNames.get(row.doctor_id) ?? null : null,
    createdAt: row.created_at,
  }));
}
