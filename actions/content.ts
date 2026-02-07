"use server";

import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";
import { checkAdmin } from "./adminValues";
import { revalidatePath } from "next/cache";

// --- Public Actions ---

export async function getPosts(type: string, page = 1, limit = 10) {
  await dbConnect();
  
  const query = { type, published: true };
  const skip = (page - 1) * limit;
  
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Post.countDocuments(query);
  
  return {
    posts: JSON.parse(JSON.stringify(posts)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getPostBySlug(slug: string) {
  await dbConnect();
  const post = await Post.findOne({ slug, published: true });
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
}

export async function getLatestWhatsNew() {
  await dbConnect();
  const post = await Post.findOne({ type: "whats-new", published: true })
    .sort({ createdAt: -1 });
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
}

// --- Admin Actions ---

export async function getAdminPosts(type?: string, page = 1, limit = 20) {
  await checkAdmin();
  await dbConnect();

  const query: any = {};
  if (type && type !== "all") query.type = type;

  const skip = (page - 1) * limit;
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Post.countDocuments(query);

  return {
    posts: JSON.parse(JSON.stringify(posts)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getPostById(id: string) {
  await checkAdmin();
  await dbConnect();
  const post = await Post.findById(id);
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
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
  return JSON.parse(JSON.stringify(post));
}

export async function updatePost(id: string, data: any) {
  await checkAdmin();
  await dbConnect();

  data.updatedAt = new Date();
  
  const post = await Post.findByIdAndUpdate(id, { $set: data }, { new: true });
  revalidatePath("/blog");
  revalidatePath("/changelog");
  revalidatePath("/admin/content");
  
  if (post.slug && post.type === "blog") {
     revalidatePath(`/blog/${post.slug}`);
  }
  
  return JSON.parse(JSON.stringify(post));
}

export async function deletePost(id: string) {
  await checkAdmin();
  await dbConnect();
  await Post.findByIdAndDelete(id);
  revalidatePath("/admin/content");
  revalidatePath("/blog");
  revalidatePath("/changelog");
}
