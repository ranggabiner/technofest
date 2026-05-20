export type ProfileFormState = {
  message: string | null;
  status: "idle" | "error";
};

export const initialProfileFormState: ProfileFormState = {
  message: null,
  status: "idle",
};
