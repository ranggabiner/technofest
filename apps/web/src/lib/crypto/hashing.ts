import { createHash, createHmac } from "node:crypto";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortCanonical);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortCanonical((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}
