import type { AuthIntent } from "./roles";

export const roleIntentCookie = "medproof_role_intent";

export function parseAuthIntent(value: string | undefined): AuthIntent {
  if (value === "patient" || value === "doctor") return value;
  return null;
}
