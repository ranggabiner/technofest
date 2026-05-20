import "server-only";

import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/config/env";
import {
  isAllowedProfilePhotoInputType,
  PROFILE_PHOTO_MAX_BYTES,
  type ProfilePhotoValidationReason,
} from "@/lib/profile/photo-constraints";
import { createAdminClient } from "@/lib/supabase/admin";

export const PROFILE_PHOTO_BUCKET = "profile-photos";
export { PROFILE_PHOTO_MAX_BYTES, type ProfilePhotoValidationReason };

export type ProfilePhotoValidationResult =
  | { ok: true }
  | { ok: false; reason: ProfilePhotoValidationReason };

export type ReplaceProfilePhotoInput = {
  authUserId: string;
  file: File;
  previousPhotoUrl: string | null;
  savePhotoUrl: (profilePhotoUrl: string) => Promise<void>;
};

export type ReplaceProfilePhotoResult = {
  profilePhotoUrl: string;
  objectPath: string;
};

export function validateProfilePhotoFile(file: File): ProfilePhotoValidationResult {
  if (file.size <= 0) return { ok: false, reason: "empty_file" };
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return { ok: false, reason: "file_too_large" };
  if (!isAllowedProfilePhotoInputType(file.type)) return { ok: false, reason: "unsupported_type" };

  return { ok: true };
}

export async function replaceProfilePhoto({
  authUserId,
  file,
  previousPhotoUrl,
  savePhotoUrl,
}: ReplaceProfilePhotoInput): Promise<ReplaceProfilePhotoResult> {
  const validation = validateProfilePhotoFile(file);
  if (!validation.ok) throw new Error(validation.reason);

  const admin = createAdminClient();
  const objectPath = profilePhotoObjectPath(authUserId, file);
  const upload = await admin.storage.from(PROFILE_PHOTO_BUCKET).upload(objectPath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) throw upload.error;

  const { data } = admin.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(objectPath);
  const profilePhotoUrl = data.publicUrl;

  try {
    await savePhotoUrl(profilePhotoUrl);
  } catch (error) {
    await removeProfilePhotoObject(objectPath);
    throw error;
  }

  const previousObjectPath = profilePhotoObjectPathFromPublicUrl(previousPhotoUrl, authUserId);
  if (previousObjectPath && previousObjectPath !== objectPath) {
    await removeProfilePhotoObject(previousObjectPath);
  }

  return {
    profilePhotoUrl,
    objectPath,
  };
}

export function profilePhotoObjectPath(authUserId: string, file: File) {
  return `${authUserId}/profile/${randomUUID()}${profilePhotoExtension(file.type)}`;
}

export function profilePhotoObjectPathFromPublicUrl(
  photoUrl: string | null | undefined,
  authUserId: string,
) {
  if (!photoUrl) return null;

  const env = requireEnv(["supabase"]);
  let parsedUrl: URL;
  let supabaseUrl: URL;

  try {
    parsedUrl = new URL(photoUrl);
    supabaseUrl = new URL(env.data.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    return null;
  }

  if (parsedUrl.origin !== supabaseUrl.origin) return null;

  const marker = `/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`;
  if (!parsedUrl.pathname.startsWith(marker)) return null;

  const objectPath = decodeURIComponent(parsedUrl.pathname.slice(marker.length));
  return objectPath.startsWith(`${authUserId}/profile/`) ? objectPath : null;
}

async function removeProfilePhotoObject(objectPath: string) {
  try {
    await createAdminClient().storage.from(PROFILE_PHOTO_BUCKET).remove([objectPath]);
  } catch {
    // Row update already points at the replacement or failed; stale object cleanup is best-effort.
  }
}

function profilePhotoExtension(contentType: string) {
  return contentType === "image/png" ? ".png" : ".jpg";
}
