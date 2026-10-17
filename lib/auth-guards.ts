import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { ensurePersonalTeam, personalTeamSlug } from "@/lib/teams";
import Team, {
  resolveTeamRole,
  roleHasCapability,
  type ResolvedTeamRole,
  type TeamCapability,
  type TeamDocument,
} from "@/models/Team";

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
};

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/** Thrown by action-side guards. Actions should catch and return messages. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/* -------------------------------------------------------------------------- */
/* Page guards (redirect / interrupt)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Server component guard: requires a signed-in, non-banned user.
 * Redirects to the login page (or /banned) when the requirement is not met.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.banned) redirect("/banned");
  return user;
}

/** Server component guard: requires a signed-in admin. */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") forbidden();
  return user;
}

/* -------------------------------------------------------------------------- */
/* Action guards (throw)                                                       */
/* -------------------------------------------------------------------------- */

/** Action guard: requires a signed-in, non-banned user. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("You must be signed in to do that.");
  if (user.banned) throw new AuthError("Your account is suspended.");
  return user;
}

/** Action guard: requires a signed-in admin. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await assertUser();
  if (user.role !== "admin") throw new AuthError("Admin access required.");
  return user;
}

/* -------------------------------------------------------------------------- */
/* Team access                                                                 */
/* -------------------------------------------------------------------------- */

export type TeamContext = {
  user: SessionUser;
  team: TeamDocument;
  role: ResolvedTeamRole;
};

const isPersonalSlug = (slug: string): boolean => slug === "@me" || slug.startsWith("@me-");

/**
 * Finds the team a user is a member of by slug. "@me" resolves to the
 * caller's personal team (provisioning it when missing).
 */
export async function findTeamForUser(
  slugOrName: string,
  user: SessionUser,
): Promise<TeamDocument | null> {
  await dbConnect();
  const slug = decodeURIComponent(slugOrName);

  if (isPersonalSlug(slug)) {
    const personalSlug = personalTeamSlug(user.id);
    const existing = await Team.findOne({ slug: personalSlug }).lean<TeamDocument>();
    if (existing) return existing;

    await ensurePersonalTeam({ id: user.id, name: user.name, email: user.email });
    return Team.findOne({ slug: personalSlug }).lean<TeamDocument>();
  }

  return Team.findOne({
    slug,
    "members.user_id": user.id,
    active: true,
  }).lean<TeamDocument>();
}

/**
 * Action guard: asserts membership (and, optionally, a capability) for a team
 * slug. Returns the team plus the caller's resolved role.
 */
export async function assertTeamAccess(
  slugOrName: string,
  capability?: TeamCapability,
): Promise<TeamContext> {
  const user = await assertUser();
  const team = await findTeamForUser(slugOrName, user);

  if (!team) {
    throw new AuthError("You do not have access to this team.");
  }

  const membership = team.members.find(
    (member) => String(member.user_id) === user.id,
  );

  if (!membership) {
    throw new AuthError("You do not have access to this team.");
  }

  const role = resolveTeamRole(team, membership.role);
  if (!role) {
    throw new AuthError("Your role on this team could not be resolved.");
  }

  if (capability && !roleHasCapability(role, capability)) {
    throw new AuthError("Your role does not allow this action.");
  }

  return { user, team, role };
}

/** Lists every team the user belongs to, newest first. */
export async function listUserTeams(userId: string): Promise<TeamDocument[]> {
  await dbConnect();
  return Team.find({ "members.user_id": userId, active: true })
    .sort({ created_at: -1 })
    .lean<TeamDocument[]>();
}
