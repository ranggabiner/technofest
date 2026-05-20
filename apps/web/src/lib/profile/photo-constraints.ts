export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_MAX_DIMENSION = 512;
export const PROFILE_PHOTO_JPEG_QUALITY = 0.78;
export const PROFILE_PHOTO_OUTPUT_TYPE = "image/jpeg";
export const PROFILE_PHOTO_OUTPUT_EXTENSION = ".jpg";

export const PROFILE_PHOTO_INPUT_TYPES = ["image/jpeg", "image/png"] as const;

export type ProfilePhotoInputType = (typeof PROFILE_PHOTO_INPUT_TYPES)[number];
export type ProfilePhotoValidationReason = "empty_file" | "file_too_large" | "unsupported_type";

export function isAllowedProfilePhotoInputType(contentType: string): contentType is ProfilePhotoInputType {
  return PROFILE_PHOTO_INPUT_TYPES.includes(contentType as ProfilePhotoInputType);
}
