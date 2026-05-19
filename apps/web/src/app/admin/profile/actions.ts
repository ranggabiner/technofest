"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/lib/auth/session";
import { updateAdminProfile } from "@/lib/profile/service";

export async function updateAdminProfileAction(formData: FormData) {
  const role = await requireAdminRole();
  const profilePath = role.adminLevel === "superadmin" ? "/superadmin/profile" : "/admin/profile";

  await updateAdminProfile(role, {
    fullName: readText(formData, "full_name"),
    phoneNumber: readText(formData, "phone_number"),
  });

  revalidatePath("/admin/profile");
  revalidatePath("/superadmin/profile");
  revalidatePath("/admin/doctors");
  redirect(`${profilePath}?saved=1`);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
