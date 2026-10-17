import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  InternetIcon,
  ScrollIcon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { LogLevelForm } from "@/components/domain/settings-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";
import { formatBytes, formatCompactNumber, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Logs",
};

export default async function DomainLogsPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);

  return (
    <>
      <PageHeader
        title="Logs"
        description="Log level and lifetime counters for this domain."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          value={formatCompactNumber(domain.stats.total_requests)}
          hint="Lifetime total"
          icon={AnalyticsUpIcon}
        />
        <StatCard
          label="Blocked"
          value={formatCompactNumber(domain.stats.total_blocked)}
          hint="Rejected by WAF or access rules"
          icon={Shield02Icon}
        />
        <StatCard
          label="Bandwidth"
          value={formatBytes(domain.stats.bandwidth_used)}
          hint="Lifetime egress"
          icon={InternetIcon}
        />
        <StatCard
          label="Last request"
          value={
            domain.stats.last_request
              ? formatDateTime(domain.stats.last_request)
              : "—"
          }
          hint="Most recent traffic seen by the edge"
          icon={ScrollIcon}
        />
      </div>

      <div className="mt-8 grid max-w-3xl gap-6">
        <LogLevelForm
          teamSlug={route.context.team.slug}
          domainId={domain._id}
          initial={domain.settings.log_level}
        />

        <Card>
          <CardHeader>
            <CardTitle>Request-level logs</CardTitle>
            <CardDescription>
              Agents ship per-request logs over the streaming channel; they are
              not stored on the control plane yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Set the log level above to control what the edge records. Live
              tailing arrives with the next agent protocol revision.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
