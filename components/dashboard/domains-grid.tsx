"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Globe02Icon,
  Link01Icon,
  MoreHorizontalIcon,
  RefreshIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteDomainAction,
  setDomainActiveAction,
  verifyDomainAction,
} from "@/actions/domains";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { toastManager } from "@/components/ui/toast";
import { formatBytes, formatCompactNumber, formatRelativeTime } from "@/lib/format";

export type DomainCardData = {
  _id: string;
  domain: string;
  target_url?: string;
  active: boolean;
  verified: boolean;
  ssl_enabled: boolean;
  subdomainCount: number;
  wafRuleCount: number;
  total_requests: number;
  total_blocked: number;
  bandwidth_used: number;
  last_request: string | null;
};

type DomainsGridProps = {
  teamSlug: string;
  domains: DomainCardData[];
};

/**
 * Domain cards with per-card actions (verify, enable/disable, delete).
 * Mutations run through server actions; the router refresh pulls fresh data.
 */
export function DomainsGrid({ teamSlug, domains }: DomainsGridProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<DomainCardData | null>(null);

  function runAction(
    domain: DomainCardData,
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toastManager.add({
          type: "error",
          title: "Action failed",
          description: result.error ?? "Please try again.",
        });
        return;
      }
      toastManager.add({ type: "success", title: successMessage });
      onDone?.();
      router.refresh();
    });
  }

  if (domains.length === 0) {
    return (
      <Empty className="border-border rounded-xl border border-dashed py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Globe02Icon} />
          </EmptyMedia>
          <EmptyTitle>No domains yet</EmptyTitle>
          <EmptyDescription>
            Add a domain, point it at your origin, and NetGoat starts routing and
            protecting the traffic.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href={`/dashboard/${teamSlug}/new`} />}>
            <HugeiconsIcon icon={Add01Icon} />
            Add your first domain
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {domains.map((domain) => (
          <div
            key={domain._id}
            className="bg-card group flex flex-col gap-3 rounded-xl border p-4 transition-colors"
            data-pending={pending || undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/dashboard/${teamSlug}/${domain.domain}`}
                  className="font-heading hover:text-primary truncate text-sm font-semibold tracking-tight"
                >
                  {domain.domain}
                </Link>
                {domain.target_url ? (
                  <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                    <HugeiconsIcon icon={Link01Icon} className="size-3" />
                    {domain.target_url}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No origin configured
                  </span>
                )}
              </div>

              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${domain.domain}`}
                    />
                  }
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} />
                </MenuTrigger>
                <MenuPopup align="end">
                  <MenuItem
                    render={
                      <Link href={`/dashboard/${teamSlug}/${domain.domain}`} />
                    }
                  >
                    Open overview
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ms-auto" />
                  </MenuItem>
                  {!domain.verified ? (
                    <MenuItem
                      onClick={() =>
                        runAction(
                          domain,
                          () =>
                            verifyDomainAction({
                              teamSlug,
                              domainId: domain._id,
                            }),
                          "Verification checked",
                        )
                      }
                    >
                      <HugeiconsIcon icon={RefreshIcon} />
                      Check verification
                    </MenuItem>
                  ) : null}
                  <MenuItem
                    onClick={() =>
                      runAction(
                        domain,
                        () =>
                          setDomainActiveAction({
                            teamSlug,
                            domainId: domain._id,
                            active: !domain.active,
                          }),
                        domain.active ? "Domain paused" : "Domain enabled",
                      )
                    }
                  >
                    <HugeiconsIcon icon={domain.active ? Cancel01Icon : Add01Icon} />
                    {domain.active ? "Pause routing" : "Enable routing"}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(domain)}
                  >
                    Delete domain
                  </MenuItem>
                </MenuPopup>
              </Menu>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {domain.verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Pending verification</Badge>
              )}
              {domain.active ? null : <Badge variant="outline">Paused</Badge>}
              {domain.ssl_enabled ? <Badge variant="info">SSL</Badge> : null}
              {domain.wafRuleCount > 0 ? (
                <Badge variant="secondary">
                  <HugeiconsIcon icon={Shield01Icon} />
                  {domain.wafRuleCount} WAF
                </Badge>
              ) : null}
            </div>

            <dl className="text-muted-foreground grid grid-cols-3 gap-2 border-t pt-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt>Requests</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatCompactNumber(domain.total_requests)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt>Blocked</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatCompactNumber(domain.total_blocked)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt>Bandwidth</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatBytes(domain.bandwidth_used)}
                </dd>
              </div>
            </dl>

            <p className="text-muted-foreground text-[11px]">
              {domain.subdomainCount} subdomain
              {domain.subdomainCount === 1 ? "" : "s"} · last request{" "}
              {formatRelativeTime(domain.last_request)}
            </p>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.domain ?? "domain"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Routing, DNS records and WAF rules for this domain stop working
              immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={() => {
                const target = deleteTarget;
                if (!target) return;
                runAction(
                  target,
                  () =>
                    deleteDomainAction({ teamSlug, domainId: target._id }),
                  "Domain deleted",
                  () => setDeleteTarget(null),
                );
              }}
            >
              Delete domain
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
