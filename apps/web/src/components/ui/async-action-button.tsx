"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

type ButtonProps = ComponentPropsWithoutRef<typeof Button>;

type AsyncActionButtonProps = ButtonProps & {
  isLoading: boolean;
  loadingLabel: string;
  slotClassName?: string;
};

export function PendingSubmitButton(props: Omit<AsyncActionButtonProps, "isLoading">) {
  const { pending } = useFormStatus();

  return <AsyncActionButton {...props} isLoading={pending} />;
}

export function LoadingActionButton(props: AsyncActionButtonProps) {
  return <AsyncActionButton {...props} />;
}

function AsyncActionButton({
  children,
  className,
  disabled,
  isLoading,
  loadingLabel,
  slotClassName,
  ...props
}: AsyncActionButtonProps) {
  return (
    <span className={cn("relative inline-grid max-w-full align-middle", slotClassName)} aria-busy={isLoading}>
      <Button
        className={cn("relative overflow-hidden", className, isLoading && "cursor-not-allowed disabled:opacity-70")}
        disabled={isLoading || disabled}
        {...props}
      >
        <span className={cn("inline-flex items-center justify-center gap-2", isLoading && "opacity-0")} aria-hidden={isLoading}>
          {children}
        </span>
        {isLoading ? <LoadingSlot label={loadingLabel} /> : null}
      </Button>
    </span>
  );
}

function LoadingSlot({ label }: { label: string }) {
  return (
    <span
      aria-live="polite"
      className="absolute inset-0 grid place-items-center"
      role="status"
    >
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
