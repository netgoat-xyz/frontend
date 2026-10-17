"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { BusinessError, toActionResult, type ActionResult } from "@/lib/actions";
import { assertAdmin } from "@/lib/auth-guards";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

/**
 * Admin account management.
 *
 * All mutations go through better-auth's admin plugin endpoints rather than
 * writing the user document directly: the plugin enforces permission checks,
 * refuses self-bans, and keeps ban metadata (reason, expiry) consistent.
 * Banning also revokes every live session so the change takes effect
 * immediately instead of at session expiry.
 */

const userSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(320),
  role: z.enum(["user", "admin"]),
  banned: z.boolean(),
  banReason: z.string().trim().max(280).optional(),
});

export type AdminUserInput = z.infer<typeof userSchema>;

/** Surfaces better-auth's own error messages in the console UI. */
function authMessage(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    typeof (error as { body?: { message?: string } }).body?.message === "string"
  ) {
    return (error as { body: { message: string } }).body.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return null;
}

export async function saveAdminUserAction(
  input: AdminUserInput,
): Promise<ActionResult<{ updated: true }>> {
  try {
    const admin = await assertAdmin();
    const parsed = userSchema.parse(input);

    if (parsed.userId === admin.id && (parsed.banned || parsed.role !== "admin")) {
      throw new BusinessError(
        "You cannot demote or ban your own account — ask another admin to do it.",
      );
    }

    const requestHeaders = await headers();
    await dbConnect();

    const current = await User.findById(parsed.userId)
      .select("name email role banned")
      .lean<{
        name?: string;
        email?: string;
        role?: string;
        banned?: boolean;
      } | null>();

    if (!current) throw new BusinessError("That user no longer exists.");

    const nameChanged = (current.name ?? "") !== parsed.name;
    const emailChanged = (current.email ?? "").toLowerCase() !== parsed.email;

    // 1. Profile fields. Passing only the allowlisted pair keeps this a
    //    targeted update, never a mass assignment. A changed email is marked
    //    unverified again.
    if (nameChanged || emailChanged) {
      await auth.api.adminUpdateUser({
        body: {
          userId: parsed.userId,
          data: {
            ...(nameChanged ? { name: parsed.name } : {}),
            ...(emailChanged ? { email: parsed.email, emailVerified: false } : {}),
          },
        },
        headers: requestHeaders,
      });
    }

    // 2. Role change (endpoint enforces admin-only handling).
    if ((current.role ?? "user") !== parsed.role) {
      await auth.api.setRole({
        body: { userId: parsed.userId, role: parsed.role },
        headers: requestHeaders,
      });
    }

    // 3. Ban state.
    const wasBanned = Boolean(current.banned);
    if (parsed.banned !== wasBanned) {
      if (parsed.banned) {
        await auth.api.banUser({
          body: {
            userId: parsed.userId,
            banReason: parsed.banReason || "Banned by an administrator",
          },
          headers: requestHeaders,
        });
        await auth.api
          .revokeUserSessions({
            body: { userId: parsed.userId },
            headers: requestHeaders,
          })
          .catch((error) => {
            console.error("[admin] revoking banned user sessions failed:", error);
          });
      } else {
        await auth.api.unbanUser({
          body: { userId: parsed.userId },
          headers: requestHeaders,
        });
      }
    }

    revalidatePath("/admin/users");
    return { ok: true, data: { updated: true } };
  } catch (error) {
    return toActionResult(error, authMessage(error) ?? "Could not update the user.");
  }
}

const banSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
  reason: z.string().trim().max(280).optional(),
});

/** Ban/unban without touching the rest of the profile. */
export async function setAdminUserBannedAction(input: {
  userId: string;
  banned: boolean;
  reason?: string;
}): Promise<ActionResult<{ banned: boolean }>> {
  try {
    const admin = await assertAdmin();
    const parsed = banSchema.parse(input);

    if (parsed.banned && parsed.userId === admin.id) {
      throw new BusinessError("You cannot ban your own account.");
    }

    const requestHeaders = await headers();

    if (parsed.banned) {
      await auth.api.banUser({
        body: {
          userId: parsed.userId,
          banReason: parsed.reason || "Banned by an administrator",
        },
        headers: requestHeaders,
      });
      await auth.api
        .revokeUserSessions({
          body: { userId: parsed.userId },
          headers: requestHeaders,
        })
        .catch((error) => {
          console.error("[admin] revoking banned user sessions failed:", error);
        });
    } else {
      await auth.api.unbanUser({
        body: { userId: parsed.userId },
        headers: requestHeaders,
      });
    }

    revalidatePath("/admin/users");
    return { ok: true, data: { banned: parsed.banned } };
  } catch (error) {
    return toActionResult(error, authMessage(error) ?? "Could not update the ban state.");
  }
}
