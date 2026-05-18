"use client";

import { useState } from "react";

export function DemoCredentialCopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="min-h-11 cursor-pointer rounded-full border border-[var(--color-stone-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-midnight)] transition hover:bg-[var(--color-card)] disabled:cursor-not-allowed disabled:opacity-60"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
