"use client";

import { useRef } from "react";

import {
  ProfileConfirmationHost,
  ProfileFormControls,
  ProfilePhotoPicker,
} from "@/app/_components/profile-shell";
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
            <Input id="full_name" name="full_name" defaultValue={patient.fullName} required />
          </Field>
          <Field>
            <Label htmlFor="email">{copy.patient.email}</Label>
            <Input id="email" name="email" defaultValue={patient.email} disabled />
            <p className="text-xs text-[var(--color-ash)]">{copy.patient.emailLocked}</p>
          </Field>
          <Field>
            <Label htmlFor="date_of_birth">{copy.patient.dateOfBirth}</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient.dateOfBirth} />
          </Field>
          <Field>
            <Label htmlFor="gender">{copy.patient.gender}</Label>
            <Select id="gender" name="gender" defaultValue={patient.gender} required>
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
          saveLabel={copy.patient.save}
          cancelLabel={copy.patient.cancel}
          formRef={formRef}
          onCancel={() => {
            formRef.current?.reset();
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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <ProfileConfirmationHost />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl">
          {copy.patient.profilingTitle}
        </h1>
      </div>

      <form ref={formRef} action={updatePatientProfilingAction} className="space-y-5">
        <section className="rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--color-midnight)]">
            {copy.patient.dailyLifeTitle}
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <Label htmlFor="activity_level">{copy.patient.activityLevel}</Label>
              <Select id="activity_level" name="activity_level" defaultValue={patient.profiling.activityLevel}>
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
              <Input id="sleep_hours" name="sleep_hours" type="number" min={0} max={24} step={0.5} defaultValue={patient.profiling.sleepHours} />
            </Field>
            <Field>
              <Label htmlFor="current_feeling">{copy.patient.currentFeeling}</Label>
              <Select id="current_feeling" name="current_feeling" defaultValue={patient.profiling.currentFeeling}>
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
              <Input id="living_environment" name="living_environment" defaultValue={patient.profiling.livingEnvironment} />
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
              <Textarea id="allergies" name="allergies" defaultValue={patient.profiling.allergies} />
            </Field>
            <Field>
              <Label htmlFor="known_history">{copy.patient.knownHistory}</Label>
              <Textarea id="known_history" name="known_history" defaultValue={patient.profiling.knownHistory} />
            </Field>
            <Field>
              <Label htmlFor="discovered_from">{copy.patient.discoveredFrom}</Label>
              <Input id="discovered_from" name="discovered_from" defaultValue={patient.profiling.discoveredFrom} />
            </Field>
          </div>
        </section>

        <ProfileFormControls
          copy={copy}
          saveLabel={copy.patient.save}
          cancelLabel={copy.patient.cancel}
          formRef={formRef}
          onCancel={() => {
            formRef.current?.reset();
          }}
        />
      </form>
    </div>
  );
}
