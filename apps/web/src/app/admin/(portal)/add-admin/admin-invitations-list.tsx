"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
  const [successMessage, setSuccessMessage] = useState("");
  const visibleInvitations = useMemo(
    () => invitations.filter((invitation) => !hiddenInvitationIds.has(invitation.invitationId)),
    [hiddenInvitationIds, invitations],
  );

  function handleRevoked(invitationId: string, message: string) {
    setHiddenInvitationIds((current) => new Set(current).add(invitationId));
    setSuccessMessage(message);
  }

  return (
    <div className="grid gap-4" data-admin-invitations-list="active">
      {successMessage ? (
        <p className="rounded-[10px] bg-[var(--color-success-surface)] p-4 text-sm font-medium text-[var(--color-success-text)]">
          {successMessage}
        </p>
      ) : null}

      {visibleInvitations.length === 0 ? (
        <p className="rounded-[10px] bg-[var(--color-stone-surface)] p-4 text-sm text-[var(--color-ash)]">
          {copy.noAdmins}
        </p>
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
  const [state, formAction, isPending] = useActionState<RevokeAdminInvitationFormState, FormData>(
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
      <Button type="submit" variant="destructive" className="rounded-[10px]" disabled={isPending}>
        <Trash2 size={16} aria-hidden="true" />
        {isPending ? copy.revoking : copy.revoke}
      </Button>
      {state.status === "error" && state.message ? (
        <p className="max-w-xs text-sm text-[var(--color-error-red)]">{state.message}</p>
      ) : null}
    </form>
  );
}
