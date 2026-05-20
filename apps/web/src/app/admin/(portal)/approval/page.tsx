import type { ReactNode } from "react";

import { DashboardCard } from "@/app/_components/portal-layout";
import { PortalTransitionLink } from "@/app/_components/portal-navigation";
import { AdminDoctorTable } from "@/app/admin/_components/admin-doctor-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { motion } from "@/components/ui/motion";
import { adminDoctorStatuses, loadAdminApprovalState, rowsPerPageOptions } from "@/lib/admin/service";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminApprovalPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string; pageSize?: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const params = (await searchParams) ?? {};
  const state = await loadAdminApprovalState(params);
  const returnPath = `/admin/approval?status=${state.status}&page=${state.page}&pageSize=${state.pageSize}`;

  return (
    <section className="grid gap-8" data-admin-approval-page="main">
      <header className="border-b border-[var(--color-stone-surface)] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ash)]">
          {copy.admin.nav.doctorVerification}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--color-midnight)] sm:text-4xl md:text-5xl">
          {copy.admin.approval.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ash)]">
          {copy.admin.doctors.queueDescription}
        </p>
      </header>

      <DashboardCard className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {adminDoctorStatuses.map((status) => (
            <PortalTransitionLink
              key={status}
              href={approvalHref({ status, page: 1, pageSize: state.pageSize })}
              aria-current={state.status === status ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-[10px] px-4 py-2 text-sm font-semibold",
                motion.navItem,
                state.status === status
                  ? "bg-[var(--color-midnight)] text-[var(--color-inverted)]"
                  : "bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-parchment-card)]",
              )}
            >
              {statusLabel(copy, status)}
            </PortalTransitionLink>
          ))}
        </div>

        <AdminDoctorTable
          doctors={state.doctors}
          copy={copy}
          locale={locale}
          returnPath={returnPath}
          emptyMessage={copy.admin.approval.noDoctors}
        />

        <div className="mt-5 grid gap-4 lg:flex lg:flex-wrap lg:items-center lg:justify-between">
          <form className="grid gap-2 sm:flex sm:items-center">
            <input type="hidden" name="status" value={state.status} />
            <input type="hidden" name="page" value="1" />
            <label htmlFor="pageSize" className="text-sm font-medium text-[var(--color-graphite)]">
              {copy.admin.approval.rowsPerPage}
            </label>
            <Select id="pageSize" name="pageSize" defaultValue={String(state.pageSize)} className="w-24">
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="ghost" className="w-full rounded-[10px] sm:w-auto">
              {copy.admin.approval.applyRows}
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="text-sm text-[var(--color-ash)]">
              {copy.admin.approval.showing
                .replace("{from}", String(state.showingFrom))
                .replace("{to}", String(state.showingTo))
                .replace("{total}", String(state.totalDoctors))}
            </span>
            <PaginationLink disabled={state.page <= 1} href={approvalHref({ status: state.status, page: state.page - 1, pageSize: state.pageSize })}>
              {copy.admin.approval.prev}
            </PaginationLink>
            {Array.from({ length: state.totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <PaginationLink
                  key={pageNumber}
                  active={pageNumber === state.page}
                  href={approvalHref({ status: state.status, page: pageNumber, pageSize: state.pageSize })}
                >
                  {pageNumber}
                </PaginationLink>
              );
            })}
            <PaginationLink
              disabled={state.page >= state.totalPages}
              href={approvalHref({ status: state.status, page: state.page + 1, pageSize: state.pageSize })}
            >
              {copy.admin.approval.next}
            </PaginationLink>
          </div>
        </div>
      </DashboardCard>
    </section>
  );
}

function approvalHref(input: { status: string; page: number; pageSize: number }) {
  return `/admin/approval?status=${input.status}&page=${input.page}&pageSize=${input.pageSize}`;
}

function statusLabel(copy: Awaited<ReturnType<typeof getDictionary>>, status: string) {
  if (status === "approved") return copy.admin.doctors.approved;
  if (status === "rejected") return copy.admin.doctors.rejected;
  return copy.admin.doctors.pending;
}

function PaginationLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--color-stone-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-ash)]">
        {children}
      </span>
    );
  }

  return (
    <PortalTransitionLink
      href={href}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 py-2 text-sm font-semibold",
        motion.navItem,
        active
          ? "bg-[var(--color-midnight)] text-[var(--color-inverted)]"
          : "bg-[var(--color-stone-surface)] text-[var(--color-midnight)] hover:bg-[var(--color-parchment-card)]",
      )}
    >
      {children}
    </PortalTransitionLink>
  );
}
