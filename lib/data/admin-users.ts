import type { QueryFilter } from "mongoose";

import dbConnect from "@/lib/mongoose";
import User, { type UserDocument } from "@/models/User";

export const ADMIN_USERS_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 100;

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  banned: boolean;
  banReason: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type AdminUserPage = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pages: number;
};

/** Escapes user input so a search term can never become a live regex. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Paginated user search for the admin console.
 *
 * Unlike the previous implementation this escapes the search term (no regex
 * injection or ReDoS), clamps the page size, and selects an explicit field
 * projection so raw documents — quotas, experiment lists, ban internals —
 * never reach the client.
 */
export async function listAdminUsers(input: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUserPage> {
  await dbConnect();

  const filter: QueryFilter<UserDocument> = {};
  const term = (input.search ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  if (term) {
    const regex = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.min(50, Math.max(1, Math.floor(input.limit ?? ADMIN_USERS_PAGE_SIZE)));

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email role banned banReason emailVerified createdAt")
      .lean<
        Array<{
          _id: unknown;
          name?: string;
          email?: string;
          role?: string;
          banned?: boolean;
          banReason?: string;
          emailVerified?: boolean;
          createdAt?: Date;
        }>
      >(),
  ]);

  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    users: docs.map((user) => ({
      id: String(user._id),
      name: user.name ?? "Unnamed",
      email: user.email ?? "",
      role: user.role === "admin" ? "admin" : "user",
      banned: Boolean(user.banned),
      banReason: user.banReason ?? null,
      emailVerified: Boolean(user.emailVerified),
      createdAt: (user.createdAt ?? new Date(0)).toISOString(),
    })),
  };
}
