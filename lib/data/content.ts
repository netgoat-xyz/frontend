import { cache } from "react";
import { Types } from "mongoose";

import type { PostType } from "@/lib/content";
import dbConnect from "@/lib/mongoose";
import { POST_TYPES } from "@/lib/content";
import Post from "@/models/Post";

/* -------------------------------------------------------------------------- */
/* Admin reads                                                                */
/* -------------------------------------------------------------------------- */

export const ADMIN_POSTS_PAGE_SIZE = 20;

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  type: PostType;
  published: boolean;
  excerpt: string | null;
  coverImage: string | null;
  version: string | null;
  author: string | null;
  updatedAt: string;
};

export type AdminPostPage = {
  posts: AdminPostRow[];
  total: number;
  page: number;
  pages: number;
};

type RawPost = {
  _id: unknown;
  title?: string;
  slug?: string;
  type?: string;
  published?: boolean;
  excerpt?: string;
  coverImage?: string;
  version?: string;
  author?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

function toRow(post: RawPost): AdminPostRow {
  const type = (POST_TYPES as readonly string[]).includes(post.type ?? "")
    ? (post.type as PostType)
    : "blog";

  return {
    id: String(post._id),
    title: post.title ?? "Untitled",
    slug: post.slug ?? "",
    type,
    published: Boolean(post.published),
    excerpt: post.excerpt || null,
    coverImage: post.coverImage || null,
    version: post.version || null,
    author: post.author || null,
    updatedAt: (post.updatedAt ?? post.createdAt ?? new Date(0)).toISOString(),
  };
}

/** Paginated list for the admin console, optionally filtered by type. */
export async function listAdminPosts(input: {
  type?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPostPage> {
  await dbConnect();

  const filter: { type?: PostType } = {};
  if (input.type && input.type !== "all") {
    if ((POST_TYPES as readonly string[]).includes(input.type)) {
      filter.type = input.type as PostType;
    }
  }

  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Math.floor(input.limit ?? ADMIN_POSTS_PAGE_SIZE)),
  );

  const [total, docs] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug type published excerpt coverImage version author createdAt updatedAt")
      .lean<RawPost[]>(),
  ]);

  return {
    posts: docs.map(toRow),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export type AdminPostDetail = AdminPostRow & { content: string };

/** Single post for the editor; invalid ids resolve to null instead of throwing. */
export async function getAdminPostById(
  id: string,
): Promise<AdminPostDetail | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  await dbConnect();
  const post = await Post.findById(id).lean<RawPost & { content?: string }>();
  if (!post) return null;

  return { ...toRow(post), content: post.content ?? "" };
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export type PublicPost = Omit<AdminPostRow, "id"> & { id: string };

/**
 * Published posts for the marketing site. Wrapped in React `cache()` so a
 * single render pass (listing + sidebar, for example) hits MongoDB once.
 */
export const getPublishedPosts = cache(
  async (
    type: PostType,
    page = 1,
    limit = 10,
  ): Promise<{ posts: PublicPost[]; total: number; pages: number }> => {
    await dbConnect();

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const filter = { type, published: true };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .select("title slug type published excerpt coverImage version author createdAt updatedAt")
        .lean<RawPost[]>(),
      Post.countDocuments(filter),
    ]);

    return {
      posts: posts.map(toRow),
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },
);

export const getPublishedPostBySlug = cache(
  async (slug: string): Promise<AdminPostDetail | null> => {
    await dbConnect();
    const post = await Post.findOne({ slug, published: true }).lean<
      RawPost & { content?: string }
    >();
    if (!post) return null;
    return { ...toRow(post), content: post.content ?? "" };
  },
);

export const getLatestWhatsNew = cache(async (): Promise<AdminPostDetail | null> => {
  await dbConnect();
  const post = await Post.findOne({ type: "whats-new", published: true })
    .sort({ createdAt: -1 })
    .lean<RawPost & { content?: string }>();
  if (!post) return null;
  return { ...toRow(post), content: post.content ?? "" };
});
