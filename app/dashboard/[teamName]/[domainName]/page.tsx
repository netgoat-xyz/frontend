import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  HierarchyIcon,
  InternetIcon,
  Key01Icon,
  LockPasswordIcon,
  Route01Icon,
  ServerStack01Icon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/dashboard/copy-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listDomainDNSRecords } from "@/lib/data/dns";
import { getDomainRoute, listDomainProxyConfigs } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";
import {
  formatBytes,
  formatCompactNumber,
  formatDateTime,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DomainOverviewPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);
  const teamId = String(route.context.team._id);
  const teamSlug = route.context.team.slug;
  const base = `/dashboard/${teamSlug}/${encodeURIComponent(domain.domain)}`;

  const [dnsRecords, proxyConfigs] = await Promise.all([
    listDomainDNSRecords(teamId, domain._id),
    listDomainProxyConfigs(teamId, domain._id),
  ]);

  const blockedRatio =
    domain.stats.total_requests > 0
      ? Math.round(
          (domain.stats.total_blocked / domain.stats.total_requests) * 100,
        )
      : 0;

  const accessLabel =
    domain.access_control.mode === "off"
      ? "Open to everyone"
      : domain.access_control.mode === "allowlist"
        ? `Allowlist · ${domain.access_control.cidrs.length} ranges`
        : `Blocklist · ${domain.access_control.cidrs.length} ranges`;

  const security = [
    {
      label: "WAF",
      value:
        domain.wafRules.length > 0
          ? `${domain.wafRules.length} rule${domain.wafRules.length === 1 ? "" : "s"}`
          : "No rules",
      hint:
        domain.wafRules.length > 0
          ? "Rules stream to the edge on the next snapshot."
          : "Add rules to block or challenge requests.",
      icon: Shield02Icon,
      href: `${base}/waf`,
    },
    {
      label: "SSL/TLS",
      value: domain.hasManualCertificate
        ? "Manual certificate"
        : domain.auto_ssl
          ? "Automatic"
          : domain.ssl_enabled
            ? "Configured"
            : "Not configured",
      hint:
        domain.hasManualCertificate || domain.auto_ssl
          ? "Certificates are served from the edge."
          : "Upload a certificate or enable automatic SSL.",
      icon: LockPasswordIcon,
      href: `${base}/ssl`,
    },
    {
      label: "Access",
      value:
        domain.access_control.mode === "off"
          ? "Open"
          : domain.access_control.mode === "allowlist"
            ? "Allowlist"
            : "Blocklist",
      hint: accessLabel,
      icon: Key01Icon,
      href: `${base}/access`,
    },
    {
      label: "Routing",
      value:
        proxyConfigs.length > 0
          ? `${proxyConfigs.length} pool${proxyConfigs.length === 1 ? "" : "s"}`
          : "Single origin",
      hint: domain.target_url
        ? `Falls back to ${domain.target_url}`
        : "Set an origin to forward traffic.",
      icon: Route01Icon,
      href: `${base}/reverse-proxies`,
    },
  ] as const;

  return (
    <>
      {domain.verification ? (
        <Alert variant="warning" className="mb-6">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} />
          <AlertTitle>Verify ownership of {domain.domain}</AlertTitle>
          <AlertDescription>
            <span className="flex flex-wrap items-center gap-2">
              Publish a TXT record
              <span className="font-mono">
                {domain.verification.recordName}
              </span>
              with value
              <span className="max-w-[42ch] truncate font-mono">
                {domain.verification.recordValue}
              </span>
              <CopyButton
                value={domain.verification.recordValue}
                label="verification token"
              />
              then use “Verify ownership”. Checks also run automatically.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          value={formatCompactNumber(domain.stats.total_requests)}
          hint={
            domain.stats.last_request
              ? `Last seen ${formatDateTime(domain.stats.last_request)}`
              : "No traffic recorded yet"
          }
          icon={AnalyticsUpIcon}
        />
        <StatCard
          label="Blocked"
          value={formatCompactNumber(domain.stats.total_blocked)}
          hint={`${blockedRatio}% of all requests`}
          icon={Shield02Icon}
        />
        <StatCard
          label="Bandwidth"
          value={formatBytes(domain.stats.bandwidth_used)}
          hint="Total egress through the edge"
          icon={InternetIcon}
        />
        <StatCard
          label="Subdomains"
          value={String(domain.subdomains.length)}
          hint={`${dnsRecords.length} DNS record${dnsRecords.length === 1 ? "" : "s"}`}
          icon={HierarchyIcon}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {security.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={item.icon}
                  className="text-muted-foreground size-4"
                />
                {item.label}
                <Badge variant="outline" className="ms-auto">
                  {item.value}
                </Badge>
              </CardTitle>
              <CardDescription>{item.hint}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                size="sm"
                className="-ms-2"
                render={<Link href={item.href} />}
              >
                Configure
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <HugeiconsIcon icon={ServerStack01Icon} className="size-4" />
            Recent DNS records
          </CardTitle>
          <CardDescription>
            Records managed from the dashboard for this domain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dnsRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No records yet.{" "}
              <Link
                href={`${base}/dns`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Add the first record
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {dnsRecords.slice(0, 5).map((record) => (
                <li
                  key={String(record._id)}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <Badge variant="outline" className="font-mono">
                    {record.type}
                  </Badge>
                  <span className="truncate font-mono text-xs">
                    {record.name === "@" ? domain.domain : record.name}
                  </span>
                  <span className="text-muted-foreground ms-auto truncate font-mono text-xs">
                    {record.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
