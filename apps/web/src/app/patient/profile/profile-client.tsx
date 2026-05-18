"use client";

import { useRef, useState, type RefObject } from "react";

import {
  ProfileConfirmationHost,
  ProfilePhotoPicker,
  openProfileConfirmation,
} from "@/app/_components/profile-shell";
import { PendingSubmitButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { PatientProfileState } from "@/lib/profile/service";

import { updatePatientAccountSettingsAction, updatePatientProfilingAction } from "./actions";

export function PatientProfileSettingsClient({
  copy,
  patient,
  avatarUrl,
}: {
  copy: Dictionary["profile"];
  patient: PatientProfileState;
  avatarUrl: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
            {copy.patient.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl">
            {copy.patient.title}
          </h1>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfilePhotoPicker src={avatarUrl} name={patient.fullName} changeLabel={copy.photo.changePhoto} />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-[var(--color-midnight)]">{patient.fullName}</h2>
            <p className="mt-1 text-sm text-[var(--color-ash)]">{copy.patient.identityGreeting}</p>
          </div>
          <Button type="button" variant="secondary" className="w-full rounded-[10px] sm:w-auto" onClick={() => setIsEditing(true)}>
            {copy.patient.edit}
          </Button>
        </div>
      </section>

      <form
        ref={formRef}
        action={updatePatientAccountSettingsAction}
        className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6"
      >
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[var(--color-midnight)]">
          {copy.patient.personalDataTitle}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="full_name">{copy.patient.fullName}</Label>
            <Input id="full_name" name="full_name" defaultValue={patient.fullName} readOnly={!isEditing} required />
          </Field>
          <Field>
            <Label htmlFor="email">{copy.patient.email}</Label>
            <Input id="email" name="email" defaultValue={patient.email} disabled />
            <p className="text-xs text-[var(--color-ash)]">{copy.patient.emailLocked}</p>
          </Field>
          <Field>
            <Label htmlFor="date_of_birth">{copy.patient.dateOfBirth}</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient.dateOfBirth} readOnly={!isEditing} />
          </Field>
          <Field>
            <Label htmlFor="gender">{copy.patient.gender}</Label>
            {!isEditing ? <input type="hidden" name="gender" value={patient.gender} /> : null}
            <Select id="gender" name="gender" defaultValue={patient.gender} disabled={!isEditing} required>
              <option value="" disabled>
                {copy.patient.genderPlaceholder}
              </option>
              {copy.patient.genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
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

export function PatientProfilingClient({
  copy,
  patient,
}: {
  copy: Dictionary["profile"];
  patient: PatientProfileState;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl">
          {copy.patient.profilingTitle}
        </h1>
        <Button type="button" variant="secondary" className="w-full rounded-[10px] sm:w-auto" onClick={() => setIsEditing(true)}>
          {copy.patient.edit}
        </Button>
      </div>

      <form ref={formRef} action={updatePatientProfilingAction} className="space-y-5">
        <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--color-midnight)]">
            {copy.patient.dailyLifeTitle}
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <Label htmlFor="activity_level">{copy.patient.activityLevel}</Label>
              {!isEditing ? <input type="hidden" name="activity_level" value={patient.profiling.activityLevel} /> : null}
              <Select id="activity_level" name="activity_level" defaultValue={patient.profiling.activityLevel} disabled={!isEditing}>
                <option value="">{copy.patient.emptyValue}</option>
                {copy.patient.activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="sleep_hours">{copy.patient.sleepHours}</Label>
              <Input id="sleep_hours" name="sleep_hours" type="number" min={0} max={24} step={0.5} defaultValue={patient.profiling.sleepHours} readOnly={!isEditing} />
            </Field>
            <Field>
              <Label htmlFor="current_feeling">{copy.patient.currentFeeling}</Label>
              {!isEditing ? <input type="hidden" name="current_feeling" value={patient.profiling.currentFeeling} /> : null}
              <Select id="current_feeling" name="current_feeling" defaultValue={patient.profiling.currentFeeling} disabled={!isEditing}>
                <option value="">{copy.patient.emptyValue}</option>
                {copy.patient.feelingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="living_environment">{copy.patient.livingEnvironment}</Label>
              <Input id="living_environment" name="living_environment" defaultValue={patient.profiling.livingEnvironment} readOnly={!isEditing} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--color-midnight)]">
            {copy.patient.additionalInfoTitle}
          </h2>
          <div className="grid gap-5">
            <Field>
              <Label htmlFor="allergies">{copy.patient.allergies}</Label>
              <Textarea id="allergies" name="allergies" defaultValue={patient.profiling.allergies} readOnly={!isEditing} />
            </Field>
            <Field>
              <Label htmlFor="known_history">{copy.patient.knownHistory}</Label>
              <Textarea id="known_history" name="known_history" defaultValue={patient.profiling.knownHistory} readOnly={!isEditing} />
            </Field>
            <Field>
              <Label htmlFor="discovered_from">{copy.patient.discoveredFrom}</Label>
              <Input id="discovered_from" name="discovered_from" defaultValue={patient.profiling.discoveredFrom} readOnly={!isEditing} />
            </Field>
          </div>
        </section>

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
        {copy.patient.cancel}
      </Button>
      <PendingSubmitButton
        type="button"
        className="w-full rounded-[10px] sm:w-auto"
        loadingLabel={copy.patient.save}
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
        {copy.patient.save}
      </PendingSubmitButton>
    </div>
  );
}
