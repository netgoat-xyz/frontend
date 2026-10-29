import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  ArrowRight01Icon,
  Key01Icon,
  LockPasswordIcon,
  Route01Icon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OriginForm } from "@/components/domain/settings-forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubdomainRoute } from "@/lib/data/domain-detail";
import { formatCompactNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Subdomain overview",
};

export default async function SubdomainOverviewPage({
  params,
}: {
  params: Promise<{
    teamName: string;
    domainName: string;
    subdomain: string;
  }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const { context, domain, subdomain } = route;
  const teamSlug = context.team.slug;
  const base = `/dashboard/${teamSlug}/${encodeURIComponent(domain.domain)}/subdomains/${subdomain.subdomain}`;

  const sections = [
    {
      label: "Routes",
      description:
        subdomain.target_url
          ? `Currently forwarding to ${subdomain.target_url}.`
          : "No origin configured yet.",
      href: `${base}/reverse-proxies`,
      icon: Route01Icon,
    },
    {
      label: "SSL",
      description: subdomain.certificate_pem
        ? "A manual certificate is stored for this hostname."
        : "Inherits the domain certificate or automatic SSL.",
      href: `${base}/ssl`,
      icon: LockPasswordIcon,
    },
    {
      label: "WAF",
      description:
        subdomain.waf_rules.length > 0
          ? `${subdomain.waf_rules.length} rule${subdomain.waf_rules.length === 1 ? "" : "s"} applied.`
          : "No rules yet — traffic passes unfiltered.",
      href: `${base}/waf`,
      icon: Shield02Icon,
    },
    {
      label: "Access",
      description:
        subdomain.access_control?.mode === "inherit" ||
        !subdomain.access_control
          ? "Inherits the domain access policy."
          : subdomain.access_control.mode === "off"
            ? "Open to everyone."
            : `${subdomain.access_control.mode === "allowlist" ? "Allowlist" : "Blocklist"} with ${subdomain.access_control.cidrs.length} ranges.`,
      href: `${base}/access`,
      icon: Key01Icon,
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Configuration and traffic for ${subdomain.full_domain}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          value={formatCompactNumber(subdomain.request_count)}
          hint="Since the subdomain was added"
          icon={AnalyticsUpIcon}
        />
        <StatCard
          label="Blocked"
          value={formatCompactNumber(subdomain.blocked_count)}
          hint={
            subdomain.request_count > 0
              ? `${Math.round((subdomain.blocked_count / subdomain.request_count) * 100)}% of requests`
              : "No traffic yet"
          }
          icon={Shield02Icon}
        />
        <StatCard
          label="WAF rules"
          value={String(subdomain.waf_rules.length)}
          hint="Scoped to this subdomain"
          icon={Shield02Icon}
        />
        <StatCard
          label="Created"
          value={new Date(subdomain.created_at).toLocaleDateString()}
          hint="When the subdomain was added"
          icon={Route01Icon}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={section.icon}
                  className="text-muted-foreground size-4"
                />
                {section.label}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                size="sm"
                className="-ms-2"
                render={<Link href={section.href} />}
              >
                Configure
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 max-w-3xl">
        <OriginForm
          teamSlug={teamSlug}
          domainId={String(domain._id)}
          subdomain={subdomain.subdomain}
          hostname={subdomain.full_domain}
          initialOrigin={subdomain.target_url ?? ""}
        />
      </div>
    </>
  );
}
