import { AlertTriangle, Bot, FileText, ShieldCheck } from "lucide-react";

import { MarketingFooter } from "@/components/marketing-chrome";
import { SharedHeader } from "@/components/shared-header";
import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

import { startGoogleOAuthAction } from "./actions";

const featureIcons = [Bot, ShieldCheck, FileText] as const;

export const dynamic = "force-dynamic";

type LoginSearchParams = {
  error?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  await redirectAuthenticatedUserFromPublicRoute();

  const params = (await searchParams) ?? {};
  const copy = await getDictionary();
  const authError = getAuthErrorMessage(copy.marketing.login.authErrors, params.error);
  const features = copy.marketing.login.features.map((feature, index) => ({
    ...feature,
    icon: featureIcons[index],
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="public" />
      <main className="flex flex-1 flex-col">
        <section className="hidden flex-1 items-center justify-center px-6 pt-16 md:flex">
          <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 items-center gap-[120px]">
            <div className="flex flex-col gap-12">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-6">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone-surface)] shadow-[inset_0_0_0_1px_var(--color-stone-surface)]">
                    <feature.icon size={18} className="text-[var(--color-midnight)]" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="mb-2 text-[23px] font-semibold leading-tight text-[var(--color-charcoal-primary)]">
                      {feature.title}
                    </h2>
                    <p className="text-[15px] leading-6 text-[var(--color-graphite)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <LoginCard copy={copy.marketing.login} copyright={copy.common.copyright} authError={authError} />
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-32 md:hidden">
          <div className="mx-auto w-full max-w-[420px] text-center">
            <h1 className="mb-4 font-serif text-[44px] font-medium leading-[1.08] text-[var(--color-midnight)]">
              {copy.marketing.login.title}
            </h1>
            <p className="mx-auto mb-8 max-w-[340px] text-[15px] leading-6 text-[var(--color-graphite)]">
              {copy.marketing.login.description}
            </p>
            {authError ? <LoginErrorMessage message={authError} /> : null}
            <GoogleLoginForm label={copy.marketing.login.google} className="min-h-16 w-full text-[19px]" />
            <p className="mx-auto mt-6 max-w-[320px] text-[12px] leading-5 text-[var(--color-graphite)]">
              {copy.marketing.login.privacy}
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function LoginCard({
  copy,
  copyright,
  authError,
}: {
  copy: {
    title: string;
    description: string;
    privacy: string;
    google: string;
    authErrors: Record<string, string>;
  };
  copyright: string;
  authError: string | null;
}) {
  return (
    <section className="w-full max-w-md rounded-xl bg-[var(--color-card)] p-8 shadow-[inset_0_0_0_1px_var(--color-stone-surface)]">
      <h1 className="mb-4 text-center font-serif text-[44px] font-medium leading-[1.09] text-[var(--color-charcoal-primary)]">
        {copy.title}
      </h1>
      <p className="mb-8 text-center text-[15px] leading-6 text-[var(--color-graphite)]">
        {copy.description}
      </p>
      {authError ? <LoginErrorMessage message={authError} /> : null}
      <GoogleLoginForm label={copy.google} className="w-full" />
      <div className="mt-6 space-y-1 text-center">
        <p className="text-[12px] leading-5 text-[var(--color-graphite)]">
          {copy.privacy}
        </p>
        <p className="text-[12px] leading-5 text-[var(--color-graphite)] opacity-70">
          {copyright}
        </p>
      </div>
    </section>
  );
}

function LoginErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-[10px] bg-[var(--color-error-surface)] p-4 text-left text-[12px] leading-5 text-[var(--color-error-red)]"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function getAuthErrorMessage(authErrors: Record<string, string>, rawError: string | string[] | undefined) {
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  if (!errorCode) return null;
  return authErrors[errorCode] ?? authErrors.unknown;
}

function GoogleLoginForm({ label, className }: { label: string; className?: string }) {
  return (
    <form action={startGoogleOAuthAction}>
      <button
        type="submit"
        className={[
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-midnight)] px-5 py-3 text-[15px] font-semibold text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <GoogleMark />
        <span>{label}</span>
      </button>
    </form>
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
