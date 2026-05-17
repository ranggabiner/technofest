import { AlertTriangle, Stethoscope, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { roleEntryPath } from "@/lib/auth/roles";
import { getCurrentUser, resolveRoleForUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { getRoleOptions } from "@/lib/i18n/marketing";
import { dictionary } from "@/lib/i18n/dictionary";

import { completeRoleSelectionAction } from "../actions";

type RoleSelectionSearchParams = {
  error?: string | string[];
};

export default async function RoleSelectionPage({
  searchParams,
}: {
  searchParams?: Promise<RoleSelectionSearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await resolveRoleForUser(user);
  if (role) redirect(roleEntryPath(role));

  const locale = await getLocale();
  const copy = dictionary[locale];
  const roleOptions = getRoleOptions(locale);
  const params = (await searchParams) ?? {};
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const roleError = rawError === "invalid_role" ? copy.marketing.role.invalidRole : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="authenticated" isAuthenticated />
      <main className="flex min-h-screen flex-1 items-center justify-center px-6 pb-24 pt-32">
        <form
          action={completeRoleSelectionAction}
          className="relative w-full max-w-[640px] overflow-hidden rounded-xl bg-[var(--color-card)] p-8 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] md:p-20"
        >
          <div className="mx-auto mb-16 max-w-[480px] text-center">
            <h1 className="mb-4 font-serif text-[36px] font-medium leading-[1.1] text-[var(--color-charcoal-primary)] md:text-[44px]">
              {copy.marketing.role.title}
            </h1>
            <p className="text-[15px] leading-6 text-[var(--color-graphite)]">
              {copy.marketing.role.description}
            </p>
          </div>

          {roleError ? (
            <div
              role="alert"
              className="mb-8 flex items-start gap-3 rounded-[10px] bg-[var(--color-error-surface)] p-4 text-left text-[12px] leading-5 text-[var(--color-error-red)]"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{roleError}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {roleOptions.map((option, index) => {
              const Icon = option.intent === "patient" ? UserRound : Stethoscope;
              return (
                <div key={option.intent} className="relative">
                  <input
                    id={`role-${option.intent}`}
                    className="peer sr-only"
                    type="radio"
                    name="intent"
                    value={option.intent}
                    defaultChecked={index === 0}
                  />
                  <label
                    htmlFor={`role-${option.intent}`}
                    className="flex min-h-[180px] cursor-pointer flex-col items-start rounded-xl border border-[var(--color-stone-surface)] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-midnight)] hover:bg-[var(--color-warm-canvas)] peer-checked:border-[var(--color-midnight)] peer-checked:bg-[var(--color-warm-canvas)]"
                  >
                    <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-[var(--color-stone-surface)] text-[var(--color-midnight)] transition peer-checked:bg-[var(--color-midnight)] peer-checked:text-[var(--color-inverted)]">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="mb-2 text-[23px] font-semibold leading-tight text-[var(--color-charcoal-primary)]">
                      {option.title}
                    </span>
                    <span className="text-[12px] leading-5 text-[var(--color-graphite)]">
                      {option.description}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-10 min-w-40 items-center justify-center rounded-full bg-[var(--color-midnight)] px-8 py-2 text-[12px] font-semibold text-[var(--color-inverted)] transition hover:bg-[var(--color-charcoal-primary)] hover:text-[var(--color-warm-canvas)]"
            >
              {copy.marketing.role.continue}
            </button>
          </div>

          <div className="pointer-events-none absolute -bottom-10 -right-10 hidden size-48 rounded-full bg-[var(--color-stone-surface)] opacity-40 lg:block" />
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
