import { randomBytes, randomInt } from "node:crypto";

export function createDoctorAccessCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function createQrCodeToken(): string {
  return `dqr_${randomBytes(24).toString("base64url")}`;
}
