import { describe, expect, it } from "vitest";

import { buildScope1RecordProof, isScope1RecordType } from "./scope1";

describe("Scope 1 record helpers", () => {
  it("validates Sprint 1 record types", () => {
    expect(isScope1RecordType("lab")).toBe(true);
    expect(isScope1RecordType("xray")).toBe(true);
    expect(isScope1RecordType("diagnosis")).toBe(true);
    expect(isScope1RecordType("prescription")).toBe(true);
    expect(isScope1RecordType("vaccine")).toBe(true);
    expect(isScope1RecordType("action")).toBe(true);
    expect(isScope1RecordType("note")).toBe(true);
    expect(isScope1RecordType("billing")).toBe(false);
  });

  it("builds a record hash from encrypted payload only", () => {
    const proof = buildScope1RecordProof({
      pepper: "pepper-for-tests",
      recordId: "10000000-0000-0000-0000-000000000001",
      patientId: "20000000-0000-0000-0000-000000000001",
      doctorId: "30000000-0000-0000-0000-000000000001",
      amendsRecordId: null,
      recordType: { ciphertext: "enc-type", iv: "iv-type", tag: "tag-type" },
      title: { ciphertext: "enc-title", iv: "iv-title", tag: "tag-title" },
      description: { ciphertext: "enc-description", iv: "iv-description", tag: "tag-description" },
      attachmentFileId: "40000000-0000-0000-0000-000000000001",
      attachmentFileSha256: "encrypted-file-sha",
      keyVersion: "v1",
      createdAt: "2026-05-15T10:00:00.000Z",
    });

    expect(proof.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(proof.canonicalPayload).toContain('"proof_type":"scope_1_record"');
    expect(proof.canonicalPayload).toContain("enc-title");
    expect(proof.canonicalPayload).not.toContain("Diagnosis plaintext");
    expect(proof.canonicalPayload).not.toContain("10000000-0000-0000-0000-000000000001");
  });
});
