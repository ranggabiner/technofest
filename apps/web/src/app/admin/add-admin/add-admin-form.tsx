"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { initialInviteAdminFormState, inviteAdminAction } from "./actions";

export function AddAdminForm({ copy }: { copy: Dictionary["admin"]["addAdmin"] }) {
  const [state, formAction, isPending] = useActionState(inviteAdminAction, initialInviteAdminFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status, state.message]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-5">
      <Field>
        <Label htmlFor="admin_email">{copy.emailLabel}</Label>
        <Input
          id="admin_email"
          name="email"
          type="email"
          placeholder={copy.emailPlaceholder}
          aria-describedby={state.message ? "admin-invite-message" : undefined}
        />
      </Field>

      {state.message ? (
        <p
          id="admin-invite-message"
          className={state.status === "success" ? "text-sm text-[var(--color-success-text)]" : "text-sm text-[var(--color-error-red)]"}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full rounded-[10px]" disabled={isPending}>
        <UserPlus size={16} aria-hidden="true" />
        {isPending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
