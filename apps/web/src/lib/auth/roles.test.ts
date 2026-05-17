import { describe, expect, it } from "vitest";

import { publicRouteRedirectPath, resolveRoleFromRows, roleEntryPath, userRoleName } from "./roles";

describe("role resolution", () => {
  it("does not assign a default role when no MedProof profile exists", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-0",
      email: "new@example.com",
      fullName: "New Demo",
      adminAllowlist: [],
      intent: null,
      patient: null,
      doctor: null,
      admin: null,
    });

    expect(role).toBeNull();
  });

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

    expect(role).toMatchObject({ kind: "medical_admin", adminLevel: "superadmin" });
  });

  it("maps the local demo admin account to the admin role and admin dashboard", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-ranggabiner",
      email: "RanggaBiner@gmail.com",
      fullName: "Rangga Biner",
      adminAllowlist: ["ranggabiner@gmail.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: { admin_id: "admin-ranggabiner", email: "ranggabiner@gmail.com", full_name: "Rangga Biner" },
    });

    expect(role).toMatchObject({ kind: "medical_admin", adminId: "admin-ranggabiner", adminLevel: "superadmin" });
    expect(userRoleName(role!)).toBe("admin");
    expect(roleEntryPath(role!)).toBe("/admin/dashboard");
  });

  it("resolves active invited admins as normal admins", () => {
    const role = resolveRoleFromRows({
      authUserId: "invited-user",
      email: "invited@example.com",
      fullName: "Invited Admin",
      adminAllowlist: ["super@example.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: {
        admin_id: "admin-invited",
        email: "invited@example.com",
        full_name: "Invited Admin",
        admin_role: "admin",
        revoked_at: null,
      },
      adminInvitation: {
        invitation_id: "invite-1",
        email: "invited@example.com",
        accepted_at: "2026-05-17T10:00:00.000Z",
        revoked_at: null,
      },
    });

    expect(role).toMatchObject({ kind: "medical_admin", adminId: "admin-invited", adminLevel: "admin" });
  });

  it("does not grant invited admin access to a different Google email", () => {
    const role = resolveRoleFromRows({
      authUserId: "other-user",
      email: "other@example.com",
      fullName: "Other User",
      adminAllowlist: [],
      intent: null,
      patient: null,
      doctor: null,
      admin: null,
      adminInvitation: {
        invitation_id: "invite-1",
        email: "invited@example.com",
        accepted_at: null,
        revoked_at: null,
      },
    });

    expect(role).toBeNull();
  });

  it("does not resolve revoked invited admins", () => {
    const role = resolveRoleFromRows({
      authUserId: "revoked-user",
      email: "revoked@example.com",
      fullName: "Revoked Admin",
      adminAllowlist: ["super@example.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: {
        admin_id: "admin-revoked",
        email: "revoked@example.com",
        full_name: "Revoked Admin",
        admin_role: "admin",
        revoked_at: "2026-05-17T11:00:00.000Z",
      },
      adminInvitation: {
        invitation_id: "invite-2",
        email: "revoked@example.com",
        accepted_at: "2026-05-17T10:00:00.000Z",
        revoked_at: "2026-05-17T11:00:00.000Z",
      },
    });

    expect(role).toBeNull();
  });

  it("routes existing patients without requiring role selection again", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-1",
      email: "patient@example.com",
      fullName: "Patient Demo",
      adminAllowlist: [],
      intent: "doctor",
      patient: {
        patient_id: "patient-1",
        email: "patient@example.com",
        full_name: "Patient Demo",
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
      doctor: null,
      admin: null,
    });

    expect(role).toMatchObject({ kind: "patient", patientId: "patient-1" });
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
        onboarding_step: "profile",
        onboarding_completed_at: null,
      },
    });

    expect(role).toMatchObject({ kind: "doctor", status: "pending", canAccessDoctorFeatures: false });
    expect(roleEntryPath(role!)).toBe("/doctor/onboarding/step-1");
  });

  it("sends approved doctors to active doctor features", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-3",
      email: "approved@example.com",
      fullName: "Dr Approved",
      adminAllowlist: [],
      intent: null,
      patient: null,
      admin: null,
      doctor: {
        doctor_id: "doctor-2",
        email: "approved@example.com",
        full_name: "Dr Approved",
        account_status: "approved",
        rejection_reason: null,
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    expect(role).toMatchObject({ kind: "doctor", status: "approved", canAccessDoctorFeatures: true });
  });

  it("sends incomplete patients to the exact onboarding step", () => {
    const role = resolveRoleFromRows({
      authUserId: "user-4",
      email: "patient2@example.com",
      fullName: "Patient Demo",
      adminAllowlist: [],
      intent: null,
      doctor: null,
      admin: null,
      patient: {
        patient_id: "patient-2",
        email: "patient2@example.com",
        full_name: "Patient Demo",
        onboarding_step: "ai_consent",
        onboarding_completed_at: null,
      },
    });

    expect(roleEntryPath(role!)).toBe("/patient/onboarding/step-3");
  });

  it("sends completed patients and approved doctors to their dashboards", () => {
    const patientRole = resolveRoleFromRows({
      authUserId: "user-5",
      email: "done@example.com",
      fullName: "Done Demo",
      adminAllowlist: [],
      intent: null,
      doctor: null,
      admin: null,
      patient: {
        patient_id: "patient-5",
        email: "done@example.com",
        full_name: "Done Demo",
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    const doctorRole = resolveRoleFromRows({
      authUserId: "user-6",
      email: "doctor-done@example.com",
      fullName: "Dr Done",
      adminAllowlist: [],
      intent: null,
      patient: null,
      admin: null,
      doctor: {
        doctor_id: "doctor-6",
        email: "doctor-done@example.com",
        full_name: "Dr Done",
        account_status: "approved",
        rejection_reason: null,
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    expect(roleEntryPath(patientRole!)).toBe("/patient");
    expect(roleEntryPath(doctorRole!)).toBe("/doctor");
  });

  it("maps authenticated public-route visits to role entry paths", () => {
    const adminRole = resolveRoleFromRows({
      authUserId: "user-admin",
      email: "admin@example.com",
      fullName: "Admin Demo",
      adminAllowlist: ["admin@example.com"],
      intent: null,
      patient: null,
      doctor: null,
      admin: { admin_id: "admin-1", email: "admin@example.com", full_name: "Admin Demo" },
    });

    const patientRole = resolveRoleFromRows({
      authUserId: "user-patient",
      email: "patient@example.com",
      fullName: "Patient Demo",
      adminAllowlist: [],
      intent: null,
      doctor: null,
      admin: null,
      patient: {
        patient_id: "patient-1",
        email: "patient@example.com",
        full_name: "Patient Demo",
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    const approvedDoctorRole = resolveRoleFromRows({
      authUserId: "user-doctor-approved",
      email: "doctor@example.com",
      fullName: "Dr Approved",
      adminAllowlist: [],
      intent: null,
      patient: null,
      admin: null,
      doctor: {
        doctor_id: "doctor-1",
        email: "doctor@example.com",
        full_name: "Dr Approved",
        account_status: "approved",
        rejection_reason: null,
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    const pendingDoctorRole = resolveRoleFromRows({
      authUserId: "user-doctor-pending",
      email: "pending@example.com",
      fullName: "Dr Pending",
      adminAllowlist: [],
      intent: null,
      patient: null,
      admin: null,
      doctor: {
        doctor_id: "doctor-2",
        email: "pending@example.com",
        full_name: "Dr Pending",
        account_status: "pending",
        rejection_reason: null,
        onboarding_step: "complete",
        onboarding_completed_at: "2026-05-15T08:00:00.000Z",
      },
    });

    expect(publicRouteRedirectPath(null)).toBeNull();
    expect(publicRouteRedirectPath(adminRole)).toBe("/admin/dashboard");
    expect(publicRouteRedirectPath(patientRole)).toBe("/patient");
    expect(publicRouteRedirectPath(approvedDoctorRole)).toBe("/doctor");
    expect(publicRouteRedirectPath(pendingDoctorRole)).toBe("/doctor/status");
  });
});
