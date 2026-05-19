"use client";

import { useRef } from "react";

import {
  ProfileConfirmationHost,
  ProfileFormControls,
} from "@/app/_components/profile-shell";
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
        <ProfileFormControls
          copy={copy}
          saveLabel={copy.admin.save}
          cancelLabel={copy.admin.cancel}
          formRef={formRef}
          onCancel={() => {
            formRef.current?.reset();
          }}
        />
      </form>
    </div>
  );
}
