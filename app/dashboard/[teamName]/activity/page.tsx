import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  Clock01Icon,
  Globe02Icon,
  Shield01Icon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Activity",
};

type ActivityKind = "traffic" | "domain" | "waf";

type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  at: Date;
};

const KIND_STYLES: Record<
  ActivityKind,
  { icon: IconSvgElement; tile: string }
> = {
  traffic: {
    icon: AnalyticsUpIcon,
    tile: "border-sky-500/30 text-sky-600 dark:text-sky-400",
  },
  domain: {
    icon: Globe02Icon,
    tile: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
  waf: {
    icon: Shield01Icon,
    tile: "border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
};

/** "Today" / "Yesterday" / "Mon, Oct 12" for the timeline group headers. */
function dayLabel(date: Date): string {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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

  // Day groups keep long lists scannable instead of a flat wall of rows.
  const groups: Array<{ key: string; label: string; entries: ActivityEntry[] }> =
    [];
  for (const entry of recent) {
    const key = entry.at.toDateString();
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.entries.push(entry);
    } else {
      groups.push({ key, label: dayLabel(entry.at), entries: [entry] });
    }
  }

  const totalRequests = domains.reduce(
    (sum, domain) => sum + (domain.stats?.total_requests ?? 0),
    0,
  );
  const totalBlocked = domains.reduce(
    (sum, domain) => sum + (domain.stats?.total_blocked ?? 0),
    0,
  );
  const ruleCount = domains.reduce(
    (sum, domain) => sum + (domain.waf_rules?.length ?? 0),
    0,
  );
  const blockRate =
    totalRequests > 0 ? Math.round((totalBlocked / totalRequests) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent changes and traffic events across the workspace."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          icon={AnalyticsUpIcon}
          value={formatNumber(totalRequests)}
          hint={`Across ${domains.length} domain${domains.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Blocked"
          icon={Shield01Icon}
          value={formatNumber(totalBlocked)}
          hint={`${blockRate}% of all traffic`}
        />
        <StatCard
          label="WAF rules"
          icon={Shield02Icon}
          value={formatNumber(ruleCount)}
          hint="Attached to domains"
        />
        <StatCard
          label="Domains"
          icon={Globe02Icon}
          value={formatNumber(domains.length)}
          hint="In this workspace"
        />
      </div>

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
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {group.label}
                </h2>
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs">
                  {group.entries.length} event
                  {group.entries.length === 1 ? "" : "s"}
                </span>
              </div>

              <ol className="border-border ms-3 flex flex-col border-s">
                {group.entries.map((entry) => {
                  const style = KIND_STYLES[entry.kind];
                  return (
                    <li key={entry.id} className="relative pb-5 ps-7 last:pb-0">
                      <span
                        className={cn(
                          "bg-background absolute -start-[13px] top-0 flex size-[26px] items-center justify-center rounded-full border",
                          style.tile,
                        )}
                      >
                        <HugeiconsIcon icon={style.icon} className="size-3.5" />
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
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
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
