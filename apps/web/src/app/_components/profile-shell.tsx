"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { FileText, LogOut, Settings, UserRound } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export type ProfileShellRole = "patient" | "doctor" | "admin";
export type ProfileConfirmCopy = Dictionary["profile"]["confirm"];

export function ProfileShell({
  role,
  copy,
  active,
  children,
}: {
  role: ProfileShellRole;
  copy: Dictionary["profile"];
  active: "profile" | "profiling";
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const navItems =
    role === "patient"
      ? [
          { href: "/patient/profile", label: copy.shell.profileSettings, icon: Settings, key: "profile" },
          { href: "/patient/profile/profiling", label: copy.shell.profiling, icon: FileText, key: "profiling" },
        ]
      : [
          {
            href: role === "doctor" ? "/doctor/profile" : "/admin/profile",
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
          <form action={signOutAction} className="md:mt-4">
            <ConfirmSubmitButton
              title={copy.confirm.logoutTitle}
              description={copy.confirm.logoutDescription}
              confirmLabel={copy.confirm.yes}
              cancelLabel={copy.confirm.no}
              className={cn(
                "inline-flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                "border-[color-mix(in_srgb,var(--color-error-red)_55%,white)] text-[var(--color-error-red)] hover:bg-[var(--color-error-red)] hover:text-white",
              )}
              data-profile-tone="soft-red"
            >
              <LogOut size={18} aria-hidden="true" />
              {copy.shell.logout}
            </ConfirmSubmitButton>
          </form>
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-[980px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}

export function ConfirmSubmitButton({
  title,
  description,
  confirmLabel,
  cancelLabel,
  children,
  className,
  ...props
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        const form = event.currentTarget.form;
        window.dispatchEvent(
          new CustomEvent("profile-confirm", {
            detail: {
              title,
              description,
              confirmLabel,
              cancelLabel,
              onConfirm: () => form?.requestSubmit(),
            },
          }),
        );
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function ProfileConfirmationHost() {
  const [state, setState] = useProfileConfirmationState();
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4" data-profile-confirmation="dialog">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-confirm-title"
        className="w-full max-w-md rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <h2 id="profile-confirm-title" className="text-lg font-semibold text-[var(--color-midnight)]">
          {state.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{state.description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setState(null)}
            className="min-h-10 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-4 text-sm font-medium text-[var(--color-graphite)] transition hover:bg-[var(--color-stone-surface)]"
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
            className="min-h-10 cursor-pointer rounded-full bg-[var(--color-midnight)] px-4 text-sm font-medium text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)]"
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
