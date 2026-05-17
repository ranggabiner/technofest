export type AdminInvitationValidation =
  | { ok: true; email: string }
  | { ok: false; reason: "empty" | "invalid" };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAdminInvitationEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateAdminInvitationEmail(value: string): AdminInvitationValidation {
  const email = normalizeAdminInvitationEmail(value);

  if (!email) return { ok: false, reason: "empty" };
  if (!emailPattern.test(email)) return { ok: false, reason: "invalid" };

  return { ok: true, email };
}
