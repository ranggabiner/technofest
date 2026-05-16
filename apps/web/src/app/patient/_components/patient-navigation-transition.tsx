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
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  PatientAccessHistorySkeleton,
  PatientAccessSkeleton,
  PatientDashboardSkeleton,
} from "@/components/loading-skeletons";

import {
  patientPendingSkeletonKey,
  resolvePatientNavigationPath,
} from "./patient-navigation-transition-model";

type PatientNavigationTransitionContextValue = {
  beginPatientNavigation: (href: string) => void;
  pendingPath: string | null;
};

const PatientNavigationTransitionContext =
  createContext<PatientNavigationTransitionContextValue | null>(null);

export function PatientNavigationTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/patient";
  const [pendingNavigation, setPendingNavigation] = useState<{
    fromPath: string;
    targetPath: string;
  } | null>(null);
  const pendingPath =
    pendingNavigation?.fromPath === pathname ? pendingNavigation.targetPath : null;

  const value = useMemo<PatientNavigationTransitionContextValue>(
    () => ({
      beginPatientNavigation: (href) => {
        const targetPath = resolvePatientNavigationPath(href, pathname);
        setPendingNavigation(targetPath ? { fromPath: pathname, targetPath } : null);
      },
      pendingPath,
    }),
    [pathname, pendingPath],
  );

  return (
    <PatientNavigationTransitionContext.Provider value={value}>
      {children}
    </PatientNavigationTransitionContext.Provider>
  );
}

export function usePatientNavigationTransition() {
  return useContext(PatientNavigationTransitionContext) ?? {
    beginPatientNavigation: () => undefined,
    pendingPath: null,
  };
}

export function PatientNavigationContent({ children }: { children: ReactNode }) {
  const { pendingPath } = usePatientNavigationTransition();
  const skeleton = pendingPath ? renderPendingSkeleton(pendingPath) : null;

  if (!skeleton) return <>{children}</>;

  return (
    <div
      aria-busy="true"
      className="contents"
      data-patient-main-pending={pendingPath}
    >
      {skeleton}
    </div>
  );
}

type PatientTransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

export const PatientTransitionLink = forwardRef<HTMLAnchorElement, PatientTransitionLinkProps>(
  function PatientTransitionLink({ href, onClick, onNavigate, ...props }, ref) {
    const { beginPatientNavigation } = usePatientNavigationTransition();
    const hrefText = stringifyHref(href);

    return (
      <Link
        ref={ref}
        href={href}
        onClick={(event) => {
          if (isPlainPrimaryClick(event)) beginPatientNavigation(hrefText);
          onClick?.(event);
        }}
        onNavigate={(event) => {
          beginPatientNavigation(hrefText);
          onNavigate?.(event);
        }}
        {...props}
      />
    );
  },
);

function renderPendingSkeleton(path: string) {
  const key = patientPendingSkeletonKey(path);

  if (key === "dashboard") return <PatientDashboardSkeleton />;
  if (key === "access") return <PatientAccessSkeleton />;
  if (key === "history") return <PatientAccessHistorySkeleton />;
  return null;
}

function stringifyHref(href: LinkProps["href"]) {
  if (typeof href === "string") return href;
  return href.pathname ?? "";
}

function isPlainPrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}
