"use client";

import { useRef, useState, type RefObject } from "react";

import {
  ProfileConfirmationHost,
  openProfileConfirmation,
} from "@/app/_components/profile-shell";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";

import { updateAdminProfileAction } from "./actions";

type AdminProfileView = {
  full_name: string;
  phone_number: string | null;
  email: string;
};

export function AdminProfileClient({
  copy,
  admin,
}: {
  copy: Dictionary["profile"];
  admin: AdminProfileView;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <form
        ref={formRef}
        action={updateAdminProfileAction}
        className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[var(--color-midnight)]">{copy.admin.title}</h1>
          <Button type="button" variant="secondary" className="w-full rounded-[10px] sm:w-auto" onClick={() => setIsEditing(true)}>
            {copy.admin.edit}
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="full_name">{copy.admin.fullName}</Label>
            <Input id="full_name" name="full_name" defaultValue={admin.full_name} readOnly={!isEditing} required />
          </Field>
          <Field>
            <Label htmlFor="phone_number">{copy.admin.phoneNumber}</Label>
            <Input id="phone_number" name="phone_number" defaultValue={admin.phone_number ?? ""} readOnly={!isEditing} />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="email">{copy.admin.email}</Label>
            <Input id="email" defaultValue={admin.email} disabled />
          </Field>
        </div>
        <ProfileFormControls
          copy={copy}
          formRef={formRef}
          onCancel={() => {
            formRef.current?.reset();
            setIsEditing(false);
          }}
        />
      </form>
    </div>
  );
}

function ProfileFormControls({
  copy,
  formRef,
  onCancel,
}: {
  copy: Dictionary["profile"];
  formRef: RefObject<HTMLFormElement | null>;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 grid gap-2 sm:flex sm:justify-end sm:gap-3">
      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-[10px] sm:w-auto"
        onClick={() =>
          openProfileConfirmation({
            title: copy.confirm.cancelTitle,
            description: copy.confirm.cancelDescription,
            confirmLabel: copy.confirm.yes,
            cancelLabel: copy.confirm.no,
            onConfirm: onCancel,
          })
        }
      >
        {copy.admin.cancel}
      </Button>
      <PendingSubmitButton
        type="button"
        className="w-full rounded-[10px] sm:w-auto"
        loadingLabel={copy.admin.save}
        slotClassName="w-full sm:w-auto"
        onClick={() =>
          openProfileConfirmation({
            title: copy.confirm.saveTitle,
            description: copy.confirm.saveDescription,
            confirmLabel: copy.confirm.yes,
            cancelLabel: copy.confirm.no,
            onConfirm: () => formRef.current?.requestSubmit(),
          })
        }
      >
        {copy.admin.save}
      </PendingSubmitButton>
    </div>
  );
}
