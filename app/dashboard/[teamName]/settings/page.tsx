import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { TeamSettingsForm } from "@/components/dashboard/team-settings-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTeamContext } from "@/lib/auth-guards";
import { usagePercent } from "@/lib/format";
import { User } from "@/models/User";
import {
  resolveTeamRole,
  roleHasCapability,
} from "@/models/Team";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { user, team } = await getTeamContext(teamName);
  if (!team) notFound();

  const membership = team.members.find(
    (member) => String(member.user_id) === user.id,
  );
  const role = membership ? resolveTeamRole(team, membership.role) : null;
  const canEdit = role ? roleHasCapability(role, "team.settings.update") : false;
  const canViewMembers = role
    ? roleHasCapability(role, "members.view")
    : false;

  const memberIds = team.members.map((member) => member.user_id);
  const memberUsers = canViewMembers
    ? await User.find({ _id: { $in: memberIds } })
        .select("name email image")
        .lean<Array<{ _id: unknown; name?: string; email: string; image?: string }>>()
    : [];

  const userById = new Map(memberUsers.map((entry) => [String(entry._id), entry]));

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace identity, members and plan limits."
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <TeamSettingsForm
          teamSlug={team.slug}
          initialName={team.name}
          canEdit={canEdit}
        />

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              Currently on the <span className="capitalize">{team.plan}</span>{" "}
              plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Domain usage</span>
              <span className="tabular-nums">
                {team.domain_count} / {team.max_domains}
              </span>
            </div>
            <Progress value={usagePercent(team.domain_count, team.max_domains)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
              Members
            </CardTitle>
            <CardDescription>
              {team.members.length}{" "}
              {team.members.length === 1 ? "member" : "members"} can access this
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {canViewMembers ? (
              team.members.map((member) => {
                const entry = userById.get(String(member.user_id));
                const memberRole = resolveTeamRole(team, member.role);
                const displayName = entry?.name ?? entry?.email ?? "Member";
                const initials = displayName[0]?.toUpperCase() ?? "M";

                return (
                  <div
                    key={String(member.user_id)}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-8">
                        {entry?.image ? (
                          <AvatarImage src={entry.image} alt="" />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {displayName}
                          {String(member.user_id) === user.id ? " (you)" : ""}
                        </span>
                        {entry?.email ? (
                          <span className="text-muted-foreground truncate text-xs">
                            {entry.email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {memberRole ? memberRole.name : "Member"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground py-2 text-sm">
                Member management is limited to team managers.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
