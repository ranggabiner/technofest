import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { samplePdfBytes } from "./seed-sample-pdf.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const supabaseRoot = path.resolve(appRoot, "../supabase");

for (const envPath of [
  path.join(appRoot, ".env"),
  path.join(appRoot, ".env.local"),
  path.join(supabaseRoot, ".env"),
  path.join(supabaseRoot, ".env.local"),
]) {
  loadEnvFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionMasterKey = process.env.ENCRYPTION_MASTER_KEY;

if (!supabaseUrl || !serviceRoleKey || !encryptionMasterKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ENCRYPTION_MASTER_KEY.");
  process.exit(1);
}

if (Buffer.from(encryptionMasterKey, "base64").byteLength !== 32) {
  console.error("ENCRYPTION_MASTER_KEY must decode to 32 bytes.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const demoPassword = "test123";
const demoAccounts = [
  {
    id: "00000000-0000-0000-0000-000000009101",
    email: "superadmin@test.com",
    fullName: "Nadia Paramitha",
    role: "superadmin",
  },
  {
    id: "00000000-0000-0000-0000-000000009102",
    email: "admin@test.com",
    fullName: "Dewi Anggraini",
    role: "admin",
  },
  {
    id: "00000000-0000-0000-0000-000000009103",
    email: "pasien@test.com",
    fullName: "Alya Pramesti",
    role: "patient",
  },
  {
    id: "00000000-0000-0000-0000-000000009104",
    email: "dokter@test.com",
    fullName: "dr. Arif Wicaksana, Sp.PD",
    role: "doctor",
  },
];

const authUserIds = new Map();

async function listAllAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function upsertAuthUser(account, existingUsers) {
  const existing = existingUsers.find((user) => user.email?.toLowerCase() === account.email);
  const isPrimaryDemoAccount = demoAccounts.some((demoAccount) => demoAccount.email === account.email);
  const attributes = {
    email: account.email,
    password: isPrimaryDemoAccount ? demoPassword : `MedProof-${account.id.slice(-6)}!`,
    email_confirm: true,
    app_metadata: {
      provider: "email",
      providers: ["email"],
      demo_role: account.role,
    },
    user_metadata: {
      full_name: account.fullName,
    },
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    id: account.id,
    ...attributes,
  });
  if (error) throw error;
  existingUsers.push(data.user);
  return data.user;
}

async function upsertDomainRows() {
  const superadminAuthUserId = authUserIds.get("superadmin@test.com");
  const adminAuthUserId = authUserIds.get("admin@test.com");
  const patientAuthUserId = authUserIds.get("pasien@test.com");
  const doctorAuthUserId = authUserIds.get("dokter@test.com");
  const superadminId = "00000000-0000-0000-0000-000000009201";

  await assertOk(
    supabase.from("medical_admins").upsert(
      [
        {
          admin_id: superadminId,
          auth_user_id: superadminAuthUserId,
          full_name: "Nadia Paramitha",
          email: "superadmin@test.com",
          phone_number: "+62 812-1000-9101",
          admin_role: "superadmin",
          revoked_at: null,
          revoked_by: null,
          updated_at: new Date().toISOString(),
        },
        {
          admin_id: "00000000-0000-0000-0000-000000009202",
          auth_user_id: adminAuthUserId,
          full_name: "Dewi Anggraini",
          email: "admin@test.com",
          phone_number: "+62 812-1000-9102",
          admin_role: "admin",
          revoked_at: null,
          revoked_by: null,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "email" },
    ),
  );

  await upsertAdminInvitation(superadminId);

  await assertOk(
    supabase.from("patients").upsert(
      {
        patient_id: "00000000-0000-0000-0000-000000009401",
        auth_user_id: patientAuthUserId,
        full_name: "Alya Pramesti",
        email: "pasien@test.com",
        date_of_birth: "1993-08-17",
        ...encryptedColumns("profiling_data", JSON.stringify({
          city: "Bandung",
          occupation: "Manajer operasional kafe",
          lifestyle: "Sering kerja shift malam, minum kopi 2-3 gelas per hari, mulai rutin jalan kaki pagi.",
          known_history: "Riwayat migrain ringan dan gastritis episodik saat jadwal makan berantakan.",
          discovered_from: "Demo Technofest MedProof",
        })),
        onboarding_step: "complete",
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    ),
  );

  await assertOk(
    supabase.from("doctors").upsert(
      {
        doctor_id: "00000000-0000-0000-0000-000000009501",
        auth_user_id: doctorAuthUserId,
        full_name: "dr. Arif Wicaksana, Sp.PD",
        email: "dokter@test.com",
        phone_number: "+62 812-2200-9501",
        age_years: 41,
        gender: "male",
        specialization: "Spesialis Penyakit Dalam",
        account_status: "approved",
        verified_by: superadminId,
        verified_at: new Date().toISOString(),
        qr_code_token: "seed-doctor-qr-demo-manual",
        doctor_access_code: "119901",
        onboarding_step: "complete",
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    ),
  );
}

async function upsertRichDemoRows() {
  const data = buildRichDemoData();

  for (const file of data.storageObjects) {
    await uploadStorageObject(file);
  }

  await upsertRows("medical_admins", data.medicalAdmins, "admin_id");
  await upsertRows("admin_invitations", data.adminInvitations, "invitation_id");
  await upsertRows("patients", data.patients, "patient_id");
  await upsertRows("doctors", data.doctors, "doctor_id");
  await upsertRows("secure_files", data.secureFiles, "file_id");
  await upsertRows("doctor_kyc_documents", data.kycDocuments, "document_id");
  await upsertRows("ai_sessions", data.aiSessions, "session_id");
  await upsertRows("ai_messages", data.aiMessages, "message_id");
  await upsertRows("scope_2_mental", data.scope2Mental, "log_id");
  await upsertRows("scope_2_physical", data.scope2Physical, "log_id");
  await upsertRows("scope_1_medical_records", data.scope1Records, "record_id");
  await upsertRows("access_grants", data.accessGrants, "grant_id");
  await upsertRows("access_grant_attachment_permissions", data.attachmentPermissions, "grant_id,record_id");
  await upsertRows("access_grant_scope2_filters", data.scope2Filters, "grant_id,scope_kind");
  await upsertRows("audit_logs", data.auditLogs, "log_id");
}

function buildRichDemoData() {
  const superadminId = "00000000-0000-0000-0000-000000009201";
  const adminId = "00000000-0000-0000-0000-000000009202";
  const patientId = "00000000-0000-0000-0000-000000009401";
  const primaryDoctorId = "00000000-0000-0000-0000-000000009501";
  const primaryPatientAuthId = authUserIds.get("pasien@test.com");
  const primaryDoctorAuthId = authUserIds.get("dokter@test.com");
  const superadminAuthId = authUserIds.get("superadmin@test.com");
  const adminAuthId = authUserIds.get("admin@test.com");

  const supportPatients = patientFixtures.map((patient, index) => ({
    patient_id: patient.id,
    auth_user_id: authUserIds.get(patient.email),
    full_name: patient.fullName,
    email: patient.email,
    date_of_birth: patient.dateOfBirth,
    ...encryptedColumns("profiling_data", JSON.stringify(patient.profile)),
    onboarding_step: "complete",
    onboarding_completed_at: daysAgoIso(25 - index),
    created_at: daysAgoIso(45 - index),
    updated_at: daysAgoIso(index + 1),
  }));

  const doctors = doctorFixtures.map((doctor, index) => ({
    doctor_id: doctor.id,
    auth_user_id: authUserIds.get(doctor.email),
    full_name: doctor.fullName,
    email: doctor.email,
    phone_number: doctor.phone,
    age_years: doctor.ageYears,
    gender: doctor.gender,
    specialization: doctor.specialization,
    account_status: doctor.status,
    rejection_reason: doctor.status === "rejected" ? doctor.rejectionReason : null,
    verified_by: doctor.status === "pending" ? null : adminId,
    verified_at: doctor.status === "pending" ? null : daysAgoIso(20 - (index % 9)),
    qr_code_token: doctor.status === "approved" ? doctor.qrToken : null,
    doctor_access_code: doctor.status === "approved" ? doctor.accessCode : null,
    profile_photo_url: null,
    onboarding_step: "complete",
    onboarding_completed_at: daysAgoIso(30 - (index % 12)),
    created_at: daysAgoIso(48 - index),
    updated_at: daysAgoIso(index % 6),
  }));

  const medicalAdmins = [
    {
      admin_id: "00000000-0000-0000-0000-000000009211",
      auth_user_id: authUserIds.get("ops.admin@medproof.test"),
      full_name: "Rizky Mahendra",
      email: "ops.admin@medproof.test",
      phone_number: "+62 812-1000-9211",
      admin_role: "admin",
      revoked_at: null,
      revoked_by: null,
      created_at: daysAgoIso(35),
      updated_at: daysAgoIso(3),
    },
    {
      admin_id: "00000000-0000-0000-0000-000000009212",
      auth_user_id: authUserIds.get("audit.admin@medproof.test"),
      full_name: "Putri Sekar Ayu",
      email: "audit.admin@medproof.test",
      phone_number: "+62 812-1000-9212",
      admin_role: "admin",
      revoked_at: daysAgoIso(7),
      revoked_by: superadminId,
      created_at: daysAgoIso(60),
      updated_at: daysAgoIso(7),
    },
  ];

  const adminInvitations = [
    {
      invitation_id: "00000000-0000-0000-0000-000000009302",
      email: "ops.admin@medproof.test",
      invited_by: superadminId,
      accepted_at: daysAgoIso(34),
      revoked_at: null,
      revoked_by: null,
      created_at: daysAgoIso(35),
      updated_at: daysAgoIso(34),
    },
    {
      invitation_id: "00000000-0000-0000-0000-000000009303",
      email: "calon.admin@medproof.test",
      invited_by: superadminId,
      accepted_at: null,
      revoked_at: null,
      revoked_by: null,
      created_at: daysAgoIso(2),
      updated_at: daysAgoIso(2),
    },
    {
      invitation_id: "00000000-0000-0000-0000-000000009304",
      email: "audit.admin@medproof.test",
      invited_by: superadminId,
      accepted_at: daysAgoIso(58),
      revoked_at: daysAgoIso(7),
      revoked_by: superadminId,
      created_at: daysAgoIso(60),
      updated_at: daysAgoIso(7),
    },
  ];

  const storageObjects = [];
  const secureFiles = [];
  const kycDocuments = [];
  const medicalAttachmentFiles = [];

  for (const doctor of doctorFixtures) {
    for (const documentType of ["str", "sip", "ktp"]) {
      const fileId = uuidFromNumber(970000 + Number(doctor.id.slice(-4)) * 10 + documentTypeIndex(documentType));
      const authUserId = authUserIds.get(doctor.email);
      const objectPath = `${authUserId}/kyc/${doctor.id}/${documentType}.json`;
      const storagePayload = encryptedStoragePayload(samplePdfBytes());
      storageObjects.push({
        bucketName: "encrypted-kyc-documents",
        objectPath,
        bytes: storagePayload.bytes,
      });
      secureFiles.push({
        file_id: fileId,
        owner_role: "doctor",
        owner_id: doctor.id,
        bucket_name: "encrypted-kyc-documents",
        object_path: objectPath,
        ...encryptedColumns("original_filename", `${documentType.toUpperCase()}-${doctor.fullName}.pdf`),
        mime_type: "application/pdf",
        file_size_bytes: storagePayload.bytes.byteLength,
        file_sha256: sha256Hex(storagePayload.bytes),
        key_version: "v1",
        created_at: daysAgoIso(28 - (Number(doctor.id.slice(-1)) % 9)),
      });
      kycDocuments.push({
        document_id: uuidFromNumber(980000 + Number(doctor.id.slice(-4)) * 10 + documentTypeIndex(documentType)),
        doctor_id: doctor.id,
        document_type: documentType,
        file_id: fileId,
        created_at: daysAgoIso(27 - (Number(doctor.id.slice(-1)) % 9)),
      });
    }
  }

  for (const attachment of medicalAttachmentFixtures) {
    const storagePayload = encryptedStoragePayload(seedFileBytes(attachment));
    storageObjects.push({
      bucketName: "encrypted-medical-attachments",
      objectPath: `${primaryDoctorAuthId}/medical/${patientId}/${attachment.fileId}.json`,
      bytes: storagePayload.bytes,
    });
    medicalAttachmentFiles.push({
      file_id: attachment.fileId,
      owner_role: "patient",
      owner_id: patientId,
      bucket_name: "encrypted-medical-attachments",
      object_path: `${primaryDoctorAuthId}/medical/${patientId}/${attachment.fileId}.json`,
      ...encryptedColumns("original_filename", attachment.filename),
      mime_type: attachment.mimeType,
      file_size_bytes: storagePayload.bytes.byteLength,
      file_sha256: sha256Hex(storagePayload.bytes),
      key_version: "v1",
      created_at: daysAgoIso(attachment.daysAgo),
    });
  }

  secureFiles.push(...medicalAttachmentFiles);

  const aiSessions = [];
  const aiMessages = [];
  const scope2Mental = [];
  const scope2Physical = [];

  for (const [index, scenario] of journalScenarios.entries()) {
    const sessionId = uuidFromNumber(9601 + index);
    const createdAt = daysAgoIso(scenario.daysAgo, 9);
    const endedAt = scenario.active ? null : daysAgoIso(scenario.daysAgo, 9, 42);
    aiSessions.push({
      session_id: sessionId,
      patient_id: patientId,
      ...encryptedColumns("session_title", scenario.title),
      ...encryptedColumns("summary_text", scenario.summary ? JSON.stringify(scenario.summary) : null),
      ended_at: endedAt,
      end_reason: scenario.active ? null : scenario.endReason ?? "manual_end",
      summary_generated_at: scenario.summary ? daysAgoIso(scenario.daysAgo, 10) : null,
      summary_generation_status: scenario.summary ? "completed" : "pending",
      key_version: "v1",
      created_at: createdAt,
      updated_at: scenario.active ? minutesAgoIso(8) : endedAt,
    });

    for (const [messageIndex, message] of scenario.messages.entries()) {
      aiMessages.push({
        message_id: uuidFromNumber(990000 + index * 10 + messageIndex + 1),
        session_id: sessionId,
        patient_id: patientId,
        sender_role: message.role,
        ...encryptedColumns("message_text", message.text),
        key_version: "v1",
        created_at: daysAgoIso(scenario.daysAgo, 9, messageIndex * 7),
      });
    }

    if (scenario.mental) {
      scope2Mental.push({
        log_id: uuidFromNumber(96101 + index),
        patient_id: patientId,
        session_id: sessionId,
        log_date: dateDaysAgo(scenario.daysAgo),
        ...nullableEncryptedColumns("mood_score", scenario.mental.moodScore),
        ...nullableEncryptedColumns("anxiety_level", scenario.mental.anxietyLevel),
        ...nullableEncryptedColumns("sleep_hours", scenario.mental.sleepHours),
        ...nullableEncryptedColumns("trigger_notes", scenario.mental.triggerNotes),
        ...encryptedColumns("raw_quote", scenario.mental.rawQuote),
        ...encryptedColumns("is_emergency_flagged", String(Boolean(scenario.mental.emergency))),
        ...nullableEncryptedColumns("extraction_confidence", scenario.mental.confidence ?? "0.86"),
        ai_model: "deepseek-chat",
        schema_version: "v1",
        ...nullableEncryptedColumns("raw_extraction_jsonb", JSON.stringify(scenario.mental)),
        raw_quote_hash: sha256Hex(`${sessionId}:mental:${scenario.mental.rawQuote}`),
        key_version: "v1",
        created_at: daysAgoIso(scenario.daysAgo, 10),
        updated_at: daysAgoIso(scenario.daysAgo, 10),
      });
    }

    for (const [physicalIndex, item] of (scenario.physical ?? []).entries()) {
      scope2Physical.push({
        log_id: uuidFromNumber(96200 + index * 3 + physicalIndex),
        patient_id: patientId,
        session_id: sessionId,
        log_date: dateDaysAgo(scenario.daysAgo),
        ...nullableEncryptedColumns("symptom_type", item.symptomType),
        ...nullableEncryptedColumns("severity", item.severity),
        ...nullableEncryptedColumns("body_location", item.bodyLocation),
        ...nullableEncryptedColumns("duration_note", item.durationNote),
        ...encryptedColumns("raw_quote", item.rawQuote),
        ...encryptedColumns("is_emergency_flagged", String(Boolean(item.emergency))),
        ...nullableEncryptedColumns("extraction_confidence", item.confidence ?? "0.88"),
        ai_model: "deepseek-chat",
        schema_version: "v1",
        ...nullableEncryptedColumns("raw_extraction_jsonb", JSON.stringify(item)),
        raw_quote_hash: sha256Hex(`${sessionId}:physical:${item.rawQuote}`),
        key_version: "v1",
        created_at: daysAgoIso(scenario.daysAgo, 10),
        updated_at: daysAgoIso(scenario.daysAgo, 10),
      });
    }
  }

  const supportSessionIds = [];
  for (const [index, patient] of patientFixtures.slice(0, 6).entries()) {
    const sessionId = uuidFromNumber(9651 + index);
    supportSessionIds.push({ patientId: patient.id, sessionId });
    const scenario = supportJournalScenarios[index];
    aiSessions.push({
      session_id: sessionId,
      patient_id: patient.id,
      ...encryptedColumns("session_title", scenario.title),
      ...encryptedColumns("summary_text", JSON.stringify(scenario.summary)),
      ended_at: daysAgoIso(8 - index, 11),
      end_reason: "manual_end",
      summary_generated_at: daysAgoIso(8 - index, 11, 8),
      summary_generation_status: "completed",
      key_version: "v1",
      created_at: daysAgoIso(8 - index, 10),
      updated_at: daysAgoIso(8 - index, 11, 8),
    });
    aiMessages.push({
      message_id: uuidFromNumber(991000 + index * 2),
      session_id: sessionId,
      patient_id: patient.id,
      sender_role: "patient",
      ...encryptedColumns("message_text", scenario.patientMessage),
      key_version: "v1",
      created_at: daysAgoIso(8 - index, 10, 5),
    });
    aiMessages.push({
      message_id: uuidFromNumber(991000 + index * 2 + 1),
      session_id: sessionId,
      patient_id: patient.id,
      sender_role: "ai",
      ...encryptedColumns("message_text", scenario.aiMessage),
      key_version: "v1",
      created_at: daysAgoIso(8 - index, 10, 9),
    });
    scope2Physical.push({
      log_id: uuidFromNumber(96300 + index),
      patient_id: patient.id,
      session_id: sessionId,
      log_date: dateDaysAgo(8 - index),
      ...nullableEncryptedColumns("symptom_type", scenario.symptomType),
      ...nullableEncryptedColumns("severity", scenario.severity),
      ...nullableEncryptedColumns("body_location", scenario.bodyLocation),
      ...nullableEncryptedColumns("duration_note", scenario.durationNote),
      ...encryptedColumns("raw_quote", scenario.patientMessage),
      ...encryptedColumns("is_emergency_flagged", "false"),
      ...nullableEncryptedColumns("extraction_confidence", "0.84"),
      ai_model: "deepseek-chat",
      schema_version: "v1",
      ...nullableEncryptedColumns("raw_extraction_jsonb", JSON.stringify(scenario)),
      raw_quote_hash: sha256Hex(`${sessionId}:support:${scenario.patientMessage}`),
      key_version: "v1",
      created_at: daysAgoIso(8 - index, 11),
      updated_at: daysAgoIso(8 - index, 11),
    });
  }

  const scope1Records = scope1Fixtures.map((record, index) => ({
    record_id: record.id,
    patient_id: record.patientId ?? patientId,
    doctor_id: record.doctorId,
    amends_record_id: record.amendsRecordId ?? null,
    ...encryptedColumns("record_type", record.recordType),
    ...encryptedColumns("title", record.title),
    ...nullableEncryptedColumns("description", record.description),
    attachment_file_id: record.attachmentFileId ?? null,
    record_hash: `seed_scope1_${record.id.replaceAll("-", "")}`,
    blockchain_tx_hash: record.blockchainStatus === "confirmed" ? `0xseedscope1${index.toString().padStart(2, "0")}` : null,
    blockchain_status: record.blockchainStatus,
    blockchain_last_error: record.blockchainStatus === "failed" ? "amoy_rpc_timeout" : null,
    blockchain_attempt_count: record.blockchainStatus === "failed" ? 2 : 0,
    key_version: "v1",
    created_at: daysAgoIso(record.daysAgo, 13),
  }));

  const accessGrants = accessGrantFixtures.map((grant, index) => ({
    grant_id: grant.id,
    patient_id: grant.patientId,
    doctor_id: grant.doctorId,
    can_view_scope1: grant.scope1,
    can_view_scope2_mental: grant.mental,
    can_view_scope2_physical: grant.physical,
    can_download_attachments: grant.downloads,
    granted_at: daysAgoIso(grant.grantedDaysAgo, 8),
    expires_at: grant.expiresInDays >= 0 ? daysFromNowIso(grant.expiresInDays, 18) : daysAgoIso(Math.abs(grant.expiresInDays), 18),
    is_revoked: Boolean(grant.revokedDaysAgo),
    revoked_at: grant.revokedDaysAgo ? daysAgoIso(grant.revokedDaysAgo, 12) : null,
    replaced_by_grant_id: grant.replacedByGrantId ?? null,
    consent_hash: `seed_consent_${grant.id.replaceAll("-", "")}`,
    blockchain_tx_hash: grant.blockchainStatus === "confirmed" ? `0xseedgrant${index.toString().padStart(2, "0")}` : null,
    blockchain_status: grant.blockchainStatus,
    blockchain_last_error: grant.blockchainStatus === "failed" ? "amoy_tx_reverted" : null,
    blockchain_attempt_count: grant.blockchainStatus === "failed" ? 2 : 0,
    created_at: daysAgoIso(grant.grantedDaysAgo, 8),
  }));

  const attachmentPermissions = [
    {
      grant_id: "00000000-0000-0000-0000-000000009701",
      record_id: "00000000-0000-0000-0000-000000009801",
      created_at: daysAgoIso(5, 8),
    },
    {
      grant_id: "00000000-0000-0000-0000-000000009701",
      record_id: "00000000-0000-0000-0000-000000009802",
      created_at: daysAgoIso(5, 8),
    },
    {
      grant_id: "00000000-0000-0000-0000-000000009701",
      record_id: "00000000-0000-0000-0000-000000009811",
      created_at: daysAgoIso(4, 8),
    },
  ];

  const scope2Filters = [
    {
      grant_id: "00000000-0000-0000-0000-000000009701",
      scope_kind: "mental",
      mode: "last_n_days",
      window_days: 30,
      session_id: null,
      created_at: daysAgoIso(5, 8),
    },
    {
      grant_id: "00000000-0000-0000-0000-000000009701",
      scope_kind: "physical",
      mode: "last_n_days",
      window_days: 30,
      session_id: null,
      created_at: daysAgoIso(5, 8),
    },
    {
      grant_id: "00000000-0000-0000-0000-000000009702",
      scope_kind: "physical",
      mode: "selected_session",
      window_days: null,
      session_id: uuidFromNumber(9604),
      created_at: daysAgoIso(3, 9),
    },
    ...supportSessionIds.map((item, index) => ({
      grant_id: uuidFromNumber(9720 + index),
      scope_kind: "physical",
      mode: "selected_session",
      window_days: null,
      session_id: item.sessionId,
      created_at: daysAgoIso(6 - index, 8),
    })),
  ];

  const auditLogs = buildAuditLogs({
    primaryPatientAuthId,
    primaryDoctorAuthId,
    superadminAuthId,
    adminAuthId,
    patientId,
    primaryDoctorId,
    adminId,
    superadminId,
  });

  return {
    medicalAdmins,
    adminInvitations,
    patients: [
      {
        patient_id: patientId,
        auth_user_id: primaryPatientAuthId,
        full_name: "Alya Pramesti",
        email: "pasien@test.com",
        date_of_birth: "1993-08-17",
        ...encryptedColumns("profiling_data", JSON.stringify({
          city: "Bandung",
          occupation: "Manajer operasional kafe",
          lifestyle: "Shift malam, konsumsi kopi tinggi, olahraga ringan dua kali seminggu.",
          known_history: "Migrain ringan dan gastritis episodik.",
          discovered_from: "Demo Technofest MedProof",
        })),
        onboarding_step: "complete",
        onboarding_completed_at: daysAgoIso(21),
        created_at: daysAgoIso(42),
        updated_at: daysAgoIso(1),
      },
      ...supportPatients,
    ],
    doctors,
    storageObjects,
    secureFiles,
    kycDocuments,
    aiSessions,
    aiMessages,
    scope2Mental,
    scope2Physical,
    scope1Records,
    accessGrants,
    attachmentPermissions,
    scope2Filters,
    auditLogs,
  };
}

function buildAuditLogs(input) {
  const logs = [
    patientAudit(1, input.primaryPatientAuthId, "ai_processing_consent_accepted", "patient", input.patientId, input.patientId, null, "accepted", null, "confirmed", 21),
    patientAudit(2, input.primaryPatientAuthId, "patient_grant_created", "access_grant", "00000000-0000-0000-0000-000000009701", input.patientId, input.primaryDoctorId, "created", null, "confirmed", 5),
    patientAudit(3, input.primaryPatientAuthId, "patient_grant_created", "access_grant", "00000000-0000-0000-0000-000000009702", input.patientId, doctorFixtures[1].id, "created", null, "pending", 3),
    patientAudit(4, input.primaryPatientAuthId, "patient_grant_replaced", "access_grant", "00000000-0000-0000-0000-000000009706", input.patientId, doctorFixtures[6].id, "replaced", null, "confirmed", 2),
    patientAudit(5, input.primaryPatientAuthId, "patient_grant_revoked", "access_grant", "00000000-0000-0000-0000-000000009703", input.patientId, doctorFixtures[2].id, "revoked", null, "confirmed", 6),
    patientAudit(6, input.primaryDoctorAuthId, "doctor_patient_view_allowed", "access_grant", "00000000-0000-0000-0000-000000009701", input.patientId, input.primaryDoctorId, "allowed", null, "confirmed", 1),
    patientAudit(7, input.primaryDoctorAuthId, "doctor_rag_requested", "access_grant", "00000000-0000-0000-0000-000000009701", input.patientId, input.primaryDoctorId, "allowed", null, "pending", 1),
    patientAudit(8, authUserIds.get(doctorFixtures[2].email), "doctor_patient_view_denied", "access_grant", "00000000-0000-0000-0000-000000009703", input.patientId, doctorFixtures[2].id, "denied", "revoked", "confirmed", 4),
    patientAudit(9, input.primaryDoctorAuthId, "scope1_record_created", "scope_1_medical_record", "00000000-0000-0000-0000-000000009801", input.patientId, input.primaryDoctorId, "created", null, "confirmed", 13),
    patientAudit(10, input.primaryDoctorAuthId, "scope1_record_amended", "scope_1_medical_record", "00000000-0000-0000-0000-000000009804", input.patientId, input.primaryDoctorId, "amended", null, "failed", 7),
    patientAudit(11, input.primaryPatientAuthId, "doctor_access_code_lookup_failed", "doctor_lookup", null, input.patientId, null, "failed", "generic_lookup_failed", "pending", 2, "103.127.11.24"),
    patientAudit(12, input.primaryPatientAuthId, "blockchain_verification_mismatch", "scope_1_medical_record", "00000000-0000-0000-0000-000000009804", input.patientId, input.primaryDoctorId, "mismatch", "local_hash_mismatch", "confirmed", 1),
  ];

  for (let index = 0; index < accessGrantFixtures.length; index += 1) {
    const grant = accessGrantFixtures[index];
    logs.push(patientAudit(
      100 + index,
      grant.doctorId === input.primaryDoctorId ? input.primaryDoctorAuthId : authUserIds.get(doctorFixtures.find((doctor) => doctor.id === grant.doctorId)?.email ?? "dokter@test.com"),
      grant.revokedDaysAgo ? "doctor_patient_view_denied" : "doctor_patient_view_allowed",
      "access_grant",
      grant.id,
      grant.patientId,
      grant.doctorId,
      grant.revokedDaysAgo ? "denied" : "allowed",
      grant.revokedDaysAgo ? "revoked" : null,
      index % 4 === 0 ? "pending" : index % 5 === 0 ? "failed" : "confirmed",
      Math.max(1, grant.grantedDaysAgo - 1),
    ));
  }

  for (let index = 0; index < doctorFixtures.length; index += 1) {
    const doctor = doctorFixtures[index];
    if (doctor.status === "approved") {
      logs.push(adminAudit(300 + index, input.adminAuthId, "admin_doctor_approved", doctor.id, "approved", null, index % 3 === 0 ? "pending" : "confirmed", 20 - (index % 10)));
    }
    if (doctor.status === "rejected") {
      logs.push(adminAudit(340 + index, input.adminAuthId, "admin_doctor_rejected", doctor.id, "rejected", doctor.rejectionReason, "confirmed", 15 - (index % 7)));
    }
    if (index % 7 === 0) {
      logs.push(adminAudit(380 + index, input.adminAuthId, "doctor_kyc_email_notification_failed", doctor.id, "failed", "resend_demo_delivery_failed", "failed", 12 - (index % 5)));
    }
  }

  logs.push(
    adminAudit(450, input.superadminAuthId, "admin_doctor_approved", input.primaryDoctorId, "approved", null, "confirmed", 18),
    adminAudit(451, input.superadminAuthId, "doctor_kyc_email_notification_failed", doctorFixtures[4].id, "failed", "resend_demo_delivery_failed", "failed", 3),
  );

  return logs;
}

function patientAudit(seedNumber, actorAuthUserId, action, targetType, targetId, patientId, doctorId, status, reason, blockchainStatus, daysAgo, ipAddress = null) {
  const actorRole = action === "doctor_access_code_lookup_failed"
    ? "patient"
    : action.startsWith("doctor_") || action.startsWith("scope1_")
      ? "doctor"
      : "patient";
  return {
    log_id: uuidFromNumber(990100 + seedNumber),
    actor_auth_user_id: actorAuthUserId,
    actor_role: actorRole,
    action,
    target_type: targetType,
    target_id: targetId,
    patient_id: patientId,
    doctor_id: doctorId,
    access_status: status,
    reason,
    ip_address: ipAddress,
    audit_event_hash: `seed_audit_${990100 + seedNumber}`,
    blockchain_tx_hash: blockchainStatus === "confirmed" ? `0xseedaudit${seedNumber}` : null,
    blockchain_status: blockchainStatus,
    blockchain_last_error: blockchainStatus === "failed" ? "amoy_rpc_timeout" : null,
    blockchain_attempt_count: blockchainStatus === "failed" ? 2 : 0,
    created_at: daysAgoIso(daysAgo, 15),
  };
}

function adminAudit(seedNumber, actorAuthUserId, action, doctorId, status, reason, blockchainStatus, daysAgo) {
  return {
    log_id: uuidFromNumber(990100 + seedNumber),
    actor_auth_user_id: actorAuthUserId,
    actor_role: "medical_admin",
    action,
    target_type: "doctor",
    target_id: doctorId,
    patient_id: null,
    doctor_id: doctorId,
    access_status: status,
    reason,
    ip_address: null,
    audit_event_hash: `seed_admin_audit_${990100 + seedNumber}`,
    blockchain_tx_hash: blockchainStatus === "confirmed" ? `0xseedadminaudit${seedNumber}` : null,
    blockchain_status: blockchainStatus,
    blockchain_last_error: blockchainStatus === "failed" ? "resend_delivery_failed" : null,
    blockchain_attempt_count: blockchainStatus === "failed" ? 1 : 0,
    created_at: daysAgoIso(daysAgo, 14),
  };
}

async function upsertRows(table, rows, onConflict) {
  if (rows.length === 0) return;

  for (let index = 0; index < rows.length; index += 100) {
    await assertOk(
      supabase.from(table).upsert(rows.slice(index, index + 100), { onConflict }),
    );
  }
}

async function uploadStorageObject(file) {
  const { error } = await supabase.storage
    .from(file.bucketName)
    .upload(file.objectPath, file.bytes, {
      contentType: "application/octet-stream",
      upsert: true,
    });
  if (error) throw error;
}

async function upsertAdminInvitation(superadminId) {
  const existing = await supabase
    .from("admin_invitations")
    .select("invitation_id")
    .eq("email", "admin@test.com")
    .is("revoked_at", null)
    .maybeSingle();

  if (existing.error) throw existing.error;

  const payload = {
    email: "admin@test.com",
    invited_by: superadminId,
    accepted_at: new Date().toISOString(),
    revoked_at: null,
    revoked_by: null,
    updated_at: new Date().toISOString(),
  };

  if (existing.data?.invitation_id) {
    await assertOk(
      supabase
        .from("admin_invitations")
        .update(payload)
        .eq("invitation_id", existing.data.invitation_id),
    );
    return;
  }

  await assertOk(
    supabase.from("admin_invitations").insert({
      invitation_id: "00000000-0000-0000-0000-000000009301",
      ...payload,
    }),
  );
}

async function assertOk(operation) {
  const { error } = await operation;
  if (error) throw error;
}

function encryptString(plaintext, keyVersion = "v1") {
  return encryptBytes(Buffer.from(String(plaintext), "utf8"), keyVersion);
}

function encryptBytes(bytes, keyVersion = "v1") {
  const key = Buffer.from(encryptionMasterKey, "base64");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion,
  };
}

function encryptedColumns(prefix, value) {
  if (value === null || value === undefined) {
    return {
      [`${prefix}_ciphertext`]: null,
      [`${prefix}_iv`]: null,
      [`${prefix}_tag`]: null,
    };
  }
  const encrypted = encryptString(value);
  return {
    [`${prefix}_ciphertext`]: encrypted.ciphertext,
    [`${prefix}_iv`]: encrypted.iv,
    [`${prefix}_tag`]: encrypted.tag,
  };
}

function nullableEncryptedColumns(prefix, value) {
  return encryptedColumns(prefix, value);
}

function encryptedStoragePayload(value) {
  const plaintextBytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  const encrypted = encryptBytes(plaintextBytes);
  const bytes = Buffer.from(JSON.stringify(encrypted), "utf8");
  return { bytes };
}

function seedFileBytes(file) {
  if (file.mimeType === "application/pdf") return samplePdfBytes();
  return Buffer.from(String(file.content ?? ""), "utf8");
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function uuidFromNumber(number) {
  return `00000000-0000-0000-0000-${String(number).padStart(12, "0")}`;
}

function documentTypeIndex(type) {
  return { str: 1, sip: 2, ktp: 3 }[type] ?? 0;
}

function daysAgoIso(days, hour = 8, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function daysFromNowIso(days, hour = 18, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function minutesAgoIso(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function dateDaysAgo(days) {
  return daysAgoIso(days).slice(0, 10);
}

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = normalizeValue(rawValue);
  }
}

function normalizeValue(rawValue) {
  const value = rawValue.trim();
  const quote = value[0];
  if ((quote === "\"" || quote === "'") && value[value.length - 1] === quote) {
    return value.slice(1, -1);
  }
  return value;
}

const patientFixtures = [
  {
    id: "00000000-0000-0000-0000-000000009411",
    authUserId: "00000000-0000-0000-0000-000000009131",
    fullName: "Rafi Maulana",
    email: "rafi.maulana@medproof.test",
    dateOfBirth: "1988-04-12",
    profile: { city: "Jakarta Selatan", occupation: "Analis data", context: "Sering duduk lama dan pulang malam dari kantor SCBD." },
  },
  {
    id: "00000000-0000-0000-0000-000000009412",
    authUserId: "00000000-0000-0000-0000-000000009132",
    fullName: "Siti Nur Aisyah",
    email: "siti.aisyah@medproof.test",
    dateOfBirth: "1997-11-03",
    profile: { city: "Yogyakarta", occupation: "Guru SD", context: "Mengajar pagi, mengurus anak sore, alergi debu ringan." },
  },
  {
    id: "00000000-0000-0000-0000-000000009413",
    authUserId: "00000000-0000-0000-0000-000000009133",
    fullName: "Made Aditya Pranata",
    email: "made.aditya@medproof.test",
    dateOfBirth: "1982-06-29",
    profile: { city: "Denpasar", occupation: "Pemilik warung makan", context: "Banyak berdiri, jadwal makan tidak selalu teratur." },
  },
  {
    id: "00000000-0000-0000-0000-000000009414",
    authUserId: "00000000-0000-0000-0000-000000009134",
    fullName: "Lestari Wulandari",
    email: "lestari.wulandari@medproof.test",
    dateOfBirth: "1990-02-21",
    profile: { city: "Surabaya", occupation: "Desainer produk", context: "Pekerjaan layar lama, olahraga pilates akhir pekan." },
  },
  {
    id: "00000000-0000-0000-0000-000000009415",
    authUserId: "00000000-0000-0000-0000-000000009135",
    fullName: "Bayu Satrio",
    email: "bayu.satrio@medproof.test",
    dateOfBirth: "1979-09-08",
    profile: { city: "Bekasi", occupation: "Koordinator gudang", context: "Aktivitas fisik sedang dan perjalanan komuter panjang." },
  },
  {
    id: "00000000-0000-0000-0000-000000009416",
    authUserId: "00000000-0000-0000-0000-000000009136",
    fullName: "Melati Kartika",
    email: "melati.kartika@medproof.test",
    dateOfBirth: "1995-05-16",
    profile: { city: "Makassar", occupation: "Barista", context: "Shift berganti dan sering mencicipi kopi saat bekerja." },
  },
  {
    id: "00000000-0000-0000-0000-000000009417",
    authUserId: "00000000-0000-0000-0000-000000009137",
    fullName: "Taufik Hidayat",
    email: "taufik.hidayat@medproof.test",
    dateOfBirth: "1985-12-30",
    profile: { city: "Medan", occupation: "Sopir travel", context: "Duduk lama, pola tidur mengikuti jadwal keberangkatan." },
  },
];

const doctorFixtures = [
  { id: "00000000-0000-0000-0000-000000009501", authUserId: "00000000-0000-0000-0000-000000009104", email: "dokter@test.com", fullName: "dr. Arif Wicaksana, Sp.PD", specialization: "Spesialis Penyakit Dalam", status: "approved", accessCode: "119901", qrToken: "seed-doctor-qr-demo-manual", phone: "+62 812-2200-9501", ageYears: 41, gender: "male", city: "Bandung" },
  { id: "00000000-0000-0000-0000-000000009511", authUserId: "00000000-0000-0000-0000-000000009151", email: "ratna.lestari@medproof.test", fullName: "dr. Ratna Lestari, Sp.JP", specialization: "Spesialis Jantung", status: "approved", accessCode: "219511", qrToken: "seed-doctor-qr-ratna", phone: "+62 812-2200-9511", ageYears: 45, gender: "female", city: "Jakarta Pusat" },
  { id: "00000000-0000-0000-0000-000000009512", authUserId: "00000000-0000-0000-0000-000000009152", email: "hendra.saputra@medproof.test", fullName: "dr. Hendra Saputra, Sp.S", specialization: "Spesialis Saraf", status: "approved", accessCode: "219512", qrToken: "seed-doctor-qr-hendra", phone: "+62 812-2200-9512", ageYears: 39, gender: "male", city: "Yogyakarta" },
  { id: "00000000-0000-0000-0000-000000009513", authUserId: "00000000-0000-0000-0000-000000009153", email: "fajar.nugroho@medproof.test", fullName: "dr. Fajar Nugroho", specialization: "Dokter Umum", status: "pending", accessCode: null, qrToken: null, phone: "+62 812-2200-9513", ageYears: 32, gender: "male", city: "Depok" },
  { id: "00000000-0000-0000-0000-000000009514", authUserId: "00000000-0000-0000-0000-000000009154", email: "laila.rahma@medproof.test", fullName: "dr. Laila Rahma, Sp.KK", specialization: "Spesialis Kulit", status: "pending", accessCode: null, qrToken: null, phone: "+62 812-2200-9514", ageYears: 37, gender: "female", city: "Surabaya" },
  { id: "00000000-0000-0000-0000-000000009515", authUserId: "00000000-0000-0000-0000-000000009155", email: "wulan.permata@medproof.test", fullName: "dr. Wulan Permata, Sp.A", specialization: "Spesialis Anak", status: "approved", accessCode: "219515", qrToken: "seed-doctor-qr-wulan", phone: "+62 812-2200-9515", ageYears: 42, gender: "female", city: "Semarang" },
  { id: "00000000-0000-0000-0000-000000009516", authUserId: "00000000-0000-0000-0000-000000009156", email: "ahmad.faris@medproof.test", fullName: "dr. Ahmad Faris, Sp.OG", specialization: "Spesialis Obstetri dan Ginekologi", status: "rejected", rejectionReason: "Dokumen SIP tidak sesuai fasilitas praktik yang diajukan.", accessCode: null, qrToken: null, phone: "+62 812-2200-9516", ageYears: 44, gender: "male", city: "Malang" },
  { id: "00000000-0000-0000-0000-000000009517", authUserId: "00000000-0000-0000-0000-000000009157", email: "maya.prameswari@medproof.test", fullName: "dr. Maya Prameswari, Sp.PD", specialization: "Spesialis Penyakit Dalam", status: "approved", accessCode: "219517", qrToken: "seed-doctor-qr-maya-prameswari", phone: "+62 812-2200-9517", ageYears: 40, gender: "female", city: "Bandung" },
  { id: "00000000-0000-0000-0000-000000009518", authUserId: "00000000-0000-0000-0000-000000009158", email: "bima.santoso@medproof.test", fullName: "dr. Bima Santoso", specialization: "Dokter Umum", status: "approved", accessCode: "219518", qrToken: "seed-doctor-qr-bima", phone: "+62 812-2200-9518", ageYears: 36, gender: "male", city: "Bekasi" },
  { id: "00000000-0000-0000-0000-000000009519", authUserId: "00000000-0000-0000-0000-000000009159", email: "citra.dewi@medproof.test", fullName: "dr. Citra Dewi, Sp.M", specialization: "Spesialis Mata", status: "approved", accessCode: "219519", qrToken: "seed-doctor-qr-citra", phone: "+62 812-2200-9519", ageYears: 38, gender: "female", city: "Makassar" },
  { id: "00000000-0000-0000-0000-000000009520", authUserId: "00000000-0000-0000-0000-000000009160", email: "yusuf.hanif@medproof.test", fullName: "dr. Yusuf Hanif, Sp.THT", specialization: "Spesialis THT", status: "pending", accessCode: null, qrToken: null, phone: "+62 812-2200-9520", ageYears: 43, gender: "male", city: "Medan" },
  { id: "00000000-0000-0000-0000-000000009521", authUserId: "00000000-0000-0000-0000-000000009161", email: "tania.salsabila@medproof.test", fullName: "dr. Tania Salsabila, Sp.KJ", specialization: "Psikiater", status: "approved", accessCode: "219521", qrToken: "seed-doctor-qr-tania", phone: "+62 812-2200-9521", ageYears: 35, gender: "female", city: "Jakarta Selatan" },
  { id: "00000000-0000-0000-0000-000000009522", authUserId: "00000000-0000-0000-0000-000000009162", email: "bagus.mahendra@medproof.test", fullName: "dr. Bagus Mahendra, Sp.OT", specialization: "Spesialis Ortopedi", status: "approved", accessCode: "219522", qrToken: "seed-doctor-qr-bagus", phone: "+62 812-2200-9522", ageYears: 46, gender: "male", city: "Denpasar" },
  { id: "00000000-0000-0000-0000-000000009523", authUserId: "00000000-0000-0000-0000-000000009163", email: "sekar.larasati@medproof.test", fullName: "drg. Sekar Larasati", specialization: "Dokter Gigi", status: "rejected", rejectionReason: "Foto KTP tidak terbaca jelas pada unggahan demo.", accessCode: null, qrToken: null, phone: "+62 812-2200-9523", ageYears: 34, gender: "female", city: "Solo" },
  { id: "00000000-0000-0000-0000-000000009524", authUserId: "00000000-0000-0000-0000-000000009164", email: "reno.adiputra@medproof.test", fullName: "dr. Reno Adiputra, Sp.U", specialization: "Spesialis Urologi", status: "pending", accessCode: null, qrToken: null, phone: "+62 812-2200-9524", ageYears: 47, gender: "male", city: "Palembang" },
  { id: "00000000-0000-0000-0000-000000009525", authUserId: "00000000-0000-0000-0000-000000009165", email: "nurul.huda@medproof.test", fullName: "dr. Nurul Huda, Sp.PD", specialization: "Spesialis Penyakit Dalam", status: "approved", accessCode: "219525", qrToken: "seed-doctor-qr-nurul", phone: "+62 812-2200-9525", ageYears: 48, gender: "female", city: "Banjarmasin" },
  { id: "00000000-0000-0000-0000-000000009526", authUserId: "00000000-0000-0000-0000-000000009166", email: "vina.oktaviani@medproof.test", fullName: "dr. Vina Oktaviani, Sp.KFR", specialization: "Rehabilitasi Medik", status: "approved", accessCode: "219526", qrToken: "seed-doctor-qr-vina", phone: "+62 812-2200-9526", ageYears: 39, gender: "female", city: "Bogor" },
  { id: "00000000-0000-0000-0000-000000009527", authUserId: "00000000-0000-0000-0000-000000009167", email: "galih.prakoso@medproof.test", fullName: "dr. Galih Prakoso, Sp.P", specialization: "Spesialis Paru", status: "pending", accessCode: null, qrToken: null, phone: "+62 812-2200-9527", ageYears: 42, gender: "male", city: "Tangerang" },
  { id: "00000000-0000-0000-0000-000000009528", authUserId: "00000000-0000-0000-0000-000000009168", email: "intan.puspa@medproof.test", fullName: "dr. Intan Puspa, Sp.Rad", specialization: "Spesialis Radiologi", status: "approved", accessCode: "219528", qrToken: "seed-doctor-qr-intan", phone: "+62 812-2200-9528", ageYears: 37, gender: "female", city: "Jakarta Timur" },
  { id: "00000000-0000-0000-0000-000000009529", authUserId: "00000000-0000-0000-0000-000000009169", email: "reza.kurniawan@medproof.test", fullName: "dr. Reza Kurniawan, Sp.B", specialization: "Spesialis Bedah", status: "rejected", rejectionReason: "Nomor STR tidak cocok dengan nama pada dokumen identitas.", accessCode: null, qrToken: null, phone: "+62 812-2200-9529", ageYears: 50, gender: "male", city: "Pekanbaru" },
];

const journalScenarios = [
  { daysAgo: 18, title: "Migrain setelah lembur", messages: [{ role: "patient", text: "Kepala saya berdenyut setelah lembur dan kurang tidur dua malam." }, { role: "ai", text: "Saya catat keluhan sakit kepala berdenyut dan pola tidur yang berkurang. Jika memburuk, hubungi tenaga kesehatan." }], summary: { general: "Keluhan kepala setelah lembur dan kurang tidur.", mental: "Stres kerja sedang.", physical: "Sakit kepala berdenyut." }, mental: { moodScore: "6", anxietyLevel: "5", sleepHours: "4.5", triggerNotes: "Lembur dan tenggat kerja", rawQuote: "kurang tidur dua malam", emergency: false }, physical: [{ symptomType: "sakit kepala", severity: "6", bodyLocation: "kepala bagian kanan", durationNote: "sejak tadi malam", rawQuote: "Kepala saya berdenyut", emergency: false }] },
  { daysAgo: 16, title: "Perut perih saat telat makan", messages: [{ role: "patient", text: "Perut terasa perih kalau telat makan, terutama setelah minum kopi." }, { role: "ai", text: "Saya simpan pola perut perih terkait telat makan dan kopi. Ini bukan diagnosis." }], summary: { general: "Perut perih terkait telat makan.", mental: null, physical: "Keluhan pencernaan setelah kopi." }, physical: [{ symptomType: "perut perih", severity: "5", bodyLocation: "ulu hati", durationNote: "hilang timbul 2 hari", rawQuote: "Perut terasa perih kalau telat makan", emergency: false }] },
  { daysAgo: 14, title: "Tidur gelisah", messages: [{ role: "patient", text: "Minggu ini saya mudah cemas dan tidur sering terbangun." }, { role: "ai", text: "Saya catat kecemasan dan tidur terputus. Coba amati pemicu dan pertimbangkan konsultasi jika mengganggu aktivitas." }], summary: { general: "Tidur sering terbangun.", mental: "Kecemasan meningkat.", physical: null }, mental: { moodScore: "5", anxietyLevel: "7", sleepHours: "5", triggerNotes: "Beban kerja dan notifikasi malam", rawQuote: "mudah cemas dan tidur sering terbangun", emergency: false } },
  { daysAgo: 12, title: "Batuk setelah hujan", messages: [{ role: "patient", text: "Batuk kering sejak kehujanan, tenggorokan gatal tapi tidak demam." }, { role: "ai", text: "Saya catat batuk kering dan tenggorokan gatal tanpa demam. Pantau perubahan gejala." }], summary: { general: "Batuk kering setelah kehujanan.", mental: null, physical: "Tenggorokan gatal tanpa demam." }, physical: [{ symptomType: "batuk kering", severity: "4", bodyLocation: "tenggorokan", durationNote: "2 hari", rawQuote: "Batuk kering sejak kehujanan", emergency: false }] },
  { daysAgo: 10, title: "Nyeri lutut saat naik tangga", messages: [{ role: "patient", text: "Lutut kiri ngilu kalau naik tangga kantor." }, { role: "ai", text: "Saya catat nyeri lutut kiri saat naik tangga. Hindari memaksakan gerakan yang memperberat." }], summary: { general: "Nyeri lutut saat aktivitas tangga.", mental: null, physical: "Ngilu lutut kiri." }, physical: [{ symptomType: "nyeri lutut", severity: "5", bodyLocation: "lutut kiri", durationNote: "1 minggu", rawQuote: "Lutut kiri ngilu", emergency: false }] },
  { daysAgo: 8, title: "Mood membaik setelah olahraga", messages: [{ role: "patient", text: "Setelah jalan kaki pagi, mood terasa lebih stabil dan tidur lebih nyenyak." }, { role: "ai", text: "Saya catat dampak positif jalan kaki pada mood dan tidur." }], summary: { general: "Aktivitas jalan pagi membantu mood.", mental: "Mood lebih stabil dan tidur membaik.", physical: null }, mental: { moodScore: "8", anxietyLevel: "3", sleepHours: "7", triggerNotes: "Jalan kaki pagi", rawQuote: "mood terasa lebih stabil", emergency: false } },
  { daysAgo: 7, title: "Mual di perjalanan", messages: [{ role: "patient", text: "Saya mual saat perjalanan jauh dan agak pusing di mobil." }, { role: "ai", text: "Saya catat mual dan pusing saat perjalanan. Perhatikan hidrasi dan pola makan." }], summary: { general: "Mual saat perjalanan jauh.", mental: null, physical: "Mual dan pusing ringan." }, physical: [{ symptomType: "mual", severity: "4", bodyLocation: "perut", durationNote: "selama perjalanan", rawQuote: "mual saat perjalanan jauh", emergency: false }, { symptomType: "pusing", severity: "3", bodyLocation: "kepala", durationNote: "selama di mobil", rawQuote: "agak pusing di mobil", emergency: false }] },
  { daysAgo: 5, title: "Dada terasa berat", messages: [{ role: "patient", text: "Dada terasa berat sebentar setelah naik tangga cepat, lalu membaik saat istirahat." }, { role: "ai", text: "Keluhan dada perlu diperhatikan. Jika muncul lagi, berat, atau disertai sesak/keringat dingin, cari bantuan medis segera." }], summary: { general: "Dada berat singkat setelah aktivitas.", mental: "Ada kekhawatiran terhadap gejala.", physical: "Dada berat membaik saat istirahat." }, mental: { moodScore: "5", anxietyLevel: "6", sleepHours: "6", triggerNotes: "Khawatir setelah keluhan dada", rawQuote: "Dada terasa berat sebentar", emergency: false }, physical: [{ symptomType: "dada berat", severity: "6", bodyLocation: "dada tengah", durationNote: "beberapa menit", rawQuote: "Dada terasa berat sebentar", emergency: true }] },
  { daysAgo: 4, title: "Kontrol pola makan", messages: [{ role: "patient", text: "Saya mulai makan teratur dan perut lebih jarang perih." }, { role: "ai", text: "Saya catat perbaikan keluhan setelah pola makan lebih teratur." }], summary: { general: "Keluhan perut membaik dengan makan teratur.", mental: null, physical: "Perut lebih jarang perih." }, physical: [{ symptomType: "perut perih", severity: "2", bodyLocation: "ulu hati", durationNote: "membaik minggu ini", rawQuote: "perut lebih jarang perih", emergency: false }] },
  { daysAgo: 3, title: "Cemas jelang presentasi", messages: [{ role: "patient", text: "Besok presentasi, saya agak cemas tapi masih bisa kerja." }, { role: "ai", text: "Saya catat cemas ringan menjelang presentasi. Latihan singkat dan istirahat dapat membantu." }], summary: { general: "Cemas menjelang presentasi.", mental: "Cemas ringan, fungsi harian tetap baik.", physical: null }, mental: { moodScore: "6", anxietyLevel: "6", sleepHours: "6.5", triggerNotes: "Presentasi kerja", rawQuote: "agak cemas tapi masih bisa kerja", emergency: false } },
  { daysAgo: 2, title: "Sakit tenggorokan ringan", messages: [{ role: "patient", text: "Tenggorokan masih agak sakit tapi batuk sudah berkurang." }, { role: "ai", text: "Saya catat batuk berkurang dan sisa sakit tenggorokan ringan." }], summary: { general: "Batuk membaik.", mental: null, physical: "Sakit tenggorokan ringan tersisa." }, physical: [{ symptomType: "sakit tenggorokan", severity: "3", bodyLocation: "tenggorokan", durationNote: "tersisa hari ini", rawQuote: "Tenggorokan masih agak sakit", emergency: false }] },
  { daysAgo: 0, active: true, title: "Check-in hari ini", messages: [{ role: "patient", text: "Hari ini badan cukup enak, hanya sedikit lelah karena tidur telat." }, { role: "ai", text: "Saya catat kondisi umum cukup baik dan sedikit lelah terkait tidur telat." }], summary: null, mental: { moodScore: "7", anxietyLevel: "3", sleepHours: "5.5", triggerNotes: "Tidur telat", rawQuote: "sedikit lelah karena tidur telat", emergency: false } },
];

const supportJournalScenarios = [
  { title: "Nyeri punggung setelah duduk lama", patientMessage: "Punggung bawah nyeri setelah duduk lama di kantor.", aiMessage: "Saya catat nyeri punggung bawah setelah duduk lama.", summary: { general: "Nyeri punggung terkait posisi duduk.", physical: "Punggung bawah nyeri." }, symptomType: "nyeri punggung", severity: "5", bodyLocation: "punggung bawah", durationNote: "3 hari" },
  { title: "Alergi debu di kelas", patientMessage: "Hidung gatal dan bersin saat kelas berdebu.", aiMessage: "Saya catat bersin dan hidung gatal saat paparan debu.", summary: { general: "Keluhan alergi ringan saat paparan debu.", physical: "Bersin dan hidung gatal." }, symptomType: "bersin", severity: "4", bodyLocation: "hidung", durationNote: "saat berada di kelas" },
  { title: "Kram betis malam", patientMessage: "Betis kanan kram pada malam hari setelah berdiri lama.", aiMessage: "Saya catat kram betis kanan setelah berdiri lama.", summary: { general: "Kram betis malam.", physical: "Kram betis kanan." }, symptomType: "kram", severity: "5", bodyLocation: "betis kanan", durationNote: "malam hari" },
  { title: "Mata lelah", patientMessage: "Mata cepat lelah setelah desain di laptop seharian.", aiMessage: "Saya catat mata lelah terkait penggunaan laptop lama.", summary: { general: "Mata lelah karena layar.", physical: "Mata lelah." }, symptomType: "mata lelah", severity: "4", bodyLocation: "mata", durationNote: "setelah kerja layar" },
  { title: "Pergelangan tangan nyeri", patientMessage: "Pergelangan tangan kiri nyeri saat angkat barang.", aiMessage: "Saya catat nyeri pergelangan tangan kiri saat mengangkat barang.", summary: { general: "Nyeri pergelangan tangan saat aktivitas gudang.", physical: "Pergelangan kiri nyeri." }, symptomType: "nyeri pergelangan", severity: "5", bodyLocation: "pergelangan tangan kiri", durationNote: "1 minggu" },
  { title: "Sulit tidur setelah shift malam", patientMessage: "Setelah shift malam saya sulit tidur dan agak gelisah.", aiMessage: "Saya catat sulit tidur dan gelisah setelah shift malam.", summary: { general: "Sulit tidur terkait shift malam.", mental: "Gelisah ringan." }, symptomType: "sulit tidur", severity: "4", bodyLocation: "umum", durationNote: "setelah shift malam" },
];

const medicalAttachmentFixtures = [
  { fileId: "00000000-0000-0000-0000-000000009901", filename: "hasil-lab-hematologi-demo.pdf", mimeType: "application/pdf", daysAgo: 13 },
  { fileId: "00000000-0000-0000-0000-000000009902", filename: "ekg-demo.pdf", mimeType: "application/pdf", daysAgo: 5 },
  { fileId: "00000000-0000-0000-0000-000000009903", filename: "ringkasan-konsultasi-demo.pdf", mimeType: "application/pdf", daysAgo: 4 },
];

const scope1Fixtures = [
  { id: "00000000-0000-0000-0000-000000009801", doctorId: "00000000-0000-0000-0000-000000009501", recordType: "lab", title: "Hasil lab hematologi rutin", description: "Pemeriksaan darah lengkap demo. Nilai hemoglobin dalam rentang rujukan lokal.", attachmentFileId: "00000000-0000-0000-0000-000000009901", blockchainStatus: "confirmed", daysAgo: 13 },
  { id: "00000000-0000-0000-0000-000000009802", doctorId: "00000000-0000-0000-0000-000000009511", recordType: "action", title: "Evaluasi nyeri dada saat aktivitas", description: "Disarankan observasi pola gejala dan kontrol jika keluhan berulang.", attachmentFileId: "00000000-0000-0000-0000-000000009902", blockchainStatus: "pending", daysAgo: 5 },
  { id: "00000000-0000-0000-0000-000000009803", doctorId: "00000000-0000-0000-0000-000000009501", recordType: "prescription", title: "Catatan resep lambung demo", description: "Obat demo untuk keluhan lambung sesuai evaluasi dokter.", blockchainStatus: "confirmed", daysAgo: 11 },
  { id: "00000000-0000-0000-0000-000000009804", doctorId: "00000000-0000-0000-0000-000000009501", amendsRecordId: "00000000-0000-0000-0000-000000009803", recordType: "note", title: "Amendemen catatan lambung", description: "Koreksi jadwal minum obat demo setelah pasien melaporkan perubahan jam makan.", blockchainStatus: "failed", daysAgo: 7 },
  { id: "00000000-0000-0000-0000-000000009811", doctorId: "00000000-0000-0000-0000-000000009501", recordType: "note", title: "Ringkasan konsultasi kontrol demo", description: "Ringkasan demo hasil konsultasi kontrol dengan instruksi pemantauan keluhan dada dan jadwal kontrol ulang.", attachmentFileId: "00000000-0000-0000-0000-000000009903", blockchainStatus: "confirmed", daysAgo: 4 },
  { id: "00000000-0000-0000-0000-000000009805", doctorId: "00000000-0000-0000-0000-000000009512", recordType: "diagnosis", title: "Evaluasi migrain episodik", description: "Catatan demo riwayat sakit kepala berdenyut terkait kurang tidur.", blockchainStatus: "confirmed", daysAgo: 16 },
  { id: "00000000-0000-0000-0000-000000009806", doctorId: "00000000-0000-0000-0000-000000009517", recordType: "note", title: "Follow-up pola tidur dan stres", description: "Pasien diminta mencatat jam tidur dan pemicu kecemasan selama dua minggu.", blockchainStatus: "pending", daysAgo: 3 },
  { id: "00000000-0000-0000-0000-000000009807", doctorId: "00000000-0000-0000-0000-000000009521", recordType: "note", title: "Catatan konseling singkat", description: "Diskusi strategi relaksasi sebelum presentasi kerja.", blockchainStatus: "confirmed", daysAgo: 2 },
  { id: "00000000-0000-0000-0000-000000009808", doctorId: "00000000-0000-0000-0000-000000009518", recordType: "vaccine", title: "Riwayat vaksin influenza demo", description: "Pencatatan vaksin tahunan berdasarkan pengakuan pasien.", blockchainStatus: "confirmed", daysAgo: 21 },
  { id: "00000000-0000-0000-0000-000000009809", doctorId: "00000000-0000-0000-0000-000000009522", recordType: "xray", title: "Rujukan foto lutut demo", description: "Rujukan demo jika nyeri lutut kiri menetap setelah modifikasi aktivitas.", blockchainStatus: "pending", daysAgo: 9 },
  { id: "00000000-0000-0000-0000-000000009810", doctorId: "00000000-0000-0000-0000-000000009526", recordType: "action", title: "Latihan peregangan ringan", description: "Anjuran demo peregangan bertahap untuk keluhan lutut dan punggung.", blockchainStatus: "confirmed", daysAgo: 1 },
  ...patientFixtures.slice(0, 6).map((patient, index) => ({
    id: uuidFromNumber(9820 + index),
    patientId: patient.id,
    doctorId: "00000000-0000-0000-0000-000000009501",
    recordType: index % 2 === 0 ? "note" : "action",
    title: `Catatan kunjungan ${patient.fullName}`,
    description: `Catatan demo kunjungan pasien dari ${patient.profile.city}.`,
    blockchainStatus: index % 3 === 0 ? "pending" : "confirmed",
    daysAgo: 6 - index,
  })),
];

const accessGrantFixtures = [
  { id: "00000000-0000-0000-0000-000000009701", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009501", scope1: true, mental: true, physical: true, downloads: true, grantedDaysAgo: 5, expiresInDays: 10, blockchainStatus: "confirmed" },
  { id: "00000000-0000-0000-0000-000000009702", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009511", scope1: true, mental: false, physical: true, downloads: false, grantedDaysAgo: 3, expiresInDays: 4, blockchainStatus: "pending" },
  { id: "00000000-0000-0000-0000-000000009703", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009512", scope1: false, mental: true, physical: false, downloads: false, grantedDaysAgo: 12, expiresInDays: 8, revokedDaysAgo: 6, blockchainStatus: "confirmed" },
  { id: "00000000-0000-0000-0000-000000009704", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009518", scope1: true, mental: false, physical: false, downloads: false, grantedDaysAgo: 18, expiresInDays: -2, blockchainStatus: "failed" },
  { id: "00000000-0000-0000-0000-000000009705", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009517", scope1: false, mental: true, physical: true, downloads: false, grantedDaysAgo: 9, expiresInDays: 6, revokedDaysAgo: 2, replacedByGrantId: "00000000-0000-0000-0000-000000009706", blockchainStatus: "confirmed" },
  { id: "00000000-0000-0000-0000-000000009706", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009517", scope1: true, mental: true, physical: true, downloads: false, grantedDaysAgo: 2, expiresInDays: 14, blockchainStatus: "confirmed" },
  { id: "00000000-0000-0000-0000-000000009707", patientId: "00000000-0000-0000-0000-000000009401", doctorId: "00000000-0000-0000-0000-000000009521", scope1: false, mental: true, physical: false, downloads: false, grantedDaysAgo: 1, expiresInDays: 30, blockchainStatus: "pending" },
  ...patientFixtures.slice(0, 6).map((patient, index) => ({
    id: uuidFromNumber(9720 + index),
    patientId: patient.id,
    doctorId: "00000000-0000-0000-0000-000000009501",
    scope1: true,
    mental: index % 2 === 0,
    physical: true,
    downloads: index % 3 === 0,
    grantedDaysAgo: 6 - index,
    expiresInDays: 5 + index,
    blockchainStatus: index % 4 === 0 ? "pending" : "confirmed",
  })),
  { id: "00000000-0000-0000-0000-000000009730", patientId: "00000000-0000-0000-0000-000000009417", doctorId: "00000000-0000-0000-0000-000000009525", scope1: false, mental: false, physical: true, downloads: false, grantedDaysAgo: 10, expiresInDays: -1, blockchainStatus: "confirmed" },
];

const supportAuthAccounts = [
  { id: "00000000-0000-0000-0000-000000009111", email: "ops.admin@medproof.test", fullName: "Rizky Mahendra", role: "admin" },
  { id: "00000000-0000-0000-0000-000000009112", email: "audit.admin@medproof.test", fullName: "Putri Sekar Ayu", role: "admin" },
  ...patientFixtures.map((patient) => ({
    id: patient.authUserId,
    email: patient.email,
    fullName: patient.fullName,
    role: "patient",
  })),
  ...doctorFixtures
    .filter((doctor) => !demoAccounts.some((account) => account.email === doctor.email))
    .map((doctor) => ({
      id: doctor.authUserId,
      email: doctor.email,
      fullName: doctor.fullName,
      role: "doctor",
    })),
];

const existingUsers = await listAllAuthUsers();

for (const account of [...demoAccounts, ...supportAuthAccounts]) {
  const user = await upsertAuthUser(account, existingUsers);
  authUserIds.set(account.email, user.id);
}

await upsertDomainRows();
await upsertRichDemoRows();

console.log("Seeded demo manual login accounts:");
for (const account of demoAccounts) {
  console.log(`- ${account.email} / ${demoPassword}`);
}
