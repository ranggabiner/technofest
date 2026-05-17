export type KycUploadErrorMessages = {
  empty_file: string;
  file_too_large: string;
  unsupported_type: string;
  network: string;
  server: string;
  unknown: string;
};

type UploadErrorSource = "client" | "server";

export function kycUploadErrorMessage(
  error: unknown,
  messages: KycUploadErrorMessages,
  source: UploadErrorSource = "server",
) {
  const errorMessage = readErrorMessage(error);

  if (errorMessage === "empty_file") return messages.empty_file;
  if (errorMessage === "file_too_large") return messages.file_too_large;
  if (errorMessage === "unsupported_type") return messages.unsupported_type;
  if (isNetworkUploadError(error, errorMessage)) return messages.network;
  if (isApiUploadError(error) || (source === "server" && error instanceof Error)) {
    return messages.server;
  }

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

function isNetworkUploadError(error: unknown, message: string | null) {
  if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) {
    return true;
  }

  if (!message) return false;
  return /failed to fetch|fetch failed|network|connection|timeout|timed out|econnreset|etimedout|enotfound|econnrefused|und_err|socket|abort/i.test(
    message,
  );
}

function isApiUploadError(error: unknown) {
  if (!error || typeof error !== "object" || error instanceof Error) return false;

  return ["status", "statusCode", "code", "details", "hint"].some((key) => key in error);
}
