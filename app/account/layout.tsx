import type { Metadata } from "next";

import { AccountNav } from "@/components/account/account-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | Account | NetGoat",
  },
};

/**
 * The account area keeps the dashboard chrome, so profile/security/billing
 * feel like part of the workspace rather than a separate site.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell contextLabel="Account">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Account"
          description="Your profile, security, sessions and billing across every team."
        />
        <AccountNav />
        {children}
      </div>
    </WorkspaceShell>
  );
}
