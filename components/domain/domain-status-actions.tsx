"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setDomainActiveAction, verifyDomainAction } from "@/actions/domains";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";

/** Verify-ownership and pause/resume buttons for the domain header. */
export function DomainStatusActions({
  teamSlug,
  domainId,
  active,
  verified,
}: {
  teamSlug: string;
  domainId: string;
  active: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"verify" | "toggle" | null>(null);

  async function verify() {
    setPending("verify");
    const result = await verifyDomainAction({ teamSlug, domainId });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Verification check failed",
        description: result.error,
      });
      return;
    }

    if (result.data.verified) {
      toastManager.add({ type: "success", title: "Domain verified" });
      router.refresh();
      return;
    }

    toastManager.add({
      type: "warning",
      title: "Record not found yet",
      description:
        "DNS changes can take a few minutes to propagate — check again shortly.",
    });
  }

  async function toggle() {
    setPending("toggle");
    const result = await setDomainActiveAction({
      teamSlug,
      domainId,
      active: !active,
    });
    setPending(null);

    if (!result.ok) {
      toastManager.add({
        type: "error",
        title: "Could not update the domain",
        description: result.error,
      });
      return;
    }

    toastManager.add({
      type: "success",
      title: active ? "Domain paused" : "Domain enabled",
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {!verified ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={verify}
        >
          {pending === "verify" ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={CheckmarkBadge01Icon} />
          )}
          Verify ownership
        </Button>
      ) : null}
      <Button
        variant={active ? "outline" : "default"}
        size="sm"
        disabled={pending !== null}
        onClick={toggle}
      >
        {pending === "toggle" ? (
          <Spinner className="size-4" />
        ) : (
          <HugeiconsIcon icon={active ? PauseIcon : PlayIcon} />
        )}
        {active ? "Pause" : "Enable"}
      </Button>
    </div>
  );
}
