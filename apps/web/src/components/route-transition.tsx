"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

type RouteTransitionContextValue = {
  beginRouteTransition: (href: string) => void;
  pendingHref: string | null;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);
const sameOriginBase = "https://medproof.local";
const pendingSkeletonDelayMs = 120;
const pendingSafetyTimeoutMs = 4_000;

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const routeKey = searchParams?.toString() ? `${pathname}?${searchParams}` : pathname;
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const visiblePendingHref = pendingHref && pendingHref !== routeKey ? pendingHref : null;

  const beginRouteTransition = useCallback((href: string) => {
    const targetHref = normalizeTransitionHref(href);
    if (!targetHref || targetHref === routeKey) return;
    setPendingHref(targetHref);
  }, [routeKey]);

  useEffect(() => {
    if (!visiblePendingHref) return;

    const timer = window.setTimeout(() => {
      setPendingHref(null);
    }, pendingSafetyTimeoutMs);

    return () => window.clearTimeout(timer);
  }, [visiblePendingHref]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!isPlainPrimaryClick(event)) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || shouldIgnoreAnchor(anchor)) return;

      beginRouteTransition(anchor.href);
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [beginRouteTransition]);

  const value = useMemo<RouteTransitionContextValue>(
    () => ({
      beginRouteTransition,
      pendingHref: visiblePendingHref,
    }),
    [beginRouteTransition, visiblePendingHref],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      <div data-route-transition-root="" data-route-transition-pending={visiblePendingHref ? "true" : undefined}>
        <div key={routeKey} data-route-transition-page="">
          {children}
        </div>
      </div>
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext) ?? {
    beginRouteTransition: () => undefined,
    pendingHref: null,
  };
}

export function RouteTransitionSurface({
  children,
  dataPendingAttribute,
  pendingPath,
  renderSkeleton,
}: {
  children: ReactNode;
  dataPendingAttribute?: string;
  pendingPath: string | null;
  renderSkeleton: (path: string) => ReactNode | null;
}) {
  const pathname = usePathname() ?? "/";
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return;

    if (!pendingPath) {
      element.style.minHeight = "";
      return;
    }

    const height = element.getBoundingClientRect().height;
    element.style.minHeight = height > 0 ? `${Math.ceil(height)}px` : "";
  }, [pendingPath]);

  const transitionState = pendingPath ? "pending" : "entered";
  const currentContent = (
    <div key={pathname} data-route-transition-current="">
      {children}
    </div>
  );

  return (
    <div
      ref={surfaceRef}
      aria-busy={pendingPath ? "true" : undefined}
      data-route-transition-surface=""
      data-route-transition-state={transitionState}
      data-route-transition-pending={pendingPath ?? undefined}
      {...(dataPendingAttribute && pendingPath ? { [dataPendingAttribute]: pendingPath } : {})}
    >
      {pendingPath ? (
        <DelayedRouteSkeleton
          key={pendingPath}
          fallback={currentContent}
          pendingPath={pendingPath}
          renderSkeleton={renderSkeleton}
        />
      ) : (
        currentContent
      )}
    </div>
  );
}

function DelayedRouteSkeleton({
  fallback,
  pendingPath,
  renderSkeleton,
}: {
  fallback: ReactNode;
  pendingPath: string;
  renderSkeleton: (path: string) => ReactNode | null;
}) {
  const [showPendingSkeleton, setShowPendingSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowPendingSkeleton(true);
    }, pendingSkeletonDelayMs);

    return () => window.clearTimeout(timer);
  }, [pendingPath]);

  const pendingSkeleton = showPendingSkeleton ? renderSkeleton(pendingPath) : null;
  if (!pendingSkeleton) return fallback;

  return (
    <div data-route-transition-skeleton="" aria-hidden="true">
      {pendingSkeleton}
    </div>
  );
}

export function beginTransitionFromLinkClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
  beginRouteTransition: (href: string) => void,
) {
  if (!isPlainReactPrimaryClick(event)) return false;
  beginRouteTransition(href);
  return true;
}

function shouldIgnoreAnchor(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return true;
  if (anchor.hasAttribute("download")) return true;

  const href = normalizeTransitionHref(anchor.href);
  if (!href) return true;

  const current = `${window.location.pathname}${window.location.search}`;
  return href === current || href === `${window.location.pathname}${window.location.hash}`;
}

function normalizeTransitionHref(href: string) {
  try {
    const url = new URL(href, sameOriginBase);
    const currentOrigin = typeof window === "undefined" ? sameOriginBase : window.location.origin;
    const normalizedOrigin = url.origin === sameOriginBase ? currentOrigin : url.origin;
    if (normalizedOrigin !== currentOrigin) return null;

    const path = normalizePath(url.pathname);
    const search = url.search;
    return `${path}${search}`;
  } catch {
    return null;
  }
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function isPlainPrimaryClick(event: MouseEvent) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

function isPlainReactPrimaryClick(event: ReactMouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}
