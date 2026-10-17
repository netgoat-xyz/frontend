"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ComputerIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { describeUserAgent } from "@/lib/user-agent";

export type SessionInfo = {
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

/** Active sessions with per-session revocation. */
export function SessionsList({ sessions }: { sessions: SessionInfo[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const otherCount = sessions.filter((session) => !session.current).length;

  async function revoke(token: string) {
    setPending(token);

    const { error } = await authClient.revokeSession({ token });

    setPending(null);

    if (error) {
      toastManager.add({
        type: "error",
        title: "Could not sign out that device",
        description: error.message ?? "Please try again.",
      });
      return;
    }

    toastManager.add({ type: "success", title: "Device signed out" });
    router.refresh();
  }

  async function revokeOthers() {
    setPending("others");

    const { error } = await authClient.revokeOtherSessions();

    setPending(null);

    if (error) {
      toastManager.add({
        type: "error",
        title: "Could not sign out other devices",
        description: error.message ?? "Please try again.",
      });
      return;
    }

    toastManager.add({
      type: "success",
      title: "Other devices signed out",
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={ComputerIcon} className="size-4" />
              Sessions
            </CardTitle>
            <CardDescription>
              Devices currently signed in to this account.
            </CardDescription>
          </div>
          {otherCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              onClick={revokeOthers}
            >
              {pending === "others" ? (
                <Spinner className="size-4" />
              ) : null}
              Sign out other devices
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="divide-border flex flex-col divide-y">
        {sessions.map((session) => {
          const device = describeUserAgent(session.userAgent);
          return (
            <div
              key={session.token}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {device.browser}
                  {device.os ? (
                    <span className="text-muted-foreground font-normal">
                      on {device.os}
                    </span>
                  ) : null}
                  {session.current ? (
                    <Badge variant="success">This device</Badge>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-xs">
                  {session.ipAddress ? `${session.ipAddress} · ` : ""}
                  started {formatRelativeTime(session.createdAt)} · expires{" "}
                  {formatDateTime(session.expiresAt)}
                </span>
              </div>

              {session.current ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending !== null}
                  onClick={() => revoke(session.token)}
                >
                  {pending === session.token ? (
                    <Spinner className="size-4" />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} />
                  )}
                  Sign out
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
