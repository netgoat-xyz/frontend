import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  type AdminAnalytics,
  type AnalyticsRange,
} from "@/lib/data/admin-analytics";

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function BarList({
  rows,
}: {
  rows: Array<{ label: string; value: number; hint?: string }>;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-mono text-xs">{row.label}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {row.hint ?? `${row.value.toLocaleString()} views`}
            </span>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Area chart drawn with plain SVG — no charting dependency needed. */
function ViewsChart({ data }: { data: Array<{ label: string; views: number }> }) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No page views in this window yet.
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = 12;
  const max = Math.max(1, ...data.map((point) => point.views));

  const coordinates = data.map((point, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.views / max) * (height - padding * 2);
    return { x, y };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const baseline = height - padding;
  const area =
    first && last
      ? `${line} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`
      : "";

  const labelIndexes = new Set<number>([
    0,
    Math.floor((data.length - 1) / 2),
    data.length - 1,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Page views over the selected range, peaking at ${max}`}
        className="text-primary h-44 w-full"
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={padding}
            x2={width - padding}
            y1={padding + fraction * (height - padding * 2)}
            y2={padding + fraction * (height - padding * 2)}
            className="stroke-border"
            strokeDasharray="4 6"
          />
        ))}
        <path d={area} fill="currentColor" opacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="text-muted-foreground flex justify-between font-mono text-[11px]">
        {data.map((point, index) =>
          labelIndexes.has(index) ? <span key={point.label}>{point.label}</span> : null,
        )}
      </div>
    </div>
  );
}

/** Analytics overview. Rendered on the server; ranges are plain links. */
export function AnalyticsDashboard({ stats }: { stats: AdminAnalytics }) {
  const deviceTotal = stats.deviceStats.reduce((sum, row) => sum + row.count, 0);
  const peak = Math.max(0, ...stats.chartData.map((point) => point.views));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={range === stats.range ? "secondary" : "ghost"}
              className="h-7"
              render={
                <Link
                  href={
                    range === "24h"
                      ? "/admin/analytics"
                      : `/admin/analytics?range=${range}`
                  }
                />
              }
            >
              {range}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">{RANGE_LABELS[stats.range]}</p>
        <p className="text-muted-foreground ms-auto text-xs">
          Source: first-party pageview collection
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Unique visitors"
          value={stats.visitors.toLocaleString()}
          hint="Distinct visitor ids with at least one pageview"
        />
        <Stat
          label="Page views"
          value={stats.pageViews.toLocaleString()}
          hint={peak > 0 ? `Peak bucket: ${peak.toLocaleString()} views` : undefined}
        />
        <Stat
          label="Bounce rate"
          value={`${stats.bounceRate}%`}
          hint="Visitors who viewed a single page"
        />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Web vitals (average)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">LCP</span>
              <span className="font-mono text-sm tabular-nums">
                {stats.webVitals.lcp > 0 ? `${stats.webVitals.lcp} ms` : "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">INP</span>
              <span className="font-mono text-sm tabular-nums">
                {stats.webVitals.inp > 0 ? `${stats.webVitals.inp} ms` : "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">CLS</span>
              <span className="font-mono text-sm tabular-nums">
                {stats.webVitals.cls > 0 ? stats.webVitals.cls : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic</CardTitle>
          <CardDescription>
            Page views per {stats.range === "24h" ? "hour" : "day"} across the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ViewsChart data={stats.chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top pages</CardTitle>
            <CardDescription>Most viewed paths in this window.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pageviews recorded yet.</p>
            ) : (
              <BarList
                rows={stats.topPages.map((row) => ({
                  label: row.path,
                  value: row.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
            <CardDescription>Where visitors came from.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topReferrers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No external referrers recorded yet.
              </p>
            ) : (
              <BarList
                rows={stats.topReferrers.map((row) => ({
                  label: row.url,
                  value: row.count,
                  hint: `${row.count.toLocaleString()} visits`,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Detection from the request user agent.</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceTotal === 0 ? (
              <p className="text-muted-foreground text-sm">No device data yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.deviceStats.map((row) => (
                  <div key={row.device} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium capitalize">
                        {row.device}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {row.count.toLocaleString()} ·{" "}
                        {Math.round((row.count / deviceTotal) * 100)}%
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (row.count / deviceTotal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-page vitals</CardTitle>
            <CardDescription>
              Averaged LCP / INP / CLS by path, most sampled first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pagesPerformance.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No web vitals reported yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-end">LCP</TableHead>
                      <TableHead className="text-end">INP</TableHead>
                      <TableHead className="text-end">CLS</TableHead>
                      <TableHead className="text-end">Samples</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.pagesPerformance.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell className="max-w-[220px] truncate font-mono text-xs">
                          {row.path}
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs">
                          {row.lcp > 0 ? `${row.lcp} ms` : "—"}
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs">
                          {row.inp > 0 ? `${row.inp} ms` : "—"}
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs">
                          {row.cls > 0 ? row.cls : "—"}
                        </TableCell>
                        <TableCell className="text-end">
                          <Badge variant="outline">{row.samples}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
