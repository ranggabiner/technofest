"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProofType, VerifyStatus } from "@/lib/blockchain/proofs";

type VerifyResponse = {
  status?: VerifyStatus;
  txHash?: string | null;
  message?: string;
  error?: string;
};

export function ProofStatus({
  proofType,
  id,
  blockchainStatus,
  txHash,
  lastError,
}: {
  proofType: ProofType;
  id: string;
  blockchainStatus: string;
  txHash?: string | null;
  lastError?: string | null;
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const canVerify = blockchainStatus === "confirmed" && Boolean(txHash);

  async function verify() {
    setIsVerifying(true);
    setResult(null);
    try {
      const response = await fetch("/api/proofs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofType, id }),
      });
      const body = (await response.json()) as VerifyResponse;
      if (!response.ok) throw new Error(body.error ?? "Verifikasi proof gagal");
      setResult(body);
    } catch (error) {
      setResult({
        status: "unavailable",
        message: error instanceof Error ? error.message : "Verifikasi proof gagal",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-[10px] bg-[var(--color-stone-surface)] p-3 text-sm">
      <p className="text-[var(--color-charcoal-primary)]">{proofCopy(blockchainStatus, lastError)}</p>
      {txHash ? (
        <p className="break-all font-mono text-xs text-[var(--color-ash)]">Tx: {txHash}</p>
      ) : null}
      {canVerify ? (
        <Button
          type="button"
          variant="secondary"
          className="w-fit rounded-[10px]"
          onClick={verify}
          disabled={isVerifying}
        >
          <ShieldCheck size={16} />
          {isVerifying ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      ) : null}
      {result?.message ? (
        <p className={result.status === "mismatch" ? "font-semibold text-[var(--color-error-red)]" : "text-[var(--color-ash)]"}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}

function proofCopy(status: string, lastError?: string | null) {
  if (status === "confirmed") return "Proof blockchain sudah terkonfirmasi.";
  if (status === "failed") {
    return `Proof blockchain gagal${lastError ? `: ${lastError}` : "."}`;
  }
  if (status === "pending") return "Proof blockchain masih pending. Verifikasi belum tersedia.";
  return "Proof blockchain belum tersedia.";
}
