import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  Globe02Icon,
  Shield01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getTeamContext } from "@/lib/auth-guards";
import { listTeamDomains } from "@/lib/data/domains";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Activity",
};

type ActivityEntry = {
  id: string;
  kind: "traffic" | "domain" | "waf";
  title: string;
  description?: string;
  at: Date;
};

const KIND_ICONS = {
  traffic: AnalyticsUpIcon,
  domain: Globe02Icon,
  waf: Shield01Icon,
} as const;

export default async function TeamActivityPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { team } = await getTeamContext(teamName);
  if (!team) notFound();

  const domains = await listTeamDomains(String(team._id));

  const entries: ActivityEntry[] = [];
  for (const domain of domains) {
    if (domain.stats?.last_request) {
      entries.push({
        id: `traffic-${String(domain._id)}`,
        kind: "traffic",
        title: `Traffic served for ${domain.domain}`,
        description: `${formatNumber(domain.stats.total_requests)} requests in total · ${formatNumber(domain.stats.total_blocked)} blocked`,
        at: new Date(domain.stats.last_request),
      });
    }

    entries.push({
      id: `domain-${String(domain._id)}`,
      kind: "domain",
      title: `${domain.domain} connected`,
      description: domain.target_url ? `Origin ${domain.target_url}` : undefined,
      at: new Date(domain.created_at),
    });

    for (const rule of domain.waf_rules ?? []) {
      entries.push({
        id: `waf-${String(domain._id)}-${rule.name}`,
        kind: "waf",
        title: `WAF rule “${rule.name}” on ${domain.domain}`,
        description: `${rule.action} when ${rule.expression}`,
        at: new Date(rule.created_at),
      });
    }
  }

  entries.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = entries.slice(0, 60);

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent changes and traffic events across the workspace."
      />

      {recent.length === 0 ? (
        <Empty className="border-border rounded-xl border border-dashed py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>
              Connect a domain and activity will start appearing as soon as
              traffic flows.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="divide-border divide-y rounded-xl border">
          {recent.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-4 px-4 py-3.5"
            >
              <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                <HugeiconsIcon
                  icon={KIND_ICONS[entry.kind]}
                  className="size-3.5"
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {entry.title}
                </span>
                {entry.description ? (
                  <span className="text-muted-foreground truncate text-xs">
                    {entry.description}
                  </span>
                ) : null}
              </div>
              <span
                className="text-muted-foreground shrink-0 text-xs tabular-nums"
                title={formatDateTime(entry.at)}
              >
                {formatRelativeTime(entry.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
