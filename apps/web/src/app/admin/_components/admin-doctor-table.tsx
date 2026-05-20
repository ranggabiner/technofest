"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileSearch } from "lucide-react";

import { EmptyState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";
import { ViewportModal, ViewportModalPanel } from "@/components/ui/viewport-modal";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import type { AdminDoctorReview } from "@/lib/admin/service";

const AdminReviewModal = dynamic(
  () => import("./admin-review-modal").then((module) => module.AdminReviewModal),
  {
    ssr: false,
    loading: () => <AdminReviewModalFallback />,
  },
);

export function AdminDoctorTable({
  doctors,
  copy,
  locale,
  returnPath,
  emptyMessage,
}: {
  doctors: AdminDoctorReview[];
  copy: Dictionary;
  locale: Locale;
  returnPath: string;
  emptyMessage: string;
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const selectedDoctor = doctors.find((doctor) => doctor.doctorId === selectedDoctorId);

  return (
    <>
      <div data-admin-doctor-cards className="grid gap-3 md:hidden">
        {doctors.length === 0 ? (
          <EmptyState icon={false} className="block text-center" message={emptyMessage} />
        ) : (
          doctors.map((doctor) => (
            <article
              key={doctor.doctorId}
              className="grid gap-4 rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-subtle)]"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold text-[var(--color-midnight)]">{doctor.fullName}</p>
                <p className="mt-1 text-sm text-[var(--color-graphite)]">
                  {doctor.specialization ?? copy.common.noSpecializationShort}
                </p>
              </div>
              <dl className="grid gap-1 text-sm">
                <dt className="text-xs font-semibold uppercase text-[var(--color-ash)]">
                  {copy.admin.table.dateRegistered}
                </dt>
                <dd className="text-[var(--color-graphite)]">{formatDateTime(doctor.createdAt, locale)}</dd>
              </dl>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-[10px]"
                onClick={() => setSelectedDoctorId(doctor.doctorId)}
              >
                <FileSearch size={16} aria-hidden="true" />
                {copy.admin.table.review}
              </Button>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
          <thead className="text-xs uppercase text-[var(--color-ash)]">
            <tr>
              <th className="border-b border-[var(--color-stone-surface)] px-3 py-3">{copy.admin.table.doctorName}</th>
              <th className="border-b border-[var(--color-stone-surface)] px-3 py-3">{copy.admin.table.speciality}</th>
              <th className="border-b border-[var(--color-stone-surface)] px-3 py-3">{copy.admin.table.dateRegistered}</th>
              <th className="border-b border-[var(--color-stone-surface)] px-3 py-3 text-right">{copy.admin.table.action}</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[var(--color-ash)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor.doctorId}>
                  <td className="border-b border-[var(--color-stone-surface)] px-3 py-4 font-semibold text-[var(--color-midnight)]">
                    {doctor.fullName}
                  </td>
                  <td className="border-b border-[var(--color-stone-surface)] px-3 py-4 text-[var(--color-graphite)]">
                    {doctor.specialization ?? copy.common.noSpecializationShort}
                  </td>
                  <td className="border-b border-[var(--color-stone-surface)] px-3 py-4 text-[var(--color-graphite)]">
                    {formatDateTime(doctor.createdAt, locale)}
                  </td>
                  <td className="border-b border-[var(--color-stone-surface)] px-3 py-4 text-right">
                    <Button type="button" variant="ghost" className="rounded-[10px]" onClick={() => setSelectedDoctorId(doctor.doctorId)}>
                      <FileSearch size={16} aria-hidden="true" />
                      {copy.admin.table.review}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDoctor ? (
        <AdminReviewModal
          doctor={selectedDoctor}
          copy={copy}
          returnPath={returnPath}
          onClose={() => setSelectedDoctorId(null)}
        />
      ) : null}
    </>
  );
}

function AdminReviewModalFallback() {
  return (
    <ViewportModal className="bg-black/35 sm:py-6">
      <ViewportModalPanel className="grid max-h-[calc(100dvh-2rem)] min-h-[min(420px,calc(100dvh-2rem))] w-full max-w-3xl animate-pulse gap-5 overflow-hidden rounded-[10px] border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-elevated)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid flex-1 gap-3">
            <div className="h-7 w-44 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
            <div className="h-5 w-56 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
          </div>
          <div className="size-10 rounded-full bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
        </div>
        <div className="grid gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 md:grid-cols-3">
          <div className="h-12 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
          <div className="h-12 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
          <div className="h-12 rounded-[10px] bg-[color-mix(in_srgb,var(--color-ash)_18%,transparent)]" />
        </div>
        <div className="grid gap-3">
          <div className="h-16 rounded-[10px] border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-ash)_10%,transparent)]" />
          <div className="h-16 rounded-[10px] border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-ash)_10%,transparent)]" />
          <div className="h-16 rounded-[10px] border border-[var(--color-stone-surface)] bg-[color-mix(in_srgb,var(--color-ash)_10%,transparent)]" />
        </div>
      </ViewportModalPanel>
    </ViewportModal>
  );
}
