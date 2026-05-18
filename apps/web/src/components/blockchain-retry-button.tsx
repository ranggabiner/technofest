"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { LoadingActionButton } from "@/components/ui/async-action-button";
import { Skeleton } from "@/components/ui/skeleton";

type RetryResult = {
  claimed: number;
  submitted: number;
  confirmed: number;
  pending: number;
  failed: number;
};

export function BlockchainRetryButton({
  copy,
}: {
  copy: {
    buttonIdle: string;
    buttonRunning: string;
    failed: string;
    result: string;
  };
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const runningRef = useRef(false);

  async function runRetry() {
    if (runningRef.current) return;

    runningRef.current = true;
    setIsRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/blockchain/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      });
      const body = (await response.json()) as { result?: RetryResult; error?: string };
      if (!response.ok || !body.result) throw new Error(body.error ?? copy.failed);
      setMessage(
        copy.result
          .replace("{claimed}", String(body.result.claimed))
          .replace("{submitted}", String(body.result.submitted))
          .replace("{confirmed}", String(body.result.confirmed))
          .replace("{pending}", String(body.result.pending))
          .replace("{failed}", String(body.result.failed)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm">
      <LoadingActionButton
        type="button"
        className="w-full rounded-[10px] sm:w-fit"
        isLoading={isRunning}
        loadingLabel={copy.buttonRunning}
        onClick={runRetry}
        slotClassName="w-full sm:w-fit"
      >
        <RefreshCw size={16} />
        {copy.buttonIdle}
      </LoadingActionButton>
      {isRunning ? (
        <Skeleton className="h-4 w-full max-w-md" />
      ) : message ? (
        <p className="text-[var(--color-ash)]">{message}</p>
      ) : null}
    </div>
  );
}
