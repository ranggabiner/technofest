import "server-only";

import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/config/env";
import { decryptString, encryptBytes, encryptString } from "@/lib/crypto/server";
import { sha256Hex } from "@/lib/crypto/hashing";
import { createAdminClient } from "@/lib/supabase/admin";

import { validateKycFile, type KycFileLike } from "./files";
import { normalizeKycDocumentSummaries, type KycDocumentSummary } from "./summaries";
import { type KycDocumentType, requiredKycDocumentTypes } from "./types";

export { type KycDocumentType, requiredKycDocumentTypes } from "./types";

export async function storeEncryptedKycFile(input: {
  doctorId: string;
  authUserId: string;
  documentType: KycDocumentType;
  file: File;
}): Promise<{ fileId: string; documentId: string }> {
  const validation = validateKycFile(input.file as KycFileLike);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const fileId = randomUUID();
  const originalName = encryptString(input.file.name, env.data.ENCRYPTION_MASTER_KEY);
  const plaintextBytes = Buffer.from(await input.file.arrayBuffer());
  const encrypted = encryptBytes(plaintextBytes, env.data.ENCRYPTION_MASTER_KEY);
  const storageBytes = Buffer.from(JSON.stringify(encrypted), "utf8");
  const objectPath = `${input.authUserId}/kyc/${input.doctorId}/${fileId}.json`;

  const upload = await admin.storage
    .from("encrypted-kyc-documents")
    .upload(objectPath, storageBytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (upload.error) throw upload.error;

  const fileInsert = await admin.from("secure_files").insert({
    file_id: fileId,
    owner_role: "doctor",
    owner_id: input.doctorId,
    bucket_name: "encrypted-kyc-documents",
    object_path: objectPath,
    original_filename_ciphertext: originalName.ciphertext,
    original_filename_iv: originalName.iv,
    original_filename_tag: originalName.tag,
    mime_type: input.file.type,
    file_size_bytes: storageBytes.byteLength,
    file_sha256: sha256Hex(storageBytes),
    key_version: originalName.keyVersion,
  });

  if (fileInsert.error) throw fileInsert.error;

  const documentInsert = await admin
    .from("doctor_kyc_documents")
    .upsert(
      {
        doctor_id: input.doctorId,
        document_type: input.documentType,
        file_id: fileId,
      },
      { onConflict: "doctor_id,document_type" },
    )
    .select("document_id")
    .single();

  if (documentInsert.error) throw documentInsert.error;

  return { fileId, documentId: documentInsert.data.document_id };
}

export async function loadDecryptedKycDocument(input: { documentId: string }) {
  return loadKycDocumentFile(input);
}

export async function loadDoctorKycDocumentPreview(input: {
  documentId: string;
  doctorId: string;
}) {
  return loadKycDocumentFile(input);
}

async function loadKycDocumentFile(input: { documentId: string; doctorId?: string }) {
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  let query = admin
    .from("doctor_kyc_documents")
    .select(
      "document_id,document_type,doctor_id,secure_files(file_id,bucket_name,object_path,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,key_version)",
    )
    .eq("document_id", input.documentId);

  if (input.doctorId) query = query.eq("doctor_id", input.doctorId);

  const document = await query.single();

  if (document.error) throw document.error;

  const file = Array.isArray(document.data.secure_files)
    ? document.data.secure_files[0]
    : document.data.secure_files;

  if (!file) throw new Error("KYC file metadata not found");

  const download = await admin.storage.from(file.bucket_name).download(file.object_path);
  if (download.error) throw download.error;

  const encryptedText = await download.data.text();
  const encrypted = JSON.parse(encryptedText) as {
    ciphertext: string;
    iv: string;
    tag: string;
    keyVersion: string;
  };
  const { decryptBytes, decryptString } = await import("@/lib/crypto/server");
  const filename = decryptString(
    {
      ciphertext: file.original_filename_ciphertext,
      iv: file.original_filename_iv,
      tag: file.original_filename_tag,
      keyVersion: file.key_version,
    },
    env.data.ENCRYPTION_MASTER_KEY,
  );

  return {
    bytes: decryptBytes(encrypted, env.data.ENCRYPTION_MASTER_KEY),
    mimeType: file.mime_type,
    filename,
  };
}

export async function loadKycDocumentTypes(doctorId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctor_kyc_documents")
    .select("document_type")
    .eq("doctor_id", doctorId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.document_type as KycDocumentType));
}

export async function loadKycDocumentSummaries(doctorId: string) {
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("doctor_kyc_documents")
    .select(
      "document_id,document_type,secure_files(file_id,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type,file_size_bytes,key_version)",
    )
    .eq("doctor_id", doctorId);

  if (error) throw error;

  return normalizeKycDocumentSummaries(
    (data ?? []).map((row) => {
      const file = Array.isArray(row.secure_files) ? row.secure_files[0] : row.secure_files;

      return {
        documentType: row.document_type as KycDocumentType,
        documentId: row.document_id,
        fileId: file?.file_id ?? null,
        filename: file
          ? decryptString(
              {
                ciphertext: file.original_filename_ciphertext,
                iv: file.original_filename_iv,
                tag: file.original_filename_tag,
                keyVersion: file.key_version,
              },
              env.data.ENCRYPTION_MASTER_KEY,
            )
          : null,
        mimeType: file?.mime_type ?? null,
        fileSizeBytes: file?.file_size_bytes ?? null,
      };
    }),
  );
}

export async function loadKycDocumentSummary(input: {
  doctorId: string;
  documentType: KycDocumentType;
}): Promise<KycDocumentSummary> {
  const summaries = await loadKycDocumentSummaries(input.doctorId);
  const summary = summaries.find((document) => document.documentType === input.documentType);
  if (!summary) throw new Error("KYC document summary not found");
  return summary;
}

export function hasRequiredKycDocuments(documentTypes: Set<KycDocumentType>) {
  return requiredKycDocumentTypes.every((documentType) => documentTypes.has(documentType));
}
