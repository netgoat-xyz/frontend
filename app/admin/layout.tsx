import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | NetGoat Admin" },
};

/**
 * Admin console layout. The guard runs here and in every server action, so a
 * missing check in one page can never expose admin data or mutations.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return <AdminShell>{children}</AdminShell>;
}
