import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: string;
};

export function encryptString(
  plaintext: string,
  base64Key: string,
  keyVersion = "v1",
): EncryptedValue {
  const key = decodeAesKey(base64Key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion,
  };
}

export function decryptString(value: EncryptedValue, base64Key: string): string {
  const key = decodeAesKey(base64Key);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptBytes(bytes: Buffer, base64Key: string): EncryptedValue {
  const key = decodeAesKey(base64Key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion: "v1",
  };
}

export function decryptBytes(value: EncryptedValue, base64Key: string): Buffer {
  const key = decodeAesKey(base64Key);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]);
}

function decodeAesKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.byteLength !== 32) {
    throw new Error("ENCRYPTION_MASTER_KEY must decode to 32 bytes");
  }
  return key;
}
