import { describe, expect, it } from "vitest";

import {
  DOCTOR_LOOKUP_HANDOFF_KEY,
  DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY,
  consumePendingDoctorLookup,
  consumePendingDoctorLookupHandoff,
  savePendingDoctorLookup,
} from "./doctor-lookup-handoff";

describe("doctor lookup handoff", () => {
  it("preserves legacy pending lookup consumption", () => {
    const store = new Map<string, string>();
    globalThis.window = {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        removeItem: (key: string) => {
          store.delete(key);
        },
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    } as unknown as Window & typeof globalThis;

    savePendingDoctorLookup(" 123456 ");

    expect(consumePendingDoctorLookup()).toBe("123456");
    expect(store.has(DOCTOR_LOOKUP_HANDOFF_KEY)).toBe(false);
    expect(store.has(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY)).toBe(false);
  });

  it("stores QR modal source so access page can keep lookup errors in modal context", () => {
    const store = new Map<string, string>();
    globalThis.window = {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        removeItem: (key: string) => {
          store.delete(key);
        },
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    } as unknown as Window & typeof globalThis;

    savePendingDoctorLookup("medproof://doctor/dqr_token123", { source: "qr_modal" });

    expect(consumePendingDoctorLookupHandoff()).toEqual({
      value: "medproof://doctor/dqr_token123",
      source: "qr_modal",
    });
    expect(store.has(DOCTOR_LOOKUP_HANDOFF_KEY)).toBe(false);
    expect(store.has(DOCTOR_LOOKUP_HANDOFF_SOURCE_KEY)).toBe(false);
  });
});
