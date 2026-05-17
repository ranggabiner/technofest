import { redirect } from "next/navigation";

import { SiteFooterContent } from "@/components/site-footer";
import { ForbiddenState } from "@/components/state-panel";
import { requireRole } from "@/lib/auth/session";
import { roleOnboardingPath } from "@/lib/auth/roles";
import { loadPatientJournalState } from "@/lib/ai/journal-service";
import { getDictionary } from "@/lib/i18n/server";

import { AiJournalClient } from "../_components/ai-journal-client";
import { StatusToast } from "./status-toast";

export const dynamic = "force-dynamic";

export default async function PatientChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ ai_error?: string; ai_status?: string; ai_toast?: string }>;
}) {
  const copy = await getDictionary();
  const role = await requireRole();
  if (role.kind !== "patient") {
    return (
      <div className="min-h-screen bg-[var(--color-warm-canvas)]">
        <main className="grid min-h-screen place-items-center px-6">
          <div className="w-full max-w-[680px]">
            <ForbiddenState role={role} />
          </div>
        </main>
        <SiteFooterContent copy={copy} />
      </div>
    );
  }
  const onboardingPath = roleOnboardingPath(role);
  if (!role.patientId || onboardingPath) redirect(onboardingPath ?? "/login/role");

  const params = (await searchParams) ?? {};
  const statusToastKey = params.ai_error === "finalize_failed"
    ? `finalize_failed:${params.ai_toast ?? "default"}`
    : params.ai_status === "finalized"
      ? `finalized:${params.ai_toast ?? "default"}`
      : "none";
  const state = await loadPatientJournalState(role);

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <main className="h-screen overflow-hidden bg-[var(--color-warm-canvas)]">
        <StatusToast
          key={statusToastKey}
          failedMessage={
            params.ai_error === "finalize_failed"
              ? copy.patient.chat.finalizeFailed
              : null
          }
          successMessage={
            params.ai_status === "finalized"
              ? copy.patient.chat.finalized
              : null
          }
        />

        <section
          data-chat-layout="stitch-chat-workspace"
          className="h-full overflow-hidden bg-[var(--color-warm-canvas)]"
        >
          <AiJournalClient
            initialSessionId={state.activeSessionId}
            initialHistory={state.chatHistory}
            initialMessages={state.messages}
            initialSessionClosed={state.activeSessionClosed}
            latestSummary={state.latestSummary}
            initialSummaryGenerationStatus={state.latestSummaryStatus}
            copy={copy.patient.chat}
            navigationCopy={{
              dashboard: copy.patient.nav.dashboard,
              access: copy.patient.nav.access,
            }}
          />
        </section>
      </main>
      <SiteFooterContent copy={copy} />
    </div>
  );
}
