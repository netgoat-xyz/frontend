import mongoose from "mongoose";
import Team from "@/models/Team";

/** Slug of the personal team that every user owns. */
export function personalTeamSlug(userId: string): string {
  return `@me-${userId}`;
}

type ProvisionableUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

/**
 * Provision the owner team for a freshly created account.
 *
 * Uses an upsert against the unique slug index so concurrent requests (email
 * sign-up + social callback, retries) can never create duplicates. Called from
 * the better-auth user-create database hook.
 */
export async function ensurePersonalTeam(user: ProvisionableUser): Promise<void> {
  if (!mongoose.isValidObjectId(user.id)) return;

  const slug = personalTeamSlug(user.id);
  const displayName = user.name?.trim() || user.email?.split("@")[0] || "User";

  try {
    await Team.updateOne(
      { slug },
      {
        $setOnInsert: {
          name: `${displayName}'s Personal Team`,
          slug,
          description: "Your personal team",
          members: [
            {
              user_id: new mongoose.Types.ObjectId(user.id),
              role: "owner",
              joined_at: new Date(),
            },
          ],
          active: true,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    // E11000 = another request won the race; the team exists, which is fine.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return;
    }
    throw error;
  }
}

/**
 * Returns the user's personal team, provisioning it if it is missing (for
 * accounts created before the hook existed or by external tooling).
 */
export async function getOrCreatePersonalTeam(user: ProvisionableUser) {
  await ensurePersonalTeam(user);
  return Team.findOne({ slug: personalTeamSlug(user.id) }).lean();
}
