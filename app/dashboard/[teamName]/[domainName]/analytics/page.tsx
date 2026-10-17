import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  InternetIcon,
  Shield02Icon,
  TimeHalfPassIcon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";
import {
  formatBytes,
  formatCompactNumber,
  formatDateTime,
  usagePercent,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function DomainAnalyticsPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);

  const blockedRatio =
    domain.stats.total_requests > 0
      ? Math.round(
          (domain.stats.total_blocked / domain.stats.total_requests) * 100,
        )
      : 0;

  const perHost = [
    {
      host: domain.domain,
      requests: Math.max(
        domain.stats.total_requests -
          domain.subdomains.reduce((sum, entry) => sum + entry.request_count, 0),
        0,
      ),
      blocked: Math.max(
        domain.stats.total_blocked -
          domain.subdomains.reduce((sum, entry) => sum + entry.blocked_count, 0),
        0,
      ),
    },
    ...domain.subdomains.map((entry) => ({
      host: entry.full_domain,
      requests: entry.request_count,
      blocked: entry.blocked_count,
    })),
  ].sort((a, b) => b.requests - a.requests);

  const maxRequests = Math.max(...perHost.map((entry) => entry.requests), 1);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Traffic totals reported by the edge agents for this domain."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          value={formatCompactNumber(domain.stats.total_requests)}
          hint={
            domain.stats.last_request
              ? `Last request ${formatDateTime(domain.stats.last_request)}`
              : "No traffic recorded yet"
          }
          icon={AnalyticsUpIcon}
        />
        <StatCard
          label="Blocked"
          value={formatCompactNumber(domain.stats.total_blocked)}
          hint={`${blockedRatio}% of requests`}
          icon={Shield02Icon}
        />
        <StatCard
          label="Bandwidth"
          value={formatBytes(domain.stats.bandwidth_used)}
          hint="Total egress through the edge"
          icon={InternetIcon}
        />
        <StatCard
          label="Active since"
          value={new Date(domain.created_at).toLocaleDateString()}
          hint="When the domain was connected"
          icon={TimeHalfPassIcon}
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Traffic by hostname</CardTitle>
          <CardDescription>
            Where requests land across the domain and its subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead className="w-[45%]">Share</TableHead>
                <TableHead className="text-end">Requests</TableHead>
                <TableHead className="text-end">Blocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perHost.map((entry) => (
                <TableRow key={entry.host}>
                  <TableCell className="font-mono text-xs">
                    {entry.host}
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted block h-1.5 w-full overflow-hidden rounded-full">
                      <span
                        className="bg-foreground block h-full rounded-full"
                        style={{
                          width: `${usagePercent(entry.requests, maxRequests)}%`,
                        }}
                      />
                    </span>
                  </TableCell>
                  <TableCell className="text-end text-xs tabular-nums">
                    {formatCompactNumber(entry.requests)}
                  </TableCell>
                  <TableCell className="text-end text-xs tabular-nums">
                    {formatCompactNumber(entry.blocked)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-xs">
        Geographic and per-path breakdowns arrive with request-level log
        streaming — totals above are the lifetime counters the agents report.
      </p>
    </>
  );
}
