import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  AnalyticsUpIcon,
  Globe02Icon,
  InternetIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DomainsGrid } from "@/components/dashboard/domains-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getActiveAlerts } from "@/lib/data/alerts";
import { getTeamOverview, listTeamDomainSummaries } from "@/lib/data/domains";
import { getTeamContext } from "@/lib/auth-guards";
import { formatBytes, formatCompactNumber, usagePercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
};

const ALERT_VARIANTS = {
  red: "error",
  yellow: "warning",
  blue: "info",
} as const;

export default async function TeamOverviewPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { team } = await getTeamContext(teamName);
  if (!team) notFound();

  const teamObjectId = String(team._id);

  const [overview, domains, alerts] = await Promise.all([
    getTeamOverview(teamObjectId),
    listTeamDomainSummaries(teamObjectId),
    getActiveAlerts(),
  ]);

  const blockedRatio =
    overview.totalRequests > 0
      ? Math.round((overview.totalBlocked / overview.totalRequests) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Traffic, health and domains for ${team.name}.`}
      >
        <Button render={<Link href={`/dashboard/${team.slug}/new`} />}>
          <HugeiconsIcon icon={Add01Icon} />
          Add domain
        </Button>
      </PageHeader>

      {alerts.length > 0 ? (
        <div className="mb-6 flex flex-col gap-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={ALERT_VARIANTS[alert.variant]}>
              <HugeiconsIcon icon={Alert02Icon} />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.body}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Domains"
          value={`${overview.activeDomains}/${overview.domainCount}`}
          hint={`${overview.domainCount} of ${team.max_domains} used on the ${team.plan} plan`}
          icon={Globe02Icon}
        />
        <StatCard
          label="Requests"
          value={formatCompactNumber(overview.totalRequests)}
          hint="Since the domains were connected"
          icon={AnalyticsUpIcon}
        />
        <StatCard
          label="Blocked"
          value={formatCompactNumber(overview.totalBlocked)}
          hint={`${blockedRatio}% of all requests`}
          icon={Shield01Icon}
        />
        <StatCard
          label="Bandwidth"
          value={formatBytes(overview.bandwidthUsed)}
          hint="Total egress through the edge"
          icon={InternetIcon}
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Domains
          </h2>
          {overview.domainCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={`/dashboard/${team.slug}/domains`} />}
            >
              View all
            </Button>
          ) : null}
        </div>

        <DomainsGrid teamSlug={team.slug} domains={domains} />
      </div>

      {overview.unverifiedDomains > 0 ? (
        <p className="text-muted-foreground mt-6 text-xs">
          {overview.unverifiedDomains} domain
          {overview.unverifiedDomains === 1 ? " is" : "s are"} still waiting for
          ownership verification — publish the TXT record shown on each domain
          page.
        </p>
      ) : null}

      <span className="sr-only">
        {usagePercent(overview.domainCount, team.max_domains)}% of domain quota
        used
      </span>
    </>
  );
}
