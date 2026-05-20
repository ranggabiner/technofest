import Link from "next/link";
import { LogOut } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { DashboardCard } from "@/app/_components/dashboard-card";
import { ProfileAvatar } from "@/app/_components/profile-avatar";
import { PortalNavigationTransitionProvider } from "@/app/_components/portal-navigation";
import type { PortalNavigationTarget } from "@/app/_components/portal-navigation-model";
import { SaveStatusToast } from "@/app/_components/save-status-toast";
import { signOutAction } from "@/app/auth/actions";
import { SharedHeader } from "@/components/shared-header";
import { SiteFooter, SiteFooterContent } from "@/components/site-footer";
import { ForbiddenState } from "@/components/state-panel";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { motion } from "@/components/ui/motion";
import type { ResolvedRole } from "@/lib/auth/roles";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type PortalRole = "patient" | "doctor" | "admin";

type PortalLayoutProps = {
  children: ReactNode;
  copy: Dictionary;
  desktopNavigation: ReactNode;
  header?: ReactNode;
  mobileNavigation: ReactNode;
  navigationTargets: readonly PortalNavigationTarget[];
  profileHref: string;
  profileLabel: string;
  role: PortalRole;
  sectionLabel: string;
  showProfileAction?: boolean;
  title: string;
  userAvatarUrl: string | null;
  userEmail: string;
  userName: string;
};

export function PortalLayout({
  children,
  copy,
  desktopNavigation,
  header,
  mobileNavigation,
  navigationTargets,
  profileHref,
  profileLabel,
  role,
  showProfileAction = true,
  title,
  userAvatarUrl,
  userEmail,
  userName,
}: PortalLayoutProps) {
  return (
    <div
      className="min-h-screen bg-[var(--color-warm-canvas)]"
      data-portal-layout="portal-shell"
      data-patient-layout={role === "patient" ? "portal-shell" : undefined}
      data-doctor-layout={role === "doctor" ? "portal-shell" : undefined}
      data-admin-layout={role === "admin" ? "portal-shell" : undefined}
    >
      {header ?? (
        <SharedHeader
          authMode="authenticated"
          contextTitle={title}
          isAuthenticated
          maxWidth="none"
          position="fixed"
          className="shadow-none"
          showAuthAction={false}
        />
      )}
      <PortalNavigationTransitionProvider targets={navigationTargets}>
        <main className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-5 px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-[100px] md:grid-cols-12 lg:gap-8">
          <aside className="hidden md:col-span-3 md:block">
            <div className="sticky top-[100px] flex flex-col gap-6">
              <PortalProfileCard
                profileHref={profileHref}
                profileLabel={profileLabel}
                showProfileAction={showProfileAction}
                logoutLabel={copy.common.logout}
                role={role}
                userAvatarUrl={userAvatarUrl}
                userEmail={userEmail}
                userName={userName}
                variant="desktop"
                data-portal-sidebar="profile"
                data-patient-sidebar={role === "patient" ? "profile" : undefined}
                data-doctor-sidebar={role === "doctor" ? "profile" : undefined}
                data-admin-sidebar={role === "admin" ? "profile" : undefined}
              />

              <DashboardCard
                className="p-4"
                data-portal-sidebar="navigation"
                data-patient-sidebar={role === "patient" ? "navigation" : undefined}
                data-doctor-sidebar={role === "doctor" ? "navigation" : undefined}
                data-admin-sidebar={role === "admin" ? "navigation" : undefined}
              >
                {desktopNavigation}
              </DashboardCard>
            </div>
          </aside>

          <div className="col-span-1 flex flex-col gap-5 md:col-span-9 md:gap-8">
            <h1 className="sr-only">{title}</h1>
            <PortalProfileCard
              profileHref={profileHref}
              profileLabel={profileLabel}
              showProfileAction={showProfileAction}
              logoutLabel={copy.common.logout}
              role={role}
              userAvatarUrl={userAvatarUrl}
              userEmail={userEmail}
              userName={userName}
              variant="mobile"
              data-portal-sidebar="mobile-profile"
              data-patient-sidebar={role === "patient" ? "mobile-profile" : undefined}
              data-doctor-sidebar={role === "doctor" ? "mobile-profile" : undefined}
              data-admin-sidebar={role === "admin" ? "mobile-profile" : undefined}
            />
            {mobileNavigation}

            {children}
          </div>
        </main>
      </PortalNavigationTransitionProvider>
      <SaveStatusToast messages={copy.common.successToast} />
      <SiteFooterContent copy={copy} />
    </div>
  );
}

type PortalProfileCardProps = HTMLAttributes<HTMLElement> & {
  logoutLabel: string;
  profileHref: string;
  profileLabel: string;
  role: PortalRole;
  showProfileAction?: boolean;
  userAvatarUrl: string | null;
  userEmail: string;
  userName: string;
  variant: "desktop" | "mobile";
};

export function PortalProfileCard({
  className,
  logoutLabel,
  profileHref,
  profileLabel,
  role,
  showProfileAction = true,
  userAvatarUrl,
  userEmail,
  userName,
  variant,
  ...props
}: PortalProfileCardProps) {
  const isMobile = variant === "mobile";

  return (
    <DashboardCard
      className={cn(isMobile ? "p-4 md:hidden" : "p-8", className)}
      {...props}
    >
      <div className={cn("flex gap-4", isMobile ? "items-start sm:items-center" : "flex-col items-center")}>
        <ProfileAvatar
          src={userAvatarUrl}
          name={userName}
          fallback={role === "admin" ? "A" : role === "doctor" ? "D" : "P"}
          className={cn(isMobile ? "size-14 text-lg" : "size-20 text-xl")}
        />
        <div className={cn("min-w-0", isMobile ? "flex-1" : "w-full text-center")}>
          <h2
            className={cn(
              "font-semibold leading-tight text-[var(--color-midnight)]",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            {userName}
          </h2>
          <p className="mt-1 break-all text-xs leading-5 text-[var(--color-ash)]">
            {userEmail}
          </p>
          <div className={cn("mt-4 grid gap-2", isMobile && showProfileAction ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            {showProfileAction ? (
              <Link
                href={profileHref}
                className={cn(
                  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-midnight)] hover:bg-[var(--color-stone-surface)] hover:text-[var(--color-teal-deep)]",
                  motion.button,
                )}
              >
                {profileLabel}
              </Link>
            ) : null}
            <form action={signOutAction}>
              <PendingSubmitButton
                type="submit"
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-error-red)_55%,white)] bg-[color-mix(in_srgb,var(--color-error-red)_8%,transparent)] px-4 py-2 text-center text-xs font-medium text-[var(--color-error-red)] hover:bg-[color-mix(in_srgb,var(--color-error-red)_14%,transparent)] hover:text-[var(--color-error-red)]"
                loadingLabel={logoutLabel}
                slotClassName="w-full"
              >
                <span>{logoutLabel}</span>
                <LogOut size={15} aria-hidden="true" />
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export async function PortalForbiddenLayout({
  role,
  title,
}: {
  role: ResolvedRole;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <SharedHeader
        authMode="authenticated"
        contextTitle={title}
        isAuthenticated
        maxWidth="none"
        position="fixed"
        className="shadow-none"
      />
      <main className="mx-auto min-h-screen max-w-[860px] px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-[100px]">
        <ForbiddenState role={role} />
      </main>
      <SiteFooter />
    </div>
  );
}

export { DashboardCard };
