"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const SAVE_STATUS_TOAST_AUTO_DISMISS_MS = 4000;

type SaveStatusToastTrigger = string | number | null | undefined;

export function shouldShowSaveStatusToast(currentUrl: string) {
  const url = new URL(currentUrl);

  return (
    url.searchParams.has("saved") ||
    url.searchParams.has("updated") ||
    url.searchParams.get("scope1_status") === "saved" ||
    url.searchParams.get("save_status") === "saved"
  );
}

export function removeSaveStatusToastParams(currentUrl: string) {
  const url = new URL(currentUrl);
  url.searchParams.delete("saved");
  url.searchParams.delete("updated");
  url.searchParams.delete("scope1_status");
  url.searchParams.delete("save_status");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function SaveStatusToast({
  message,
  triggerKey,
}: {
  message: string;
  triggerKey?: SaveStatusToastTrigger;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const previousTriggerKeyRef = useRef<SaveStatusToastTrigger>(null);

  useEffect(() => {
    const hasUrlToast = shouldShowSaveStatusToast(window.location.href);
    const hasManualToast =
      triggerKey !== null &&
      triggerKey !== undefined &&
      triggerKey !== "" &&
      triggerKey !== 0 &&
      triggerKey !== previousTriggerKeyRef.current;

    previousTriggerKeyRef.current = triggerKey;

    if (!hasUrlToast && !hasManualToast) return;

    if (hasUrlToast) {
      window.history.replaceState(
        window.history.state,
        "",
        removeSaveStatusToastParams(window.location.href),
      );
    }

    const showTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 0);
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, SAVE_STATUS_TOAST_AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [triggerKey]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-[720px]" data-save-status-toast="saved">
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-xl border border-[var(--color-midnight)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-midnight)] shadow-[var(--shadow-elevated)]"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-teal-deep)]" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
