import "server-only";

import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/config/env";
import { encryptBytes, encryptString } from "@/lib/crypto/server";
import { sha256Hex } from "@/lib/crypto/hashing";
import { createAdminClient } from "@/lib/supabase/admin";

import { validateKycFile, type KycFileLike } from "./files";

export type KycDocumentType = "str" | "sip" | "ktp";

export async function storeEncryptedKycFile(input: {
  doctorId: string;
  authUserId: string;
  documentType: KycDocumentType;
  file: File;
}) {
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

  const documentInsert = await admin.from("doctor_kyc_documents").upsert(
    {
      doctor_id: input.doctorId,
      document_type: input.documentType,
      file_id: fileId,
    },
    { onConflict: "doctor_id,document_type" },
  );

  if (documentInsert.error) throw documentInsert.error;

  return fileId;
}

export async function loadDecryptedKycDocument(input: { documentId: string }) {
  const env = requireEnv(["core"]);
  const admin = createAdminClient();
  const document = await admin
    .from("doctor_kyc_documents")
    .select(
      "document_id,document_type,secure_files(file_id,bucket_name,object_path,original_filename_ciphertext,original_filename_iv,original_filename_tag,mime_type)",
    )
    .eq("document_id", input.documentId)
    .single();

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
      keyVersion: "v1",
    },
    env.data.ENCRYPTION_MASTER_KEY,
  );

  return {
    bytes: decryptBytes(encrypted, env.data.ENCRYPTION_MASTER_KEY),
    mimeType: file.mime_type,
    filename,
  };
}
