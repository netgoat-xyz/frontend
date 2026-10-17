import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  File01Icon,
  Globe02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { TeamAvatar } from "@/components/dashboard/team-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listUserTeams, requireUser } from "@/lib/auth-guards";
import { usagePercent } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function AccountBillingPage() {
  const user = await requireUser();
  const teams = await listUserTeams(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Billing
        </h1>
        <p className="text-muted-foreground text-sm">
          Plans and limits are managed per team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={CreditCardIcon} className="size-4" />
            Teams
          </CardTitle>
          <CardDescription>
            Each team has its own plan, quota and payment method.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {teams.map((team) => (
            <div
              key={String(team._id)}
              className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <TeamAvatar
                  team={{ slug: team.slug, name: team.name }}
                  className="size-8 rounded-lg text-sm"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">
                    {team.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {team.plan}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <HugeiconsIcon icon={Globe02Icon} className="size-3" />
                      {team.domain_count}/{team.max_domains} domains
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress
                  value={usagePercent(team.domain_count, team.max_domains)}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/dashboard/${team.slug}/settings`} />}
                >
                  <HugeiconsIcon icon={Settings01Icon} />
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} className="size-4" />
            Invoices
          </CardTitle>
          <CardDescription>
            Receipts appear here once a paid plan is active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No invoices yet — every team is on the free plan. Upgrades arrive
            with the next billing release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
