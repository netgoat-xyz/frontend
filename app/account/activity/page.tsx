import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/auth-guards";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { describeUserAgent } from "@/lib/user-agent";

export const metadata: Metadata = {
  title: "Activity",
};

export default async function AccountActivityPage() {
  await requireUser();

  const sessions = await auth.api.listSessions({ headers: await headers() });

  const ordered = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Account activity
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign-ins recorded for this account, newest first.
        </p>
      </div>

      {ordered.length === 0 ? (
        <Empty className="border-border rounded-xl border border-dashed py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} />
            </EmptyMedia>
            <EmptyTitle>No recorded activity</EmptyTitle>
            <EmptyDescription>
              Sign-ins will appear here as they happen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="divide-border divide-y rounded-xl border">
          {ordered.map((session) => {
            const device = describeUserAgent(session.userAgent);
            return (
              <li
                key={session.id}
                className="flex items-start justify-between gap-4 px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Signed in with {device.browser}
                    {device.os ? ` on ${device.os}` : ""}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {session.ipAddress
                      ? `${session.ipAddress} · `
                      : ""}
                    session expires {formatDateTime(session.expiresAt)}
                  </span>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {formatRelativeTime(session.createdAt)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
