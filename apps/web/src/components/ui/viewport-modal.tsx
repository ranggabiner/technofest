"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { modalExitDurationMs, motion } from "@/components/ui/motion";

let activeScrollLocks = 0;
let previousBodyOverflow: string | null = null;

function subscribeToClientReady(onStoreChange: () => void) {
  onStoreChange();
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type ViewportModalProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  isExiting?: boolean;
  lockScroll?: boolean;
};

type ViewportModalPanelProps = HTMLAttributes<HTMLElement> &
  FormHTMLAttributes<HTMLFormElement> & {
    as?: "article" | "div" | "form" | "section";
  };

export function useViewportModalPresence(isOpen: boolean) {
  const [isPresent, setIsPresent] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = window.setTimeout(() => {
        setIsPresent(true);
        setIsExiting(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!isPresent) return;

    const exitStartId = window.setTimeout(() => {
      setIsExiting(true);
    }, 0);
    const exitEndId = window.setTimeout(() => {
      setIsPresent(false);
      setIsExiting(false);
    }, modalExitDurationMs);

    return () => {
      window.clearTimeout(exitStartId);
      window.clearTimeout(exitEndId);
    };
  }, [isOpen, isPresent]);

  return { isExiting, isPresent };
}

export function ViewportModalPanel({
  as: Component = "div",
  className,
  ...props
}: ViewportModalPanelProps) {
  return (
    <Component
      data-viewport-modal-panel=""
      className={cn(
        "max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto",
        motion.modalPanel,
        className,
      )}
      {...props}
    />
  );
}

export function ViewportModal({
  children,
  className,
  isExiting = false,
  lockScroll = true,
  ...props
}: ViewportModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientReady,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!mounted || !lockScroll) return;

    if (activeScrollLocks === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    activeScrollLocks += 1;

    return () => {
      activeScrollLocks = Math.max(0, activeScrollLocks - 1);
      if (activeScrollLocks === 0) {
        document.body.style.overflow = previousBodyOverflow ?? "";
        previousBodyOverflow = null;
      }
    };
  }, [lockScroll, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-viewport-modal-overlay=""
      data-viewport-modal-state={isExiting ? "exiting" : "entered"}
      className={cn(
        "fixed inset-0 z-50 grid h-dvh w-screen place-items-center overflow-y-auto px-3 py-4 sm:px-4",
        motion.modalOverlay,
        className,
      )}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}
