import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { listAdminUsers } from "@/lib/data/admin-users";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const parsedPage = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await listAdminUsers({ search: query, page });

  return (
    <>
      <PageHeader
        title="Users"
        description="Search accounts, adjust roles and suspend access. Every change is applied through the auth layer and takes effect immediately."
      />
      <AdminUsersTable
        users={result.users}
        total={result.total}
        page={result.page}
        pages={result.pages}
        query={query}
      />
    </>
  );
}
