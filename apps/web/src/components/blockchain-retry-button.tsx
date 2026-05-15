"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  async function runRetry() {
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
      setIsRunning(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-sm">
      <Button type="button" className="w-fit rounded-[10px]" onClick={runRetry} disabled={isRunning}>
        <RefreshCw size={16} />
        {isRunning ? copy.buttonRunning : copy.buttonIdle}
      </Button>
      {message ? <p className="text-[var(--color-ash)]">{message}</p> : null}
    </div>
  );
}
