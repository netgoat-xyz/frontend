import { HugeiconsIcon } from "@hugeicons/react";
import { HierarchyIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/dashboard/copy-button";
import { DomainNav } from "@/components/domain/domain-nav";
import { Badge } from "@/components/ui/badge";
import { getSubdomainRoute } from "@/lib/data/domain-detail";

/** Subdomain-scoped layout: header, status and compact section navigation. */
export default async function SubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    teamName: string;
    domainName: string;
    subdomain: string;
  }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const { domain, subdomain } = route;
  const teamSlug = route.context.team.slug;
  const basePath = `/dashboard/${teamSlug}/${encodeURIComponent(domain.domain)}/subdomains/${subdomain.subdomain}`;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon
              icon={HierarchyIcon}
              className="text-muted-foreground size-4"
            />
            <span className="font-heading truncate text-lg font-semibold tracking-tight">
              {subdomain.full_domain}
            </span>
            <CopyButton
              value={subdomain.full_domain}
              label="subdomain name"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={subdomain.active ? "success" : "secondary"}>
              {subdomain.active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {subdomain.certificate_pem ? "Manual SSL" : "Inherits domain SSL"}
            </Badge>
            <Badge variant="outline">
              {subdomain.access_control?.mode === "inherit" ||
              !subdomain.access_control
                ? "Inherits domain access"
                : subdomain.access_control.mode === "off"
                  ? "Access off"
                  : subdomain.access_control.mode === "allowlist"
                    ? "Allowlist"
                    : "Blocklist"}
            </Badge>
          </div>

          <Link
            href={`/dashboard/${teamSlug}/${encodeURIComponent(domain.domain)}/subdomains`}
            className="text-muted-foreground hover:text-foreground ms-auto text-xs"
          >
            All subdomains
          </Link>
        </div>

        <div className="border-border border-b pb-px">
          <DomainNav
            teamSlug={teamSlug}
            domainName={encodeURIComponent(domain.domain)}
            basePath={basePath}
            compact
            sections={["Overview", "Routes", "SSL", "WAF", "Access"]}
          />
        </div>
      </div>

      {children}
    </>
  );
}
