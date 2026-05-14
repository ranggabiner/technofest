import { describe, expect, it } from "vitest";

import { resolveRoleFromRows } from "./roles";

describe("role resolution", () => {
  it("prioritizes allowlisted admin emails over OAuth intent", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-1",
      email: "Admin@Example.com",
      fullName: "Admin Demo",
      adminAllowlist: ["admin@example.com"],
      intent: "doctor",
      patient: null,
      doctor: null,
      admin: { admin_id: "admin-1", email: "admin@example.com", full_name: "Admin Demo" },
    });

    expect(role.kind).toBe("medical_admin");
  });

  it("keeps pending doctors locked out of doctor features", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-2",
      email: "doctor@example.com",
      fullName: "Dr Demo",
      adminAllowlist: [],
      intent: "doctor",
      patient: null,
      admin: null,
      doctor: {
        doctor_id: "doctor-1",
        email: "doctor@example.com",
        full_name: "Dr Demo",
        account_status: "pending",
        rejection_reason: null,
      },
    });

    expect(role).toMatchObject({ kind: "doctor", status: "pending", canAccessDoctorFeatures: false });
  });
});
