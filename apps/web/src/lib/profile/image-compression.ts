import {
  isAllowedProfilePhotoInputType,
  PROFILE_PHOTO_JPEG_QUALITY,
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_MAX_DIMENSION,
  PROFILE_PHOTO_OUTPUT_EXTENSION,
  PROFILE_PHOTO_OUTPUT_TYPE,
  type ProfilePhotoValidationReason,
} from "./photo-constraints";

export type ProfilePhotoOptimizationReason = ProfilePhotoValidationReason | "compression_failed";

export type ProfilePhotoValidationResult =
  | { ok: true }
  | { ok: false; reason: ProfilePhotoValidationReason };

export type ProfilePhotoOptimizationResult =
  | { ok: true; file: File }
  | { ok: false; reason: ProfilePhotoOptimizationReason };

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ProfilePhotoResizePlan = {
  outputHeight: number;
  outputWidth: number;
  sourceSize: number;
  sourceX: number;
  sourceY: number;
};

export function validateProfilePhotoInputFile(file: File): ProfilePhotoValidationResult {
  if (file.size <= 0) return { ok: false, reason: "empty_file" };
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return { ok: false, reason: "file_too_large" };
  if (!isAllowedProfilePhotoInputType(file.type)) return { ok: false, reason: "unsupported_type" };

  return { ok: true };
}

export function profilePhotoResizePlan({ width, height }: ImageDimensions): ProfilePhotoResizePlan {
  const sourceSize = Math.min(width, height);
  const outputSize = Math.min(sourceSize, PROFILE_PHOTO_MAX_DIMENSION);

  return {
    sourceX: Math.round((width - sourceSize) / 2),
    sourceY: Math.round((height - sourceSize) / 2),
    sourceSize,
    outputWidth: outputSize,
    outputHeight: outputSize,
  };
}

export async function optimizeProfilePhotoFile(file: File): Promise<ProfilePhotoOptimizationResult> {
  const validation = validateProfilePhotoInputFile(file);
  if (!validation.ok) return validation;

  let imageUrl: string | null = null;

  try {
    const image = await loadImage(file);
    imageUrl = image.objectUrl;

    if (image.element.naturalWidth <= 0 || image.element.naturalHeight <= 0) {
      return { ok: false, reason: "compression_failed" };
    }

    const plan = profilePhotoResizePlan({
      width: image.element.naturalWidth,
      height: image.element.naturalHeight,
    });
    const canvas = document.createElement("canvas");
    canvas.width = plan.outputWidth;
    canvas.height = plan.outputHeight;

    const context = canvas.getContext("2d");
    if (!context) return { ok: false, reason: "compression_failed" };

    context.drawImage(
      image.element,
      plan.sourceX,
      plan.sourceY,
      plan.sourceSize,
      plan.sourceSize,
      0,
      0,
      plan.outputWidth,
      plan.outputHeight,
    );

    const blob = await canvasToBlob(canvas, PROFILE_PHOTO_OUTPUT_TYPE, PROFILE_PHOTO_JPEG_QUALITY);
    if (!blob || blob.size <= 0) return { ok: false, reason: "compression_failed" };

    return {
      ok: true,
      file: new File([blob], profilePhotoOutputFileName(file.name), {
        lastModified: Date.now(),
        type: PROFILE_PHOTO_OUTPUT_TYPE,
      }),
    };
  } catch {
    return { ok: false, reason: "compression_failed" };
  } finally {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(file: File): Promise<{ element: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ element: image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("profile_photo_decode_failed"));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, contentType: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, contentType, quality);
  });
}

function profilePhotoOutputFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]*$/, "").trim() || "profile-photo";
  return `${baseName}${PROFILE_PHOTO_OUTPUT_EXTENSION}`;
}
