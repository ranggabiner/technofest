"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  ProfileConfirmationHost,
  ProfileFormPanel,
  ProfileFormControls,
  ProfileIdentityPanel,
  ProfilePhotoPicker,
  preventCleanProfileSubmit,
  useProfileFormDirty,
} from "@/app/_components/profile-shell";
import { InlineStatusMessage } from "@/components/state-messages";
import { Field, Input, Label } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { initialProfileFormState } from "@/lib/profile/form-state";

import { updateAdminProfileAction } from "./actions";

type AdminProfileView = {
  full_name: string;
  phone_number: string | null;
  email: string;
};

export function AdminProfileClient({
  copy,
  admin,
  avatarUrl,
}: {
  copy: Dictionary["profile"];
  admin: AdminProfileView;
  avatarUrl: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const [state, formAction] = useActionState(updateAdminProfileAction, initialProfileFormState);
  const profileFormDirty = useProfileFormDirty(formRef);

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <ProfileIdentityPanel
        photo={
          <ProfilePhotoPicker
            src={avatarUrl}
            name={admin.full_name}
            changeLabel={copy.photo.changePhoto}
            formId={formId}
            inputName="profile_photo"
            onDirtyStateChange={profileFormDirty.updateDirtyState}
            uploadErrors={copy.photo.uploadErrors}
            onBusyChange={setIsPhotoBusy}
          />
        }
      >
        <h1 className="text-2xl font-semibold text-[var(--color-midnight)]">{copy.admin.title}</h1>
        <p className="mt-1 break-all text-sm text-[var(--color-ash)]">{admin.email}</p>
      </ProfileIdentityPanel>
      <ProfileFormPanel
        id={formId}
        formRef={formRef}
        action={formAction}
        onSubmit={(event) => preventCleanProfileSubmit(event, profileFormDirty)}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[var(--color-midnight)]">{copy.admin.title}</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="full_name">{copy.admin.fullName}</Label>
            <Input id="full_name" name="full_name" defaultValue={admin.full_name} required />
          </Field>
          <Field>
            <Label htmlFor="phone_number">{copy.admin.phoneNumber}</Label>
            <Input id="phone_number" name="phone_number" defaultValue={admin.phone_number ?? ""} />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="email">{copy.admin.email}</Label>
            <Input id="email" defaultValue={admin.email} disabled />
          </Field>
        </div>
        {state.message ? <InlineStatusMessage className="mt-5" tone="danger" message={state.message} /> : null}
        <ProfileFormControls
          copy={copy}
          saveLabel={copy.admin.save}
          cancelLabel={copy.admin.cancel}
          disabled={!profileFormDirty.isDirty || isPhotoBusy}
          formRef={formRef}
          onCancel={() => {
            formRef.current?.reset();
          }}
        />
      </ProfileFormPanel>
    </div>
  );
}
