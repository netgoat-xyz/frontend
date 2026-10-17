"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DomainError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertTeamAccess, assertUser } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import Team from "@/models/Team";

const MAX_TEAMS_PER_USER = 20;

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team names need at least 2 characters.")
    .max(48, "Team names can be at most 48 characters."),
});

function slugifyTeamName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "team"
  );
}

export async function createTeamAction(input: {
  name: string;
}): Promise<ActionResult<{ slug: string }>> {  try {
    const user = await assertUser();
    const { name } = createTeamSchema.parse(input);
    await dbConnect();

    const teamCount = await Team.countDocuments({ "members.user_id": user.id });
    if (teamCount >= MAX_TEAMS_PER_USER) {
      throw new DomainError(
        `You already own ${MAX_TEAMS_PER_USER} teams — that's the limit.`,
      );
    }

    let slug = slugifyTeamName(name);
    const clash = await Team.findOne({ slug }).select({ _id: 1 }).lean();
    if (clash) {
      slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
    }

    const team = await Team.create({
      name,
      slug,
      members: [
        {
          user_id: user.id,
          role: "owner",
          joined_at: new Date(),
        },
      ],
      active: true,
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, data: { slug: team.slug } };
  } catch (error) {
    return toActionResult(error, "Could not create the team.");
  }
}

const renameTeamSchema = z.object({
  teamSlug: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, "Team names need at least 2 characters.")
    .max(48, "Team names can be at most 48 characters."),
});

export async function renameTeamAction(input: {
  teamSlug: string;
  name: string;
}): Promise<ActionResult<{ name: string }>> {
  try {
    const parsed = renameTeamSchema.parse(input);
    const { team } = await assertTeamAccess(parsed.teamSlug, "team.settings.update");
    await dbConnect();

    await Team.updateOne(
      { _id: team._id },
      { $set: { name: parsed.name, updated_at: new Date() } },
    );

    revalidatePath(`/dashboard/${team.slug}`, "layout");
    return { ok: true, data: { name: parsed.name } };
  } catch (error) {
    return toActionResult(error, "Could not rename the team.");
  }
}
