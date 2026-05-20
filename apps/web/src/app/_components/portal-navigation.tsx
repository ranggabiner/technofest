"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

import type { PortalNavigationTarget } from "@/app/_components/portal-navigation-model";
import { resolvePortalNavigationPath } from "@/app/_components/portal-navigation-model";
import {
  RouteTransitionSurface,
  beginTransitionFromLinkClick,
  useRouteTransition,
} from "@/components/route-transition";
import { motion } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export type PortalNavItem = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
};

type PortalNavigationTransitionContextValue = {
  beginPortalNavigation: (href: string) => void;
  pendingPath: string | null;
};

const PortalNavigationTransitionContext =
  createContext<PortalNavigationTransitionContextValue | null>(null);

export function PortalNavigationTransitionProvider({
  children,
  targets,
}: {
  children: ReactNode;
  targets: readonly PortalNavigationTarget[];
}) {
  const pathname = usePathname() ?? "/";
  const { beginRouteTransition } = useRouteTransition();
  const [pendingNavigation, setPendingNavigation] = useState<{
    fromPath: string;
    targetPath: string;
  } | null>(null);
  const pendingPath =
    pendingNavigation?.fromPath === pathname ? pendingNavigation.targetPath : null;

  const value = useMemo<PortalNavigationTransitionContextValue>(
    () => ({
      beginPortalNavigation: (href) => {
        const targetPath = resolvePortalNavigationPath(href, pathname, targets);
        beginRouteTransition(href);
        setPendingNavigation(targetPath ? { fromPath: pathname, targetPath } : null);
      },
      pendingPath,
    }),
    [beginRouteTransition, pathname, pendingPath, targets],
  );

  return (
    <PortalNavigationTransitionContext.Provider value={value}>
      {children}
    </PortalNavigationTransitionContext.Provider>
  );
}

export function usePortalNavigationTransition() {
  return useContext(PortalNavigationTransitionContext) ?? {
    beginPortalNavigation: () => undefined,
    pendingPath: null,
  };
}

export function PortalNavigationContent({
  children,
  dataPendingAttribute = "data-portal-main-pending",
  renderSkeleton,
}: {
  children: ReactNode;
  dataPendingAttribute?: string;
  renderSkeleton: (path: string) => ReactNode | null;
}) {
  const { pendingPath } = usePortalNavigationTransition();

  return (
    <RouteTransitionSurface
      dataPendingAttribute={dataPendingAttribute}
      pendingPath={pendingPath}
      renderSkeleton={renderSkeleton}
    >
      {children}
    </RouteTransitionSurface>
  );
}

export function PortalDesktopNavigation({
  ariaLabel,
  items,
  sectionLabel,
}: {
  ariaLabel: string;
  items: PortalNavItem[];
  sectionLabel: string;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label={ariaLabel}>
      <span className="mb-4 block px-3 text-lg font-semibold uppercase tracking-widest text-[var(--color-ash)]">
        {sectionLabel}
      </span>
      {items.map((item) => (
        <PortalTransitionLink
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ash)] hover:bg-[color-mix(in_srgb,var(--color-teal-primary)_5%,transparent)] hover:text-[var(--color-teal-deep)]",
            motion.navItem,
            item.active && "bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]",
          )}
        >
          <item.icon size={20} aria-hidden="true" />
          {item.label}
        </PortalTransitionLink>
      ))}
    </nav>
  );
}

export function PortalMobileNavigation({
  ariaLabel,
  items,
  role,
}: {
  ariaLabel: string;
  items: PortalNavItem[];
  role: "patient" | "doctor" | "admin";
}) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-2 shadow-[inset_0_0_0_1px_var(--color-stone-surface)] md:hidden"
      aria-label={ariaLabel}
      data-portal-sidebar="mobile-navigation"
      data-patient-sidebar={role === "patient" ? "mobile-navigation" : undefined}
      data-doctor-sidebar={role === "doctor" ? "mobile-navigation" : undefined}
      data-admin-sidebar={role === "admin" ? "mobile-navigation" : undefined}
    >
      {items.map((item) => (
        <PortalTransitionLink
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ash)]",
            motion.navItem,
            item.active && "bg-[color-mix(in_srgb,var(--color-teal-primary)_10%,transparent)] text-[var(--color-teal-deep)]",
          )}
        >
          <item.icon size={18} aria-hidden="true" />
          {item.label}
        </PortalTransitionLink>
      ))}
    </nav>
  );
}

type PortalTransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

export const PortalTransitionLink = forwardRef<HTMLAnchorElement, PortalTransitionLinkProps>(
  function PortalTransitionLink({ href, onClick, onNavigate, ...props }, ref) {
    const { beginPortalNavigation } = usePortalNavigationTransition();
    const { beginRouteTransition } = useRouteTransition();
    const hrefText = stringifyHref(href);

    return (
      <Link
        ref={ref}
        href={href}
        onClick={(event) => {
          if (beginTransitionFromLinkClick(event, hrefText, beginRouteTransition)) {
            beginPortalNavigation(hrefText);
          }
          onClick?.(event);
        }}
        onNavigate={(event) => {
          beginPortalNavigation(hrefText);
          onNavigate?.(event);
        }}
        {...props}
      />
    );
  },
);

function stringifyHref(href: LinkProps["href"]) {
  if (typeof href === "string") return href;
  return href.pathname ?? "";
}
