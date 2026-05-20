export type ProfilePhotoUploadErrorMessages = {
  compression_failed: string;
  empty_file: string;
  file_too_large: string;
  network: string;
  server: string;
  unknown: string;
  unsupported_type: string;
};

const uploadReasons = new Set([
  "compression_failed",
  "empty_file",
  "file_too_large",
  "unsupported_type",
]);

export function profileUpdateErrorMessage(
  error: unknown,
  messages: ProfilePhotoUploadErrorMessages,
) {
  const errorMessage = readErrorMessage(error);

  if (errorMessage && uploadReasons.has(errorMessage)) {
    return messages[errorMessage as keyof ProfilePhotoUploadErrorMessages];
  }

  if (isNetworkError(error, errorMessage)) return messages.network;
  if (isApiError(error)) return messages.server;
  if (errorMessage) return errorMessage;

  return messages.unknown;
}

function readErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return null;
}

function isNetworkError(error: unknown, message: string | null) {
  if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) return true;
  return Boolean(message?.match(/failed to fetch|fetch failed|network|connection|timeout|timed out|econnreset|etimedout|enotfound|econnrefused|socket|abort/i));
}

function isApiError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return ["status", "statusCode", "code", "details", "hint"].some((key) => key in error);
}
