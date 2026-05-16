"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import type { AdminDoctorReview } from "@/lib/admin/service";

import { AdminReviewModal } from "./admin-review-modal";

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
      <div className="overflow-x-auto">
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
