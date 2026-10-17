import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { AccountNav } from "@/components/account/account-nav";
import { NetgoatLogo } from "@/components/brand/netgoat-logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | Account | NetGoat",
  },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-6">
          <NetgoatLogo size="sm" href="/dashboard" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/dashboard" />}
            >
              <HugeiconsIcon icon={DashboardSquare01Icon} />
              Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
        <AccountNav />
        {children}
      </div>
    </div>
  );
}
