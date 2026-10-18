import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  findTeamForUser,
  getTeamContext,
  listUserTeams,
  requireUser,
} from "@/lib/auth-guards";

type WorkspaceShellProps = {
  /**
   * Team slug from the URL for team-scoped routes. Omitted on routes that
   * live outside a team (account, team management) — those fall back to the
   * caller's personal team so the sidebar chrome is always the same.
   */
  teamSlug?: string;
  /** Optional context line in the top bar instead of the team name. */
  contextLabel?: string;
  children: React.ReactNode;
};

/**
 * The single dashboard chrome used by every authenticated area: team routes,
 * the account area and team management all mount this, so navigation feels
 * like one product instead of three separate pages.
 */
export async function WorkspaceShell({
  teamSlug,
  contextLabel,
  children,
}: WorkspaceShellProps) {
  const user = await requireUser();
  const team = teamSlug
    ? (await getTeamContext(teamSlug)).team
    : await findTeamForUser("@me", user);
  if (!team) notFound();

  const teams = await listUserTeams(user.id);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      teams={teams.map((item) => ({ slug: item.slug, name: item.name }))}
      team={{ slug: team.slug, name: team.name }}
      contextLabel={contextLabel}
    >
      {children}
    </DashboardShell>
  );
}
