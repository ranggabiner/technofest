"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const STATUS_TOAST_AUTO_DISMISS_MS = 4000;

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
  const [isVisible, setIsVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    window.history.replaceState(
      window.history.state,
      "",
      removeStatusToastParams(window.location.href),
    );

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, STATUS_TOAST_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message || !isVisible) return null;

  const isFailed = Boolean(failedMessage);

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-[720px]">
      <div
        className={`flex items-start gap-3 rounded-xl border bg-[var(--color-card)] p-4 text-sm shadow-[var(--shadow-elevated)] ${
          isFailed
            ? "border-[var(--color-error-red)] text-[var(--color-error-red)]"
            : "border-[var(--color-midnight)] text-[var(--color-midnight)]"
        }`}
      >
        {isFailed ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        )}
        {message}
      </div>
    </div>
  );
}
