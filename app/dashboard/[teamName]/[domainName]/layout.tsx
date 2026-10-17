import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/dashboard/copy-button";
import { DomainNav } from "@/components/domain/domain-nav";
import { DomainStatusActions } from "@/components/domain/domain-status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: { default: "Domain", template: "%s | NetGoat" },
};

/** Domain-scoped layout: header with status, actions and section navigation. */
export default async function DomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);
  const teamSlug = route.context.team.slug;
  const encodedDomain = encodeURIComponent(domain.domain);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-1">
              <HugeiconsIcon
                icon={Globe02Icon}
                className="text-muted-foreground size-5"
              />
              <h1 className="font-heading truncate text-xl font-semibold tracking-tight">
                {domain.domain}
              </h1>
              <CopyButton value={domain.domain} label="domain name" />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open the domain in a new tab"
                render={
                  <a
                    href={`https://${domain.domain}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={domain.active ? "success" : "secondary"}>
                {domain.active ? "Active" : "Paused"}
              </Badge>
              <Badge variant={domain.verified ? "outline" : "warning"}>
                {domain.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="outline">
                {domain.hasManualCertificate
                  ? "Manual SSL"
                  : domain.auto_ssl
                    ? "Auto SSL"
                    : domain.ssl_enabled
                      ? "SSL"
                      : "No SSL"}
              </Badge>
              <span className="text-muted-foreground truncate text-xs">
                origin{" "}
                <span className="font-mono">
                  {domain.target_url || "not configured"}
                </span>
              </span>
            </div>
          </div>

          <DomainStatusActions
            teamSlug={teamSlug}
            domainId={domain._id}
            active={domain.active}
            verified={domain.verified}
          />
        </div>

        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b pb-px">
          <DomainNav
            teamSlug={teamSlug}
            domainName={encodedDomain}
          />
          <Link
            href={`/dashboard/${teamSlug}`}
            className="text-muted-foreground hover:text-foreground pb-2 text-xs"
          >
            All domains
          </Link>
        </div>
      </header>

      {children}
    </>
  );
}
