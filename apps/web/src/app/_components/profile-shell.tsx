"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowLeft, FileText, Settings, UserRound } from "lucide-react";

import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { SaveStatusToast } from "./save-status-toast";

export type ProfileShellRole = "patient" | "doctor" | "admin";
export type ProfileConfirmCopy = Dictionary["profile"]["confirm"];

export function ProfileShell({
  role,
  copy,
  active,
  backHref,
  profileHref,
  children,
}: {
  role: ProfileShellRole;
  copy: Dictionary["profile"];
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
          className="mb-4 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] text-[var(--color-midnight)] transition hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-teal-deep)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label={copy.shell.navLabel}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key || pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-graphite)] transition hover:bg-[var(--color-error-red)] hover:text-white md:w-full",
                  isActive && "bg-[var(--color-stone-surface)] text-[var(--color-midnight)]",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-[980px] px-5 py-8 md:px-8">{children}</main>
      <SaveStatusToast message={copy.toast.saved} />
    </div>
  );
}

export function ProfileFormControls({
  copy,
  saveLabel,
  cancelLabel,
  formRef,
  onCancel,
}: {
  copy: Dictionary["profile"];
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

export function ProfileConfirmationHost() {
  const [state, setState] = useProfileConfirmationState();
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-3 py-4 sm:px-4" data-profile-confirmation="dialog">
      <div
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
            className="min-h-11 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-4 text-sm font-medium text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)]"
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
            className="min-h-11 cursor-pointer rounded-full bg-[var(--color-midnight)] px-4 text-sm font-medium text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)]"
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePhotoPicker({
  src,
  name,
  changeLabel,
}: {
  src: string | null;
  name: string;
  changeLabel: string;
}) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(src);
  const previousObjectUrl = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "M";

  useEffect(() => {
    return () => {
      if (previousObjectUrl.current) URL.revokeObjectURL(previousObjectUrl.current);
    };
  }, []);

  return (
    <div className="relative size-24 shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group grid size-24 cursor-pointer place-items-center overflow-hidden rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] text-xl font-semibold text-[var(--color-midnight)]"
        aria-label={changeLabel}
      >
        {previewSrc ? (
          <span
            className="size-full bg-cover bg-center"
            style={{ backgroundImage: `url("${previewSrc}")` }}
            aria-hidden="true"
          />
        ) : (
          <span>{initials}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/55 px-2 text-center text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
          {changeLabel}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (previousObjectUrl.current) URL.revokeObjectURL(previousObjectUrl.current);
          const objectUrl = URL.createObjectURL(file);
          previousObjectUrl.current = objectUrl;
          setPreviewSrc(objectUrl);
        }}
      />
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
