/**
 * Shared content vocabulary. This module must stay free of mongoose/server
 * imports so client components (the admin editor) can import the same labels
 * and helpers without pulling the database layer into the bundle.
 */

export const POST_TYPES = ["blog", "changelog", "whats-new"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  blog: "Blog post",
  changelog: "Changelog",
  "whats-new": "What's new",
};

export const POST_TYPE_PATHS: Record<PostType, string> = {
  blog: "/blog",
  changelog: "/changelog",
  "whats-new": "/whats-new",
};

export function isPostType(value: unknown): value is PostType {
  return (
    typeof value === "string" && (POST_TYPES as readonly string[]).includes(value)
  );
}

/** URL-safe slug derived from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}
