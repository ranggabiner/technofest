import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = (path: string) => readFileSync(new URL(`./${path}`, import.meta.url), "utf8");
const component = (path: string) => readFileSync(new URL(`../components/${path}`, import.meta.url), "utf8");

describe("async loading action UI", () => {
  it("uses the shared pending submit button for server-action buttons", () => {
    const sources = [
      app("login/_components/login-content.tsx"),
      app("login/role/page.tsx"),
      app("admin/(portal)/add-admin/add-admin-form.tsx"),
      app("admin/(portal)/add-admin/admin-invitations-list.tsx"),
      app("patient/_components/doctor-access-client.tsx"),
    ];

    for (const source of sources) {
      expect(source).toContain("PendingSubmitButton");
    }
  });

  it("uses the shared loading action button for client-managed loading buttons", () => {
    const sources = [
      component("blockchain-retry-button.tsx"),
      component("proof-status.tsx"),
      app("doctor/_components/doctor-rag-client.tsx"),
      app("doctor/_components/doctor-grant-modal-content.tsx"),
      app("doctor/onboarding/step-2/doctor-document-upload-form.tsx"),
    ];

    for (const source of sources) {
      expect(source).toContain("LoadingActionButton");
    }
  });

  it("keeps loading opacity centralized in the async action helper", () => {
    const helper = component("ui/async-action-button.tsx");
    const loadingConsumers = [
      component("blockchain-retry-button.tsx"),
      component("proof-status.tsx"),
      app("patient/_components/ai-journal-client.tsx"),
      app("doctor/_components/doctor-rag-client.tsx"),
      app("doctor/_components/doctor-grant-modal-content.tsx"),
      app("doctor/onboarding/step-2/doctor-document-upload-form.tsx"),
      app("patient/_components/doctor-access-client.tsx"),
      app("patient/_components/doctor-qr-scanner-modal.tsx"),
    ];

    expect(helper).toContain('isLoading && "cursor-not-allowed disabled:opacity-70"');

    for (const source of loadingConsumers) {
      const openingTags = source.match(/<LoadingActionButton[\s\S]*?>/g) ?? [];

      for (const tag of openingTags) {
        expect(tag).not.toMatch(/disabled:opacity-(50|60)/);
      }
    }
  });
});
