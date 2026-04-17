"use server";

import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";
import { checkAdmin } from "./adminValues";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

// --- Public Actions ---

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const getPostsCached = unstable_cache(
  async (type: string, page: number, limit: number) => {
    await dbConnect();

    const query = { type, published: true };
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts: serialize(posts),
      total,
      pages: Math.ceil(total / limit),
    };
  },
  ["content-public-posts"],
  { revalidate: 300, tags: ["content-posts"] },
);

const getPostBySlugCached = unstable_cache(
  async (slug: string) => {
    await dbConnect();
    return serialize(await Post.findOne({ slug, published: true }).lean());
  },
  ["content-post-by-slug"],
  { revalidate: 300, tags: ["content-post-by-slug"] },
);

const getLatestWhatsNewCached = unstable_cache(
  async () => {
    await dbConnect();
    return serialize(
      await Post.findOne({ type: "whats-new", published: true })
        .sort({ createdAt: -1 })
        .lean(),
    );
  },
  ["content-latest-whats-new"],
  { revalidate: 120, tags: ["content-whats-new"] },
);

export async function getPosts(type: string, page = 1, limit = 10) {
  return getPostsCached(type, page, limit);
}

export async function getPostBySlug(slug: string) {
  return getPostBySlugCached(slug);
}

export async function getLatestWhatsNew() {
  return getLatestWhatsNewCached();
}

// --- Admin Actions ---

export async function getAdminPosts(type?: string, page = 1, limit = 20) {
  await checkAdmin();
  await dbConnect();

  const query: any = {};
  if (type && type !== "all") query.type = type;

  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments(query),
  ]);

  return {
    posts: serialize(posts),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getPostById(id: string) {
  await checkAdmin();
  await dbConnect();
  return serialize(await Post.findById(id).lean());
}

export async function createPost(data: any) {
  await checkAdmin();
  await dbConnect();
  
  // Ensure slug
  if (!data.slug) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  
  // Check slug uniqueness
  let slug = data.slug;
  let counter = 1;
  while (await Post.findOne({ slug })) {
    slug = `${data.slug}-${counter}`;
    counter++;
  }
  data.slug = slug;
  data.updatedAt = new Date();

  const post = await Post.create(data);
  revalidatePath("/blog");
  revalidatePath("/changelog");
  revalidatePath("/admin/content");
  revalidateTag("content-posts");
  revalidateTag("content-post-by-slug");
  revalidateTag("content-whats-new");
  return serialize(post.toObject());
}

export async function updatePost(id: string, data: any) {
  await checkAdmin();
  await dbConnect();

  data.updatedAt = new Date();

  const post = await Post.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  revalidatePath("/blog");
  revalidatePath("/changelog");
  revalidatePath("/admin/content");
  revalidateTag("content-posts");
  revalidateTag("content-post-by-slug");
  revalidateTag("content-whats-new");
  
  if (post?.slug && post.type === "blog") {
     revalidatePath(`/blog/${post.slug}`);
  }

  return serialize(post);
}

export async function deletePost(id: string) {
  await checkAdmin();
  await dbConnect();
  await Post.findByIdAndDelete(id);
  revalidatePath("/admin/content");
  revalidatePath("/blog");
  revalidatePath("/changelog");
  revalidateTag("content-posts");
  revalidateTag("content-post-by-slug");
  revalidateTag("content-whats-new");
}
