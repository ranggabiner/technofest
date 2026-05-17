"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdminRole } from "@/lib/auth/session";
import { validateAdminInvitationEmail } from "@/lib/admin/invitations";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

import type { InviteAdminFormState, RevokeAdminInvitationFormState } from "./form-state";

export async function inviteAdminAction(
  _previousState: InviteAdminFormState,
  formData: FormData,
): Promise<InviteAdminFormState> {
  const copy = await getDictionary();
  const role = await requireSuperAdminRole();
  const validation = validateAdminInvitationEmail(String(formData.get("email") ?? ""));

  if (!validation.ok) {
    return {
      status: "error",
      message: validation.reason === "empty" ? copy.admin.addAdmin.emailRequired : copy.admin.addAdmin.emailInvalid,
    };
  }

  if (!role.adminId) {
    return {
      status: "error",
      message: copy.admin.addAdmin.adminRequired,
    };
  }

  const admin = createAdminClient();
  const [existingAdmin, existingInvitation] = await Promise.all([
    admin
      .from("medical_admins")
      .select("admin_id")
      .eq("email", validation.email)
      .is("revoked_at", null)
      .maybeSingle(),
    admin
      .from("admin_invitations")
      .select("invitation_id")
      .eq("email", validation.email)
      .is("revoked_at", null)
      .maybeSingle(),
  ]);

  if (existingAdmin.error) throw existingAdmin.error;
  if (existingInvitation.error) throw existingInvitation.error;

  if (existingAdmin.data || existingInvitation.data) {
    return {
      status: "error",
      message: copy.admin.addAdmin.duplicate,
    };
  }

  const insert = await admin.from("admin_invitations").insert({
    email: validation.email,
    invited_by: role.adminId,
  });

  if (insert.error) {
    if (insert.error.code === "23505") {
      return {
        status: "error",
        message: copy.admin.addAdmin.duplicate,
      };
    }
    throw insert.error;
  }

  revalidatePath("/admin/add-admin");

  return {
    status: "success",
    message: copy.admin.addAdmin.success,
  };
}

export async function revokeAdminInvitationAction(
  _previousState: RevokeAdminInvitationFormState,
  formData: FormData,
): Promise<RevokeAdminInvitationFormState> {
  const copy = await getDictionary();
  const role = await requireSuperAdminRole();
  const invitationId = String(formData.get("invitation_id") ?? "").trim();

  if (!role.adminId) {
    return {
      status: "error",
      message: copy.admin.addAdmin.adminRequired,
    };
  }

  if (!invitationId) {
    return {
      status: "error",
      message: copy.admin.addAdmin.revokeMissing,
    };
  }

  const admin = createAdminClient();
  const invitation = await admin
    .from("admin_invitations")
    .select("invitation_id,email,invited_by,revoked_at")
    .eq("invitation_id", invitationId)
    .eq("invited_by", role.adminId)
    .is("revoked_at", null)
    .maybeSingle();

  if (invitation.error) throw invitation.error;

  if (!invitation.data) {
    return {
      status: "error",
      message: copy.admin.addAdmin.revokeNotFound,
    };
  }

  if (invitation.data.email === role.email) {
    return {
      status: "error",
      message: copy.admin.addAdmin.revokeSelfBlocked,
    };
  }

  const targetAdmin = await admin
    .from("medical_admins")
    .select("admin_id,admin_role")
    .eq("email", invitation.data.email)
    .maybeSingle();

  if (targetAdmin.error) throw targetAdmin.error;

  if (targetAdmin.data?.admin_role === "superadmin") {
    return {
      status: "error",
      message: copy.admin.addAdmin.revokeSuperadminBlocked,
    };
  }

  const revokedAt = new Date().toISOString();
  const invitationUpdate = await admin
    .from("admin_invitations")
    .update({
      revoked_at: revokedAt,
      revoked_by: role.adminId,
      updated_at: revokedAt,
    })
    .eq("invitation_id", invitationId)
    .eq("invited_by", role.adminId)
    .is("revoked_at", null);

  if (invitationUpdate.error) throw invitationUpdate.error;

  if (targetAdmin.data) {
    const adminUpdate = await admin
      .from("medical_admins")
      .update({
        revoked_at: revokedAt,
        revoked_by: role.adminId,
        updated_at: revokedAt,
      })
      .eq("admin_id", targetAdmin.data.admin_id)
      .neq("admin_role", "superadmin")
      .is("revoked_at", null);

    if (adminUpdate.error) throw adminUpdate.error;
  }

  revalidatePath("/admin/add-admin");

  return {
    status: "success",
    message: copy.admin.addAdmin.revokeSuccess,
  };
}
