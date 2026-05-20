"use client";

import { useEffect } from "react";

import { AppToast, APP_TOAST_AUTO_DISMISS_MS } from "@/components/ui/app-toast";

export const STATUS_TOAST_AUTO_DISMISS_MS = APP_TOAST_AUTO_DISMISS_MS;

export function removeStatusToastParams(currentUrl: string) {
  const url = new URL(currentUrl);
  url.searchParams.delete("ai_status");
  url.searchParams.delete("ai_error");
  url.searchParams.delete("ai_toast");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function StatusToast({
  failedMessage,
  successMessage,
}: {
  failedMessage: string | null;
  successMessage: string | null;
}) {
  const message = failedMessage ?? successMessage;
  const isFailed = Boolean(failedMessage);

  useEffect(() => {
    if (!message) return;

    window.history.replaceState(
      window.history.state,
      "",
      removeStatusToastParams(window.location.href),
    );
  }, [message]);

  if (!message) return null;

  return (
    <AppToast
      message={message}
      tone={isFailed ? "danger" : "success"}
      triggerKey={`${isFailed ? "failed" : "success"}:${message}`}
    />
  );
}
