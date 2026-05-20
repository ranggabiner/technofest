"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const APP_TOAST_AUTO_DISMISS_MS = 4000;
export const APP_TOAST_EXIT_MS = 180;

export type AppToastTone = "success" | "warning" | "danger" | "error" | "info";
export type AppToastTriggerKey = unknown;
type DismissedToast = {
  triggerKey: AppToastTriggerKey;
  message: string;
};

export function AppToast({
  message,
  tone = "success",
  triggerKey,
  icon,
  className,
  "data-save-status-toast": dataSaveStatusToast,
}: {
  message: string | null | undefined;
  tone?: AppToastTone;
  triggerKey?: AppToastTriggerKey;
  icon?: ReactNode;
  className?: string;
  "data-save-status-toast"?: string;
}) {
  const activeMessage = message && hasToastTrigger(triggerKey) ? message : null;
  const [dismissedToast, setDismissedToast] = useState<DismissedToast | null>(null);
  const [exitingToast, setExitingToast] = useState<DismissedToast | null>(null);
  const isDismissed = Boolean(activeMessage && isSameToast(dismissedToast, triggerKey, activeMessage));
  const isExiting = Boolean(activeMessage && isSameToast(exitingToast, triggerKey, activeMessage));
  const isVisible = Boolean(activeMessage && !isDismissed);

  useEffect(() => {
    if (!activeMessage || isDismissed || isExiting) return;

    const timer = window.setTimeout(() => {
      setExitingToast({ triggerKey, message: activeMessage });
    }, APP_TOAST_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [activeMessage, isDismissed, isExiting, triggerKey]);

  useEffect(() => {
    if (!exitingToast) return;

    const timer = window.setTimeout(() => {
      setDismissedToast(exitingToast);
      setExitingToast(null);
    }, APP_TOAST_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [exitingToast]);

  if (!activeMessage || !isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 w-[min(calc(100vw-2rem),420px)]"
      data-app-toast
      data-app-toast-state={isExiting ? "exiting" : "visible"}
      data-save-status-toast={dataSaveStatusToast}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex items-start gap-3 rounded-xl border bg-[var(--color-card)] p-4 text-sm shadow-[var(--shadow-elevated)]",
          tone === "success" && "border-[var(--color-midnight)] text-[var(--color-midnight)]",
          tone === "warning" && "border-[var(--color-warning-text)] text-[var(--color-warning-text)]",
          (tone === "error" || tone === "danger") && "border-[var(--color-error-red)] text-[var(--color-error-red)]",
          tone === "info" && "border-[var(--color-teal-deep)] text-[var(--color-midnight)]",
          className,
        )}
      >
        {icon ?? defaultIcon(tone)}
        <span className="min-w-0 flex-1">{message}</span>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded-md p-0.5 text-current opacity-70 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          onClick={() => setExitingToast({ triggerKey, message: activeMessage })}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function defaultIcon(tone: AppToastTone) {
  if (tone === "success") {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-teal-deep)]" aria-hidden="true" />;
  }

  if (tone === "info") {
    return <Info className="mt-0.5 size-4 shrink-0 text-[var(--color-teal-deep)]" aria-hidden="true" />;
  }

  return <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />;
}

function hasToastTrigger(triggerKey: AppToastTriggerKey) {
  if (triggerKey === null || triggerKey === undefined) return false;
  if (typeof triggerKey === "string") return triggerKey !== "";
  if (typeof triggerKey === "number") return triggerKey !== 0;
  return true;
}

function isSameToast(
  dismissedToast: DismissedToast | null,
  triggerKey: AppToastTriggerKey,
  message: string,
) {
  return Boolean(dismissedToast && dismissedToast.triggerKey === triggerKey && dismissedToast.message === message);
}
