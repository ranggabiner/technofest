export type InviteAdminFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialInviteAdminFormState: InviteAdminFormState = {
  status: "idle",
  message: "",
};

export type RevokeAdminInvitationFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialRevokeAdminInvitationFormState: RevokeAdminInvitationFormState = {
  status: "idle",
  message: "",
};
