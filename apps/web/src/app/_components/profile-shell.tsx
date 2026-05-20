"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowLeft, FileText, Settings, UserRound } from "lucide-react";

import { PortalTransitionLink } from "@/app/_components/portal-navigation";
import { ProfileAvatar } from "@/app/_components/profile-avatar";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type { Dictionary } from "@/lib/i18n/dictionary";
import {
  createProfileFormSnapshot,
  isProfileFormSnapshotDirty,
  type ProfileFormSnapshot,
} from "@/lib/profile/form-dirty";
import { optimizeProfilePhotoFile } from "@/lib/profile/image-compression";
import { cn } from "@/lib/utils";
import { SaveStatusToast } from "./save-status-toast";

export type ProfileShellRole = "patient" | "doctor" | "admin";
export type ProfileConfirmCopy = Dictionary["profile"]["confirm"];

export function ProfileShell({
  role,
  copy,
  successToastMessages,
  active,
  backHref,
  profileHref,
  children,
}: {
  role: ProfileShellRole;
  copy: Dictionary["profile"];
  successToastMessages: Dictionary["common"]["successToast"];
  active: "profile" | "profiling";
  backHref: string;
  profileHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const navItems =
    role === "patient"
      ? [
          { href: profileHref, label: copy.shell.profileSettings, icon: Settings, key: "profile" },
          { href: "/patient/profile/profiling", label: copy.shell.profiling, icon: FileText, key: "profiling" },
        ]
      : [
          {
            href: profileHref,
            label: copy.shell.profile,
            icon: UserRound,
            key: "profile",
          },
        ];

  return (
    <div
      className="min-h-screen bg-[var(--color-warm-canvas)] md:grid md:grid-cols-[260px_1fr]"
      data-profile-shell="role-profile"
    >
      <aside className="border-b border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 md:min-h-screen md:border-b-0 md:border-r">
        <Link
          href={backHref}
          aria-label={copy.shell.back}
          className={cn(
            "mb-4 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-teal-deep)]",
            motion.iconButton,
          )}
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label={copy.shell.navLabel}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key || pathname === item.href;

            return (
              <PortalTransitionLink
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ash)] hover:bg-[color-mix(in_srgb,var(--color-teal-primary)_5%,transparent)] hover:text-[var(--color-teal-deep)] md:w-full",
                  motion.navItem,
                  isActive && "bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]",
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </PortalTransitionLink>
            );
          })}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-[980px] px-5 py-8 md:px-8">{children}</main>
      <SaveStatusToast messages={successToastMessages} />
    </div>
  );
}

export function ProfileFormControls({
  copy,
  disabled = false,
  saveLabel,
  cancelLabel,
  formRef,
  onCancel,
}: {
  copy: Dictionary["profile"];
  disabled?: boolean;
  saveLabel: string;
  cancelLabel: string;
  formRef: RefObject<HTMLFormElement | null>;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 grid gap-2 sm:flex sm:justify-end sm:gap-3">
      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-[10px] sm:w-auto"
        onClick={() =>
          openProfileConfirmation({
            title: copy.confirm.cancelTitle,
            description: copy.confirm.cancelDescription,
            confirmLabel: copy.confirm.yes,
            cancelLabel: copy.confirm.no,
            onConfirm: onCancel,
          })
        }
      >
        {cancelLabel}
      </Button>
      <PendingSubmitButton
        type="button"
        className="w-full rounded-[10px] sm:w-auto"
        disabled={disabled}
        loadingLabel={saveLabel}
        slotClassName="w-full sm:w-auto"
        onClick={() =>
          openProfileConfirmation({
            title: copy.confirm.saveTitle,
            description: copy.confirm.saveDescription,
            confirmLabel: copy.confirm.yes,
            cancelLabel: copy.confirm.no,
            onConfirm: () => formRef.current?.requestSubmit(),
          })
        }
      >
        {saveLabel}
      </PendingSubmitButton>
    </div>
  );
}

export type ProfileFormDirtyState = {
  isDirty: boolean;
  updateDirtyState: () => boolean;
};

export function useProfileFormDirty(formRef: RefObject<HTMLFormElement | null>): ProfileFormDirtyState {
  const initialSnapshotRef = useRef<ProfileFormSnapshot | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateDirtyState = useCallback(() => {
    const form = formRef.current;
    if (!form) {
      setIsDirty(false);
      return false;
    }

    const currentSnapshot = createProfileFormSnapshot(new FormData(form));
    initialSnapshotRef.current ??= currentSnapshot;
    const nextIsDirty = isProfileFormSnapshotDirty(initialSnapshotRef.current, currentSnapshot);
    setIsDirty(nextIsDirty);
    return nextIsDirty;
  }, [formRef]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    initialSnapshotRef.current = createProfileFormSnapshot(new FormData(form));
    setIsDirty(false);

    function handleChange() {
      updateDirtyState();
    }

    function handleReset() {
      window.setTimeout(updateDirtyState, 0);
    }

    form.addEventListener("input", handleChange);
    form.addEventListener("change", handleChange);
    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("input", handleChange);
      form.removeEventListener("change", handleChange);
      form.removeEventListener("reset", handleReset);
    };
  }, [formRef, updateDirtyState]);

  return { isDirty, updateDirtyState };
}

export function preventCleanProfileSubmit(
  event: FormEvent<HTMLFormElement>,
  formDirty: ProfileFormDirtyState,
) {
  if (!formDirty.updateDirtyState()) event.preventDefault();
}

export function ProfilePanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function ProfileFormPanel({
  className,
  children,
  formRef,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  formRef?: RefObject<HTMLFormElement | null>;
}) {
  return (
    <form
      ref={formRef}
      className={cn(
        "rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

export function ProfileIdentityPanel({
  children,
  className,
  photo,
}: {
  children: ReactNode;
  className?: string;
  photo?: ReactNode;
}) {
  return (
    <ProfilePanel className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {photo}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ProfilePanel>
  );
}

export function ProfileConfirmationHost() {
  const [state, setState] = useProfileConfirmationState();
  if (!state) return null;

  return (
    <ViewportModal className="bg-black/30" data-profile-confirmation="dialog">
      <ViewportModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-confirm-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
      >
        <h2 id="profile-confirm-title" className="text-lg font-semibold text-[var(--color-midnight)]">
          {state.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{state.description}</p>
        <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => setState(null)}
            className={cn(
              "min-h-11 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-4 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-stone-surface)]",
              motion.button,
            )}
          >
            {state.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              const onConfirm = state.onConfirm;
              setState(null);
              onConfirm();
            }}
            className={cn(
              "min-h-11 cursor-pointer rounded-full bg-[var(--color-midnight)] px-4 text-sm font-medium text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)]",
              motion.button,
            )}
          >
            {state.confirmLabel}
          </button>
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}

export function ProfilePhotoPicker({
  src,
  name,
  changeLabel,
  formId,
  inputName,
  onDirtyStateChange,
  onBusyChange,
  uploadErrors,
}: {
  src: string | null;
  name: string;
  changeLabel: string;
  formId: string;
  inputName: string;
  onDirtyStateChange?: () => void;
  onBusyChange?: (isBusy: boolean) => void;
  uploadErrors: Dictionary["profile"]["photo"]["uploadErrors"];
}) {
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [hasSelectedPhoto, setHasSelectedPhoto] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(src);
  const optimizationRequestRef = useRef(0);
  const previousObjectUrl = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearPreviewObjectUrl() {
    if (previousObjectUrl.current) URL.revokeObjectURL(previousObjectUrl.current);
    previousObjectUrl.current = null;
  }

  useEffect(() => {
    return () => {
      if (previousObjectUrl.current) URL.revokeObjectURL(previousObjectUrl.current);
    };
  }, []);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    function handleReset() {
      clearPreviewObjectUrl();
      setCompressionError(null);
      setHasSelectedPhoto(false);
      setPreviewSrc(src);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.removeAttribute("name");
      }
      window.setTimeout(() => onDirtyStateChange?.(), 0);
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [formId, onDirtyStateChange, src]);

  async function handleFileChange(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;

    const requestId = optimizationRequestRef.current + 1;
    optimizationRequestRef.current = requestId;
    input.value = "";
    input.removeAttribute("name");
    setHasSelectedPhoto(false);
    clearPreviewObjectUrl();
    setCompressionError(null);
    setPreviewSrc(src);
    setIsCompressing(true);
    onBusyChange?.(true);

    try {
      const optimized = await optimizeProfilePhotoFile(file);
      if (requestId !== optimizationRequestRef.current) return;

      if (!optimized.ok) {
        setCompressionError(uploadErrors[optimized.reason]);
        return;
      }

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(optimized.file);
      input.name = inputName;
      input.files = dataTransfer.files;
      setHasSelectedPhoto(true);

      const objectUrl = URL.createObjectURL(optimized.file);
      previousObjectUrl.current = objectUrl;
      setPreviewSrc(objectUrl);
    } catch {
      if (requestId === optimizationRequestRef.current) {
        setCompressionError(uploadErrors.compression_failed);
      }
    } finally {
      if (requestId === optimizationRequestRef.current) {
        setIsCompressing(false);
        onBusyChange?.(false);
        window.setTimeout(() => onDirtyStateChange?.(), 0);
      }
    }
  }

  return (
    <div className="grid max-w-36 shrink-0 gap-2">
      <div className="relative size-24">
        <button
          type="button"
          disabled={isCompressing}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group grid size-24 cursor-pointer place-items-center overflow-hidden rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] text-xl font-semibold text-[var(--color-midnight)] disabled:cursor-not-allowed disabled:opacity-70",
            motion.iconButton,
          )}
          aria-label={changeLabel}
        >
          <ProfileAvatar src={previewSrc} name={name} className="size-full text-xl" />
          <span className={cn("absolute inset-0 grid place-items-center bg-black/55 px-2 text-center text-xs font-semibold text-white opacity-0 group-hover:opacity-100", motion.fade)}>
            {changeLabel}
          </span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={hasSelectedPhoto ? inputName : undefined}
        form={formId}
        accept="image/jpeg,image/png"
        className="sr-only"
        disabled={isCompressing}
        onChange={(event) => void handleFileChange(event.currentTarget)}
      />
      {hasSelectedPhoto ? <input type="hidden" name={`${inputName}_selected`} value="1" form={formId} /> : null}
      {compressionError ? (
        <p role="alert" className="text-xs leading-5 text-[var(--color-error-red)]">
          {compressionError}
        </p>
      ) : null}
    </div>
  );
}

export function openProfileConfirmation(state: ConfirmationState) {
  window.dispatchEvent(new CustomEvent("profile-confirm", { detail: state }));
}

export type ConfirmationState = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

function useProfileConfirmationState() {
  const [state, setState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    function handleConfirmation(event: Event) {
      const detail = (event as CustomEvent<ConfirmationState>).detail;
      if (detail) setState(detail);
    }

    window.addEventListener("profile-confirm", handleConfirmation);
    return () => window.removeEventListener("profile-confirm", handleConfirmation);
  }, []);

  return [state, setState] as const;
}
