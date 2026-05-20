import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  FileText,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Field, Input, Label } from "@/components/ui/form";
import { motion } from "@/components/ui/motion";
import type { getDictionary } from "@/lib/i18n/server";
import { landingLoginHref } from "@/lib/i18n/marketing";
import { cn } from "@/lib/utils";

import { startGoogleOAuthAction, startManualLoginAction } from "../actions";
import { DemoCredentialCopyButton } from "../demo-credential-copy-button";

const featureIcons = [Bot, ShieldCheck, FileText] as const;
const optionIcons = [FlaskConical, ShieldCheck] as const;
const demoCredentialEmails = ["dokter@test.com", "pasien@test.com", "superadmin@test.com", "admin@test.com"] as const;

export type LoginCopy = Awaited<ReturnType<typeof getDictionary>>["marketing"]["login"];
export type LoginSearchParams = {
  error?: string | string[];
};
export type LoginOption = LoginCopy["optionCards"][number] & {
  href: string;
};

type LoginPageShellProps = {
  authError: string | null;
  copy: LoginCopy;
  description: string;
  desktopAside?: ReactNode;
  desktopBreakpoint?: "md" | "lg";
  renderContent: (variant: "desktop" | "mobile") => ReactNode;
  title: string;
};

const responsiveSectionClassNames = {
  md: {
    desktop: "hidden flex-1 items-center justify-center px-6 pb-20 pt-24 md:flex",
    mobile: "flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 md:hidden",
  },
  lg: {
    desktop: "hidden flex-1 items-center justify-center px-6 pb-20 pt-24 lg:flex",
    mobile: "flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:hidden",
  },
} as const;

export function LoginPageShell({
  authError,
  copy,
  description,
  desktopAside,
  desktopBreakpoint = "md",
  renderContent,
  title,
}: LoginPageShellProps) {
  const features = copy.features.map((feature, index) => ({
    ...feature,
    icon: featureIcons[index] ?? FileText,
  }));
  const sectionClassNames = responsiveSectionClassNames[desktopBreakpoint];
  const desktopLayoutClassName = desktopAside
    ? "mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(360px,448px)] items-center gap-10 xl:gap-14"
    : "mx-auto grid w-full max-w-[1100px] grid-cols-2 items-center gap-[120px]";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="public" navigationItems={[]} showAuthAction={false} />
      <main className="flex min-h-dvh flex-1 flex-col">
        <section className={sectionClassNames.desktop}>
          <div className={desktopLayoutClassName}>
            {desktopAside ? (
              <div className="flex w-full justify-center">
                <div className="w-full max-w-[520px]">{desktopAside}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone-surface)] shadow-[inset_0_0_0_1px_var(--color-stone-surface)]">
                      <feature.icon size={18} className="text-[var(--color-midnight)]" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="mb-2 text-xl font-semibold leading-tight text-[var(--color-charcoal-primary)]">
                        {feature.title}
                      </h2>
                      <p className="text-sm leading-6 text-[var(--color-graphite)]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <LoginCard
                authError={authError}
                description={description}
                privacy={copy.privacy}
                title={title}
              >
                {renderContent("desktop")}
              </LoginCard>
            </div>
          </div>
        </section>

        <section className={sectionClassNames.mobile}>
          <div className="mx-auto w-full max-w-[420px] text-center">
            <h1 className="mb-4 text-4xl font-medium leading-tight text-[var(--color-midnight)] sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mb-8 max-w-[340px] text-sm leading-6 text-[var(--color-graphite)]">
              {description}
            </p>
            {authError ? <LoginErrorMessage message={authError} /> : null}
            <div className="space-y-5 text-left">{renderContent("mobile")}</div>
            <p className="mx-auto mt-6 max-w-[320px] text-xs leading-5 text-[var(--color-graphite)]">
              {copy.privacy}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LoginOptionGrid({ options }: { options: readonly LoginOption[] }) {
  return (
    <div className="grid gap-4">
      {options.map((option, index) => {
        const Icon = optionIcons[index] ?? ShieldCheck;

        return (
          <Link
            key={option.href}
            href={option.href}
            className={cn(
              "group flex min-h-[144px] cursor-pointer flex-col rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4 text-left hover:border-[var(--color-midnight)] hover:bg-[var(--color-card)] sm:min-h-[168px] sm:p-5",
              motion.cardInteractive,
            )}
          >
            <span className={cn("mb-5 flex size-11 items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] group-hover:bg-[var(--color-midnight)] group-hover:text-[var(--color-inverted)]", motion.base)}>
              <Icon size={19} aria-hidden="true" />
            </span>
            <span className="mb-2 text-xl font-semibold leading-tight text-[var(--color-charcoal-primary)]">
              {option.title}
            </span>
            <span className="text-sm leading-5 text-[var(--color-graphite)]">
              {option.description}
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-teal-deep)]">
              {option.actionLabel}
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function ManualLoginForm({ copy }: { copy: LoginCopy }) {
  return (
    <section className="rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-midnight)]">{copy.manualTitle}</h2>
      <form action={startManualLoginAction} className="space-y-3">
        <Field className="space-y-1.5">
          <Label htmlFor="manual-login-email" className="text-xs font-semibold text-[var(--color-ash)]">
            {copy.emailLabel}
          </Label>
          <Input
            id="manual-login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            className="mt-1.5 min-h-11 w-full rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-3 text-sm font-medium text-[var(--color-midnight)] outline-none placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-primary)]"
          />
        </Field>
        <Field className="space-y-1.5">
          <Label htmlFor="manual-login-password" className="text-xs font-semibold text-[var(--color-ash)]">
            {copy.passwordLabel}
          </Label>
          <Input
            id="manual-login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            className="mt-1.5 min-h-11 w-full rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-3 text-sm font-medium text-[var(--color-midnight)] outline-none placeholder:text-[var(--color-ash)] focus:border-[var(--color-teal-primary)]"
          />
        </Field>
        <PendingSubmitButton
          type="submit"
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--color-teal-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-inverted)] hover:bg-[var(--color-teal-deep)]"
          loadingLabel={copy.manualSubmitting}
          slotClassName="w-full"
        >
          {copy.manualSubmit}
        </PendingSubmitButton>
      </form>
    </section>
  );
}

export function GoogleLoginForm({
  className,
  label,
  loadingLabel,
  title,
}: {
  className?: string;
  label: string;
  loadingLabel: string;
  title: string;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-midnight)]">{title}</h2>
      <form action={startGoogleOAuthAction}>
        <PendingSubmitButton
          type="submit"
          className={cn(
            "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-midnight)] px-5 py-3 text-sm font-semibold text-[var(--color-inverted)] hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]",
            className,
          )}
          loadingLabel={loadingLabel}
          slotClassName={className?.includes("w-full") ? "w-full" : undefined}
        >
          <GoogleMark />
          <span>{label}</span>
        </PendingSubmitButton>
      </form>
    </section>
  );
}

export function DemoCredentials({ copy }: { copy: LoginCopy }) {
  const credentials = copy.demoCredentials.filter((item) =>
    demoCredentialEmails.includes(item.email as (typeof demoCredentialEmails)[number]),
  );

  return (
    <section className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-left">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--color-midnight)]">
          {copy.demoCredentialsTitle}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--color-ash)]">
          {copy.demoCredentialsDescription}
        </p>
      </div>
      <div className="space-y-2">
        {credentials.map((credential) => (
          <div
            key={credential.email}
            className="rounded-[10px] border border-[color-mix(in_srgb,var(--color-midnight)_8%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] p-3"
          >
            <p className="text-xs font-semibold text-[var(--color-midnight)]">{credential.role}</p>
            <CredentialValue
              label={copy.emailLabel}
              value={credential.email}
              copyLabel={copy.copyEmail}
              copiedLabel={copy.copied}
            />
            <CredentialValue
              label={copy.passwordLabel}
              value={credential.password}
              copyLabel={copy.copyPassword}
              copiedLabel={copy.copied}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BackToLoginOptions({ label }: { label: string }) {
  return (
    <Link
      href={landingLoginHref}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-4 text-center text-xs font-semibold text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)]",
        motion.button,
      )}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </Link>
  );
}

export function getAuthErrorMessage(authErrors: Record<string, string>, rawError: string | string[] | undefined) {
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  if (!errorCode) return null;
  return authErrors[errorCode] ?? authErrors.unknown;
}

function LoginCard({
  authError,
  children,
  description,
  privacy,
  title,
}: {
  authError: string | null;
  children: ReactNode;
  description: string;
  privacy: string;
  title: string;
}) {
  return (
    <section className="w-full max-w-md rounded-xl bg-[var(--color-card)] p-5 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] sm:p-8">
      <h1 className="mb-4 text-center text-4xl font-medium leading-tight text-[var(--color-charcoal-primary)] sm:text-5xl">
        {title}
      </h1>
      <p className="mb-8 text-center text-sm leading-6 text-[var(--color-graphite)]">
        {description}
      </p>
      {authError ? <LoginErrorMessage message={authError} /> : null}
      <div className="space-y-5">{children}</div>
      <div className="mt-6 space-y-1 text-center">
        <p className="text-xs leading-5 text-[var(--color-graphite)]">
          {privacy}
        </p>
      </div>
    </section>
  );
}

function LoginErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-[10px] bg-[var(--color-error-surface)] p-4 text-left text-xs leading-5 text-[var(--color-error-red)]"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function CredentialValue({
  copiedLabel,
  copyLabel,
  label,
  value,
}: {
  copiedLabel: string;
  copyLabel: string;
  label: string;
  value: string;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-[var(--color-ash)]">{label}</span>
        <code className="block truncate text-xs font-semibold text-[var(--color-charcoal-primary)]">
          {value}
        </code>
      </div>
      <DemoCredentialCopyButton value={value} label={copyLabel} copiedLabel={copiedLabel} />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
