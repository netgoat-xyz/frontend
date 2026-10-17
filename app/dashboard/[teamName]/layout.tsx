import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTeamContext, listUserTeams } from "@/lib/auth-guards";

/**
 * Team-scoped layout: resolves the team, verifies membership and mounts the
 * dashboard shell with the workspace switcher.
 */
export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { user, team } = await getTeamContext(teamName);
  if (!team) notFound();

  const teams = await listUserTeams(user.id);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      teams={teams.map((item) => ({ slug: item.slug, name: item.name }))}
      team={{ slug: team.slug, name: team.name }}
    >
      {children}
    </DashboardShell>
  );
}
