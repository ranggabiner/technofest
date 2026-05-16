"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/lib/auth/session";
import { validateAdminInvitationEmail } from "@/lib/admin/invitations";
import { getDictionary } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteAdminFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialInviteAdminFormState: InviteAdminFormState = {
  status: "idle",
  message: "",
};

export async function inviteAdminAction(
  _previousState: InviteAdminFormState,
  formData: FormData,
): Promise<InviteAdminFormState> {
  const copy = await getDictionary();
  const role = await requireAdminRole();
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
      .maybeSingle(),
    admin
      .from("admin_invitations")
      .select("invitation_id")
      .eq("email", validation.email)
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
