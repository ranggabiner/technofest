import { describe, expect, it } from "vitest";

import { canonicalJson, hmacSha256Hex, sha256Hex } from "./hashing";
import { decryptString, encryptString } from "./server";

const key = Buffer.alloc(32, 7).toString("base64");

describe("crypto utilities", () => {
  it("encrypts and decrypts strings with AES-256-GCM", () => {
    const encrypted = encryptString("dokumen STR", key);

    expect(encrypted.ciphertext).not.toContain("dokumen STR");
    expect(decryptString(encrypted, key)).toBe("dokumen STR");
  });

  it("serializes canonical JSON with stable key order", () => {
    expect(canonicalJson({ b: 1, a: { d: null, c: "x" } })).toBe(
      '{"a":{"c":"x","d":null},"b":1}',
    );
  });

  it("produces deterministic hash values", () => {
    expect(sha256Hex("abc")).toHaveLength(64);
    expect(hmacSha256Hex("pepper", "patient-id")).toBe(
      hmacSha256Hex("pepper", "patient-id"),
    );
  });
});
