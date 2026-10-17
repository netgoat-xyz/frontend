"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import {
  BusinessError,
  toActionResult,
  type ActionResult,
} from "@/lib/actions";
import { assertAdmin } from "@/lib/auth-guards";
import { POST_TYPE_PATHS, slugify } from "@/lib/content";
import { postInputSchema } from "@/lib/validation/content";
import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";

/**
 * Content mutations.
 *
 * Every write is admin-guarded and fully validated — the old implementation
 * passed a partial object straight into `findByIdAndUpdate` (mass assignment
 * of any schema field). Slug collisions are resolved on create and checked on
 * update, so the unique index can never surface as a 500.
 */

function publicPaths(paths: Set<string>): void {
  for (const path of paths) revalidatePath(path);
  revalidatePath("/admin/content");
}

function collectPublicPaths(type: string, slug?: string): Set<string> {
  const paths = new Set<string>(["/", "/blog", "/changelog", "/whats-new"]);
  const base = POST_TYPE_PATHS[type as keyof typeof POST_TYPE_PATHS];
  if (base && slug) paths.add(`${base}/${slug}`);
  return paths;
}

/** Finds a free slug by appending an incrementing suffix. */
async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const seed = base || "post";
  let candidate = seed;
  let counter = 1;

  while (counter <= 100) {
    const existing = await Post.findOne({ slug: candidate })
      .select("_id")
      .lean<{ _id: unknown } | null>();

    if (!existing || String(existing._id) === excludeId) return candidate;
    candidate = `${seed}-${counter}`;
    counter += 1;
  }

  throw new BusinessError("Could not find a free slug — try a different title.");
}

export async function createPostAction(
  input: z.input<typeof postInputSchema>,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await assertAdmin();
    const parsed = postInputSchema.parse(input);
    await dbConnect();

    const slug = await ensureUniqueSlug(
      parsed.slug ? slugify(parsed.slug) : slugify(parsed.title),
    );

    const post = await Post.create({
      title: parsed.title,
      slug,
      content: parsed.content,
      type: parsed.type,
      published: parsed.published,
      excerpt: parsed.excerpt || undefined,
      coverImage: parsed.coverImage || undefined,
      version: parsed.version || undefined,
      author: parsed.author || undefined,
      updatedAt: new Date(),
    });

    publicPaths(collectPublicPaths(parsed.type, slug));
    return { ok: true, data: { id: String(post._id), slug } };
  } catch (error) {
    return toActionResult(error, "Could not create the post.");
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  post: postInputSchema,
});

export async function updatePostAction(input: {
  id: string;
  post: z.input<typeof postInputSchema>;
}): Promise<ActionResult<{ slug: string }>> {
  try {
    await assertAdmin();
    const parsed = updateSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That post no longer exists.");
    }

    await dbConnect();
    const existing = await Post.findById(parsed.id)
      .select("slug")
      .lean<{ slug?: string } | null>();

    if (!existing) throw new BusinessError("That post no longer exists.");

    const desiredSlug = parsed.post.slug
      ? slugify(parsed.post.slug)
      : existing.slug ?? slugify(parsed.post.title);

    const slug = await ensureUniqueSlug(desiredSlug, parsed.id);

    await Post.updateOne(
      { _id: parsed.id },
      {
        $set: {
          title: parsed.post.title,
          slug,
          content: parsed.post.content,
          type: parsed.post.type,
          published: parsed.post.published,
          excerpt: parsed.post.excerpt || undefined,
          coverImage: parsed.post.coverImage || undefined,
          version: parsed.post.version || undefined,
          author: parsed.post.author || undefined,
          updatedAt: new Date(),
        },
      },
      { runValidators: true },
    );

    publicPaths(collectPublicPaths(parsed.post.type, slug));
    return { ok: true, data: { slug } };
  } catch (error) {
    return toActionResult(error, "Could not save the post.");
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deletePostAction(input: {
  id: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    await assertAdmin();
    const parsed = deleteSchema.parse(input);
    if (!Types.ObjectId.isValid(parsed.id)) {
      throw new BusinessError("That post no longer exists.");
    }

    await dbConnect();
    const post = await Post.findByIdAndDelete(parsed.id)
      .select("type slug")
      .lean<{ type?: string; slug?: string } | null>();

    if (!post) throw new BusinessError("That post no longer exists.");

    publicPaths(collectPublicPaths(post.type ?? "blog", post.slug));
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionResult(error, "Could not delete the post.");
  }
}
