import { describe, expect, it } from "vitest";

import { classifyProofVerification } from "./verify";

describe("proof verification state rules", () => {
  it("does not verify before confirmation", () => {
    expect(
      classifyProofVerification({
        blockchainStatus: "pending",
        txHash: null,
        recomputedHash: "a".repeat(64),
        confirmedEventHash: null,
      }),
    ).toBe("pending");
    expect(
      classifyProofVerification({
        blockchainStatus: "failed",
        txHash: "0xabc",
        recomputedHash: "a".repeat(64),
        confirmedEventHash: null,
      }),
    ).toBe("failed");
  });

  it("requires a confirmed tx hash and matching event hash", () => {
    expect(
      classifyProofVerification({
        blockchainStatus: "confirmed",
        txHash: null,
        recomputedHash: "a".repeat(64),
        confirmedEventHash: null,
      }),
    ).toBe("unavailable");
    expect(
      classifyProofVerification({
        blockchainStatus: "confirmed",
        txHash: "0xabc",
        recomputedHash: "a".repeat(64),
        confirmedEventHash: "a".repeat(64),
      }),
    ).toBe("verified");
    expect(
      classifyProofVerification({
        blockchainStatus: "confirmed",
        txHash: "0xabc",
        recomputedHash: "a".repeat(64),
        confirmedEventHash: "b".repeat(64),
      }),
    ).toBe("mismatch");
  });
});
