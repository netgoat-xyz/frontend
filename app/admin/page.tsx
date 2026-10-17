import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AlertDiamondIcon,
  AnalyticsUpIcon,
  ArrowRight01Icon,
  CpuIcon,
  File02Icon,
  Globe02Icon,
  Settings01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminOverview, getSystemSpecs } from "@/lib/data/admin";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
};

const QUICK_LINKS = [
  { href: "/admin/users", label: "Manage users", icon: UserGroupIcon },
  { href: "/admin/content", label: "Publish content", icon: File02Icon },
  { href: "/admin/settings", label: "Platform settings", icon: Settings01Icon },
  { href: "/admin/system", label: "System details", icon: CpuIcon },
] as const;

export default async function AdminOverviewPage() {
  const [overview, specs] = await Promise.all([
    getAdminOverview(),
    Promise.resolve(getSystemSpecs()),
  ]);

  return (
    <>
      <PageHeader
        title="Admin overview"
        description="Platform-wide counts and the newest accounts, straight from the database."
      >
        <Button size="sm" render={<Link href="/admin/analytics" />}>
          <HugeiconsIcon icon={AnalyticsUpIcon} />
          Open analytics
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Users"
          value={overview.users.toLocaleString()}
          hint={`${overview.activeSessions.toLocaleString()} active session${overview.activeSessions === 1 ? "" : "s"}`}
          icon={UserGroupIcon}
        />
        <StatCard
          label="Teams"
          value={overview.teams.toLocaleString()}
          hint="Personal and organization workspaces"
          icon={UserMultiple02Icon}
        />
        <StatCard
          label="Active domains"
          value={overview.activeDomains.toLocaleString()}
          hint="Streaming to edge agents"
          icon={Globe02Icon}
        />
        <StatCard
          label="Active alerts"
          value={overview.activeAlerts.toLocaleString()}
          hint="Shown in the global banner feed"
          icon={Alert02Icon}
        />
        <StatCard
          label="Open incidents"
          value={overview.openIncidents.toLocaleString()}
          hint="Visible on the public status page"
          icon={AlertDiamondIcon}
        />
        <StatCard
          label="Node.js"
          value={specs.nodeVersion}
          hint={`${specs.cpuCount} CPU core${specs.cpuCount === 1 ? "" : "s"} · load ${specs.loadAverage[0].toFixed(2)}`}
          icon={CpuIcon}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Newest accounts</CardTitle>
            <CardDescription>
              The last five registrations across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {overview.recentUsers.length === 0 ? (
              <p className="text-muted-foreground py-2 text-sm">
                No accounts yet.
              </p>
            ) : (
              overview.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                  <Badge
                    variant={user.role === "admin" ? "info" : "outline"}
                    className="ms-auto"
                  >
                    {user.role}
                  </Badge>
                  {user.banned ? <Badge variant="error">Banned</Badge> : null}
                  <span
                    className="text-muted-foreground text-xs"
                    title={formatDateTime(user.createdAt)}
                  >
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump straight into the console.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {QUICK_LINKS.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="justify-start"
                render={<Link href={link.href} />}
              >
                <HugeiconsIcon icon={link.icon} />
                {link.label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="ms-auto" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
