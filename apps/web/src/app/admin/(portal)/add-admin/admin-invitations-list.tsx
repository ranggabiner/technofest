"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppToast } from "@/components/ui/app-toast";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { EmptyState } from "@/components/state-messages";
import { StatusBadge } from "@/components/status-badge";
import type { AdminInvitationListItem } from "@/lib/admin/service";
import { formatDateTime } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";

import { revokeAdminInvitationAction } from "./actions";
import {
  initialRevokeAdminInvitationFormState,
  type RevokeAdminInvitationFormState,
} from "./form-state";

type AdminInvitationListProps = {
  copy: Dictionary["admin"]["addAdmin"];
  invitations: AdminInvitationListItem[];
  locale: Locale;
};

export function AdminInvitationList({ copy, invitations, locale }: AdminInvitationListProps) {
  const [hiddenInvitationIds, setHiddenInvitationIds] = useState<ReadonlySet<string>>(new Set());
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const visibleInvitations = useMemo(
    () => invitations.filter((invitation) => !hiddenInvitationIds.has(invitation.invitationId)),
    [hiddenInvitationIds, invitations],
  );

  function handleRevoked(invitationId: string, message: string) {
    setHiddenInvitationIds((current) => new Set(current).add(invitationId));
    setToastMessage(message);
    setToastKey((key) => key + 1);
  }

  return (
    <div className="grid gap-4" data-admin-invitations-list="active">
      <AppToast message={toastMessage} triggerKey={toastKey} />

      {visibleInvitations.length === 0 ? (
        <EmptyState icon={false} className="block" message={copy.noAdmins} />
      ) : (
        <ul className="grid gap-3">
          {visibleInvitations.map((invitation) => (
            <li
              key={invitation.invitationId}
              className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-all font-semibold text-[var(--color-midnight)]">{invitation.email}</p>
                  <StatusBadge tone={invitation.status === "active" ? "approved" : "pending"}>
                    {invitation.status === "active" ? copy.statusActive : copy.statusPending}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ash)]">
                  {copy.createdAt}: {formatDateTime(invitation.createdAt, locale)}
                  {invitation.acceptedAt ? ` · ${copy.acceptedAt}: ${formatDateTime(invitation.acceptedAt, locale)}` : ""}
                </p>
              </div>

              <RevokeAdminInvitationForm
                copy={copy}
                invitationId={invitation.invitationId}
                onRevoked={handleRevoked}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RevokeAdminInvitationForm({
  copy,
  invitationId,
  onRevoked,
}: {
  copy: Dictionary["admin"]["addAdmin"];
  invitationId: string;
  onRevoked: (invitationId: string, message: string) => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<RevokeAdminInvitationFormState, FormData>(
    revokeAdminInvitationAction,
    initialRevokeAdminInvitationFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onRevoked(invitationId, state.message);
      router.refresh();
    }
  }, [invitationId, onRevoked, router, state.message, state.status]);

  return (
    <form action={formAction} className="grid gap-2 sm:justify-items-end">
      <input type="hidden" name="invitation_id" value={invitationId} />
      <PendingSubmitButton
        type="submit"
        variant="destructive"
        className="w-full rounded-[10px] sm:w-auto"
        loadingLabel={copy.revoking}
        slotClassName="w-full sm:w-auto"
      >
        <Trash2 size={16} aria-hidden="true" />
        {copy.revoke}
      </PendingSubmitButton>
      {state.status === "error" && state.message ? (
        <p className="max-w-xs text-sm text-[var(--color-error-red)]">{state.message}</p>
      ) : null}
    </form>
  );
}
