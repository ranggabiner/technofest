import { describe, expect, it } from "vitest";

import { buildAdminInvitationEmail } from "./admin-invitation";

describe("admin invitation email", () => {
  it("includes the admin dashboard invitation, login link, and exact Google account warning", () => {
    const email = buildAdminInvitationEmail({
      invitedEmail: "new-admin@example.com",
      loginUrl: "https://medproof.example/login",
    });

    expect(email.subject).toBe("Undangan admin MedProof");
    expect(email.text).toContain("Anda diundang untuk mengakses dashboard Admin MedProof.");
    expect(email.text).toContain("https://medproof.example/login");
    expect(email.text).toContain("new-admin@example.com");
    expect(email.text).toContain("akun Google/email yang sama");
    expect(email.text).toContain("akses admin tidak akan diberikan");
  });
});
