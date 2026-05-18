"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { LoadingActionButton } from "@/components/ui/async-action-button";
import type { ProofType, VerifyStatus } from "@/lib/blockchain/proofs";

type VerifyResponse = {
  status?: VerifyStatus;
  txHash?: string | null;
  message?: string;
  error?: string;
};

export type ProofStatusMessages = {
  txPrefix: string;
  verify: string;
  verifying: string;
  verifyFailed: string;
  confirmed: string;
  pending: string;
  unavailable: string;
  failedPrefix: string;
};

export function ProofStatus({
  proofType,
  id,
  blockchainStatus,
  txHash,
  lastError,
  messages,
}: {
  proofType: ProofType;
  id: string;
  blockchainStatus: string;
  txHash?: string | null;
  lastError?: string | null;
  messages: ProofStatusMessages;
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const verifyingRef = useRef(false);
  const canVerify = blockchainStatus === "confirmed" && Boolean(txHash);

  async function verify() {
    if (verifyingRef.current) return;

    verifyingRef.current = true;
    setIsVerifying(true);
    setResult(null);
    try {
      const response = await fetch("/api/proofs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofType, id }),
      });
      const body = (await response.json()) as VerifyResponse;
      if (!response.ok) throw new Error(body.error ?? messages.verifyFailed);
      setResult(body);
    } catch (error) {
      setResult({
        status: "unavailable",
        message: error instanceof Error ? error.message : messages.verifyFailed,
      });
    } finally {
      verifyingRef.current = false;
      setIsVerifying(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-stone-surface)] p-3 text-sm">
      <p className="text-[var(--color-charcoal-primary)]">{proofCopy(blockchainStatus, messages, lastError)}</p>
      {txHash ? (
        <p className="break-all font-mono text-xs text-[var(--color-ash)]">{messages.txPrefix}: {txHash}</p>
      ) : null}
      {canVerify ? (
        <LoadingActionButton
          type="button"
          variant="secondary"
          className="w-full rounded-[10px] sm:w-fit"
          onClick={verify}
          isLoading={isVerifying}
          loadingLabel={messages.verifying}
          slotClassName="w-full sm:w-fit"
        >
          <ShieldCheck size={16} />
          {messages.verify}
        </LoadingActionButton>
      ) : null}
      {result?.message ? (
        <p className={result.status === "mismatch" ? "font-semibold text-[var(--color-error-red)]" : "text-[var(--color-ash)]"}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}

function proofCopy(status: string, messages: ProofStatusMessages, lastError?: string | null) {
  if (status === "confirmed") return messages.confirmed;
  if (status === "failed") {
    return `${messages.failedPrefix}${lastError ? `: ${lastError}` : "."}`;
  }
  if (status === "pending") return messages.pending;
  return messages.unavailable;
}
