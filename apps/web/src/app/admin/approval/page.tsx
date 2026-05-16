import Link from "next/link";

import { AdminDoctorTable } from "@/app/admin/_components/admin-doctor-table";
import { AppShell } from "@/components/app-shell";
import { ForbiddenState } from "@/components/state-panel";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { adminNavItems } from "@/lib/admin/navigation";
import { adminDoctorStatuses, loadAdminApprovalState, rowsPerPageOptions } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/session";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminApprovalPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string; pageSize?: string }>;
}) {
  const locale = await getLocale();
  const copy = await getDictionary();
  const role = await requireRole();

  if (role.kind !== "medical_admin") {
    return (
      <AppShell title={copy.admin.approval.title} nav={[]}>
        <ForbiddenState role={role} />
      </AppShell>
    );
  }

  const params = (await searchParams) ?? {};
  const state = await loadAdminApprovalState(params);
  const returnPath = `/admin/approval?status=${state.status}&page=${state.page}&pageSize=${state.pageSize}`;

  return (
    <AppShell title={copy.admin.approval.title} nav={adminNavItems(copy, "approval")}>
      <Card>
        <CardHeader>
          <CardTitle>{copy.admin.approval.title}</CardTitle>
        </CardHeader>

        <div className="mb-5 flex flex-wrap gap-2">
          {adminDoctorStatuses.map((status) => (
            <Link
              key={status}
              href={approvalHref({ status, page: 1, pageSize: state.pageSize })}
              aria-current={state.status === status ? "page" : undefined}
              className={
                state.status === status
                  ? "cursor-pointer rounded-[10px] bg-[var(--color-midnight)] px-4 py-2 text-sm font-semibold text-[var(--color-inverted)]"
                  : "cursor-pointer rounded-[10px] bg-[var(--color-stone-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-midnight)]"
              }
            >
              {statusLabel(copy, status)}
            </Link>
          ))}
        </div>

        <AdminDoctorTable
          doctors={state.doctors}
          copy={copy}
          locale={locale}
          returnPath={returnPath}
          emptyMessage={copy.admin.approval.noDoctors}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <form className="flex items-center gap-2">
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
            <Button type="submit" variant="ghost" className="rounded-[10px]">
              {copy.admin.approval.applyRows}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-end gap-2">
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
      </Card>
    </AppShell>
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
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-[10px] bg-[var(--color-stone-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-ash)]">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={
        active
          ? "cursor-pointer rounded-[10px] bg-[var(--color-midnight)] px-3 py-2 text-sm font-semibold text-[var(--color-inverted)]"
          : "cursor-pointer rounded-[10px] bg-[var(--color-stone-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-midnight)]"
      }
    >
      {children}
    </Link>
  );
}
