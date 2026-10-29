import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { TeamAvatar } from "@/components/dashboard/team-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listUserTeams, requireUser } from "@/lib/auth-guards";
import { personalTeamSlug } from "@/lib/teams";
import { resolveTeamRole, type TeamDocument } from "@/models/Team";

export const metadata: Metadata = {
  title: "Teams",
};

function isPersonal(userId: string, team: TeamDocument): boolean {
  return team.slug === personalTeamSlug(userId);
}

export default async function TeamsPage() {
  const user = await requireUser();
  const teams = await listUserTeams(user.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Teams"
        description={`Workspaces you can open with ${user.email}. Domains, members and billing stay separate per team.`}
      >
        <Button render={<Link href="/dashboard/teams/new" />}>
          <HugeiconsIcon icon={Add01Icon} />
          New team
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team) => {
          const membership = team.members.find(
            (member) => String(member.user_id) === user.id,
          );
          const role = membership
            ? resolveTeamRole(team, membership.role)
            : null;

          return (
            <Link
              key={String(team._id)}
              href={`/dashboard/${team.slug}`}
              className="bg-card hover:border-foreground/20 group flex flex-col gap-4 rounded-xl border p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <TeamAvatar
                    team={{ slug: team.slug, name: team.name }}
                    className="size-9 rounded-lg text-sm"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="font-heading truncate text-sm font-semibold tracking-tight">
                      {team.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      /{team.slug}
                    </span>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="text-muted-foreground group-hover:text-foreground mt-1 size-4 transition-transform group-hover:translate-x-0.5"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {isPersonal(user.id, team) ? (
                  <Badge variant="info">Personal</Badge>
                ) : null}
                <Badge variant="secondary">{role?.name ?? "Member"}</Badge>
                <Badge variant="outline" className="capitalize">
                  {team.plan}
                </Badge>
                <Badge variant="outline">
                  <HugeiconsIcon icon={Globe02Icon} />
                  {team.domain_count}/{team.max_domains} domains
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
