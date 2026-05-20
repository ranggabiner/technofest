"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { profileUpdateErrorMessage } from "@/lib/profile/errors";
import { readSelectedProfilePhotoFile } from "@/lib/profile/form-file";
import type { ProfileFormState } from "@/lib/profile/form-state";
import { updateAdminProfile } from "@/lib/profile/service";

export async function updateAdminProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const copy = await getDictionary();
  const role = await requireAdminRole();
  const profilePath = role.adminLevel === "superadmin" ? "/superadmin/profile" : "/admin/profile";

  try {
    await updateAdminProfile(role, {
      fullName: readText(formData, "full_name"),
      phoneNumber: readText(formData, "phone_number"),
      profilePhoto: readSelectedProfilePhotoFile(formData, "profile_photo"),
    });
  } catch (error) {
    return {
      status: "error",
      message: profileUpdateErrorMessage(error, copy.profile.photo.uploadErrors),
    };
  }

  revalidatePath("/admin/profile");
  revalidatePath("/superadmin/profile");
  revalidatePath("/admin/doctors");
  redirect(`${profilePath}?saved=1`);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
