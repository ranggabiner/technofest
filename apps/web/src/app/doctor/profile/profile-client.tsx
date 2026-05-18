"use client";

import { useRef, useState, type RefObject } from "react";
import { Download, Eye, FileText } from "lucide-react";

import {
  ProfileConfirmationHost,
  ProfilePhotoPicker,
  openProfileConfirmation,
} from "@/app/_components/profile-shell";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatFileSize, getFileTypeLabel } from "@/lib/kyc/preview";
import type { KycDocumentSummary } from "@/lib/kyc/summaries";

import { updateDoctorLettersAction, updateDoctorProfileAction } from "./actions";

type DoctorProfileView = {
  full_name: string;
  email: string;
  phone_number: string | null;
  specialization: string | null;
  account_status: string;
};

export function DoctorProfileClient({
  copy,
  doctor,
  documents,
  avatarUrl,
}: {
  copy: Dictionary["profile"];
  doctor: DoctorProfileView;
  documents: KycDocumentSummary[];
  avatarUrl: string | null;
}) {
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const lettersFormRef = useRef<HTMLFormElement>(null);
  const verified = doctor.account_status === "approved";
  const displayName = doctor.full_name.replace(/^dr\.?\s+/i, "").trim() || doctor.full_name;

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl">
        {copy.doctor.title}
      </h1>

      <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfilePhotoPicker src={avatarUrl} name={doctor.full_name} changeLabel={copy.photo.changePhoto} />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-[var(--color-midnight)]">
              Dr. {displayName}.Msi&apos;s Profile
            </h2>
            <span className="mt-3 inline-flex rounded-full bg-[var(--color-teal-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-teal-deep)]">
              {verified ? copy.doctor.verified : copy.doctor.underVerification}
            </span>
          </div>
        </div>
      </section>

      <form
        ref={profileFormRef}
        action={updateDoctorProfileAction}
        className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-midnight)]">{copy.doctor.profileCardTitle}</h2>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-[10px] sm:w-auto"
            onClick={() =>
              openProfileConfirmation({
                title: copy.confirm.doctorApprovalTitle,
                description: copy.confirm.doctorApprovalDescription,
                confirmLabel: copy.confirm.yes,
                cancelLabel: copy.confirm.no,
                onConfirm: () => setIsProfileEditing(true),
              })
            }
          >
            {copy.doctor.edit}
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="full_name">{copy.doctor.fullName}</Label>
            <Input id="full_name" name="full_name" defaultValue={doctor.full_name} disabled={!isProfileEditing} required />
          </Field>
          <Field>
            <Label htmlFor="email">{copy.doctor.email}</Label>
            <Input id="email" defaultValue={doctor.email} disabled />
          </Field>
          <Field>
            <Label htmlFor="specialization">{copy.doctor.specialization}</Label>
            <Select id="specialization" name="specialization" defaultValue={doctor.specialization ?? ""} disabled={!isProfileEditing}>
              <option value="">{copy.doctor.emptyValue}</option>
              {copy.doctor.specializationOptions.map((option) => (
                <option key={option.value} value={option.label}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="phone_number">{copy.doctor.phoneNumber}</Label>
            <Input id="phone_number" name="phone_number" defaultValue={doctor.phone_number ?? ""} disabled={!isProfileEditing} />
          </Field>
        </div>
        {isProfileEditing ? (
          <ProfileFormControls
            copy={copy}
            saveLabel={copy.doctor.save}
            cancelLabel={copy.doctor.cancel}
            formRef={profileFormRef}
            onCancel={() => {
              profileFormRef.current?.reset();
              setIsProfileEditing(false);
            }}
          />
        ) : null}
      </form>

      <form
        ref={lettersFormRef}
        action={updateDoctorLettersAction}
        className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6"
      >
        <h2 className="mb-6 text-lg font-semibold text-[var(--color-midnight)]">{copy.doctor.lettersTitle}</h2>
        <div className="grid gap-4">
          {documents.map((document) => (
            <div
              key={document.documentType}
              className="grid gap-3 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-parchment-card)] p-4 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText size={18} className="text-[var(--color-teal-deep)]" aria-hidden="true" />
                  <h3 className="break-words font-semibold text-[var(--color-midnight)]">
                    {copy.doctor.documentTitles[document.documentType]}
                  </h3>
                </div>
                <p className="mt-1 break-words text-sm text-[var(--color-ash)]">
                  {document.filename ?? copy.doctor.noDocument} - {getFileTypeLabel(document.mimeType, document.filename)} - {formatFileSize(document.fileSizeBytes)}
                </p>
                <Input className="mt-3" type="file" name={document.documentType} accept="application/pdf,image/jpeg,image/png" />
              </div>
              {document.documentId ? (
                <div className="grid gap-2 sm:flex sm:items-start">
                  <Button asChild variant="ghost" className="w-full rounded-[10px] sm:w-auto">
                    <a href={`/doctor/profile/documents/${document.documentId}`}>
                      <Eye size={16} />
                      {copy.doctor.view}
                    </a>
                  </Button>
                  <Button asChild variant="ghost" className="w-full rounded-[10px] sm:w-auto">
                    <a href={`/doctor/profile/documents/${document.documentId}/download`}>
                      <Download size={16} />
                      {copy.doctor.download}
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <ProfileFormControls
          copy={copy}
          saveLabel={copy.doctor.save}
          cancelLabel={copy.doctor.cancel}
          formRef={lettersFormRef}
          onCancel={() => lettersFormRef.current?.reset()}
        />
      </form>
    </div>
  );
}

function ProfileFormControls({
  copy,
  saveLabel,
  cancelLabel,
  formRef,
  onCancel,
}: {
  copy: Dictionary["profile"];
  saveLabel: string;
  cancelLabel: string;
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
        {cancelLabel}
      </Button>
      <PendingSubmitButton
        type="button"
        className="w-full rounded-[10px] sm:w-auto"
        loadingLabel={saveLabel}
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
        {saveLabel}
      </PendingSubmitButton>
    </div>
  );
}
