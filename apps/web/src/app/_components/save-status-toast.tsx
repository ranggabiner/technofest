"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AppToast,
  APP_TOAST_AUTO_DISMISS_MS,
  type AppToastTone,
} from "@/components/ui/app-toast";

export const SAVE_STATUS_TOAST_AUTO_DISMISS_MS = APP_TOAST_AUTO_DISMISS_MS;

type SaveStatusToastTrigger = string | number | null | undefined;

type SuccessToastMessages = {
  default: string;
  profileUpdated: string;
  changesSaved: string;
  documentUploaded: string;
  documentsUploaded: string;
  medicalRecordSaved: string;
  accessGranted: string;
  accessRevoked: string;
  doctorApproved: string;
  doctorRejected: string;
  adminInvitationCreated: string;
  adminAccessRevoked: string;
  onboardingStepSaved: string;
  onboardingSubmitted: string;
  aiSessionCreated: string;
  aiSessionFinished: string;
  summaryRetryStarted: string;
  blockchainRetryCompleted: string;
};

type UrlToastState = {
  key: number;
  message: string;
};

export function shouldShowSaveStatusToast(currentUrl: string) {
  return Boolean(resolveSaveStatusToastKind(currentUrl));
}

export function resolveSaveStatusToastMessage(
  currentUrl: string,
  messages: SuccessToastMessages,
  fallbackMessage = messages.default,
) {
  const kind = resolveSaveStatusToastKind(currentUrl);
  if (!kind) return null;
  return messages[kind] ?? fallbackMessage;
}

export function removeSaveStatusToastParams(currentUrl: string) {
  const url = new URL(currentUrl);
  url.searchParams.delete("saved");
  url.searchParams.delete("updated");
  url.searchParams.delete("scope1_status");
  url.searchParams.delete("save_status");
  url.searchParams.delete("access_status");
  url.searchParams.delete("submitted");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function SaveStatusToast({
  message,
  messages,
  triggerKey,
  tone = "success",
}: {
  message?: string;
  messages?: SuccessToastMessages;
  triggerKey?: SaveStatusToastTrigger;
  tone?: AppToastTone;
}) {
  const [urlToast, setUrlToast] = useState<UrlToastState | null>(null);
  const urlToastKeyRef = useRef(0);
  const resolvedMessages = useMemo(
    () => messages ?? fallbackMessages(message),
    [message, messages],
  );
  const hasManualToast = hasToastTrigger(triggerKey);

  useEffect(() => {
    const nextMessage = resolveSaveStatusToastMessage(
      window.location.href,
      resolvedMessages,
      message ?? resolvedMessages.default,
    );
    if (!nextMessage) return;

    window.history.replaceState(
      window.history.state,
      "",
      removeSaveStatusToastParams(window.location.href),
    );

    urlToastKeyRef.current += 1;
    setUrlToast({
      key: urlToastKeyRef.current,
      message: nextMessage,
    });
  }, [message, resolvedMessages]);

  if (!urlToast && !hasManualToast) return null;

  return (
    <AppToast
      data-save-status-toast="saved"
      message={urlToast?.message ?? message ?? resolvedMessages.default}
      tone={tone}
      triggerKey={urlToast ? `url:${urlToast.key}` : triggerKey}
    />
  );
}

function resolveSaveStatusToastKind(currentUrl: string): keyof SuccessToastMessages | null {
  const url = new URL(currentUrl);
  const saved = url.searchParams.get("saved");
  const updated = url.searchParams.get("updated");
  const scope1Status = url.searchParams.get("scope1_status");
  const saveStatus = url.searchParams.get("save_status");
  const accessStatus = url.searchParams.get("access_status");

  if (scope1Status === "saved") return "medicalRecordSaved";
  if (accessStatus === "granted") return "accessGranted";
  if (accessStatus === "revoked") return "accessRevoked";
  if (updated === "approved") return "doctorApproved";
  if (updated === "rejected") return "doctorRejected";
  if (url.searchParams.has("submitted")) return "onboardingSubmitted";

  if (saveStatus) {
    if (saveStatus === "doctor_documents_review") return "documentsUploaded";
    if (saveStatus === "patient_onboarding_complete") return "onboardingSubmitted";
    if (saveStatus.endsWith("_onboarding_step")) return "onboardingStepSaved";
    if (saveStatus === "saved") return "changesSaved";
    return "default";
  }

  if (saved) {
    if (saved === "letters") return "documentsUploaded";
    if (saved === "profile" || url.pathname.includes("/profile")) return "profileUpdated";
    return "changesSaved";
  }

  return null;
}

function fallbackMessages(message?: string): SuccessToastMessages {
  const fallback = message ?? "Changes saved successfully";
  return {
    default: fallback,
    profileUpdated: fallback,
    changesSaved: fallback,
    documentUploaded: fallback,
    documentsUploaded: fallback,
    medicalRecordSaved: fallback,
    accessGranted: fallback,
    accessRevoked: fallback,
    doctorApproved: fallback,
    doctorRejected: fallback,
    adminInvitationCreated: fallback,
    adminAccessRevoked: fallback,
    onboardingStepSaved: fallback,
    onboardingSubmitted: fallback,
    aiSessionCreated: fallback,
    aiSessionFinished: fallback,
    summaryRetryStarted: fallback,
    blockchainRetryCompleted: fallback,
  };
}

function hasToastTrigger(triggerKey: SaveStatusToastTrigger) {
  return triggerKey !== null && triggerKey !== undefined && triggerKey !== "" && triggerKey !== 0;
}
