import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, CpuIcon, Database02Icon, ServerStack01Icon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
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
import { getDatabaseStats, getSystemSpecs } from "@/lib/data/admin";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = {
  title: "System",
};

export const dynamic = "force-dynamic";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="truncate font-mono text-sm">{value}</dd>
    </div>
  );
}

export default async function AdminSystemPage() {
  const specs = getSystemSpecs();
  const database = await getDatabaseStats();

  const usedMemory = specs.memoryTotalGb - specs.memoryFreeGb;
  const usedPercent =
    specs.memoryTotalGb > 0
      ? Math.round((usedMemory / specs.memoryTotalGb) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="System"
        description="Live host and database readings. There is no restart button here — the old console's was a no-op; deployments restart through the process supervisor."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={ServerStack01Icon} className="size-4" />
              Runtime
            </CardTitle>
            <CardDescription>The Node process serving this console.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-border flex flex-col divide-y">
              <SpecRow label="Node.js" value={specs.nodeVersion} />
              <SpecRow label="PID" value={String(specs.pid)} />
              <SpecRow
                label="Load average (1/5/15m)"
                value={specs.loadAverage.map((value) => value.toFixed(2)).join(" / ")}
              />
              <SpecRow label="Host uptime" value={`${specs.uptimeHours} hours`} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={CpuIcon} className="size-4" />
              Hardware
            </CardTitle>
            <CardDescription>CPU and operating system.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-border flex flex-col divide-y">
              <SpecRow label="OS" value={`${specs.os} (${specs.arch})`} />
              <SpecRow label="Platform" value={specs.platform} />
              <SpecRow label="CPU" value={specs.cpuModel} />
              <SpecRow label="Cores" value={String(specs.cpuCount)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
              Memory
            </CardTitle>
            <CardDescription>Host memory, sampled on request.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{usedPercent}% used</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {usedMemory.toFixed(2)} / {specs.memoryTotalGb.toFixed(2)} GB
                </span>
              </div>
              <div
                role="meter"
                aria-valuenow={usedPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Memory used"
                className="bg-muted h-2 w-full overflow-hidden rounded-full"
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
            <dl className="divide-border flex flex-col divide-y">
              <SpecRow label="Total" value={`${specs.memoryTotalGb} GB`} />
              <SpecRow label="Free" value={`${specs.memoryFreeGb} GB`} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Database02Icon} className="size-4" />
            Database
          </CardTitle>
          <CardDescription>
            {database.databaseName}
            {database.sizeOnDiskMb !== null
              ? ` · ${formatBytes(database.sizeOnDiskMb * 1024 * 1024)} of data`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {database.collections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Collection statistics are unavailable right now.
            </p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection</TableHead>
                    <TableHead className="w-[140px] text-end">
                      Documents
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {database.collections.map((collection) => (
                    <TableRow key={collection.name}>
                      <TableCell className="font-mono text-sm">
                        {collection.name}
                      </TableCell>
                      <TableCell className="text-end">
                        <Badge variant="outline">
                          {collection.documents.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
