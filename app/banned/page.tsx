import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

export default function BannedPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Your account is suspended
      </h1>
      <p className="text-muted-foreground text-sm text-balance">
        Access to the dashboard, domains and API has been paused for this
        account. If you believe this is a mistake, reply to the suspension email
        or contact support — we usually respond within one business day.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" render={<Link href="/logout" />}>
          Sign out
        </Button>
        <Button render={<Link href="mailto:support@netgoat.dev" />}>
          Contact support
        </Button>
      </div>
    </main>
  );
}
