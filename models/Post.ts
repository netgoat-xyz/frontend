import mongoose, { Schema, type Model, type Types } from "mongoose";

import { POST_TYPES, type PostType } from "@/lib/content";

/**
 * Editorial content. Collection name and field names stay compatible with the
 * existing `posts` collection so both apps can read the same documents.
 */
const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },
    content: { type: String, required: true },

    type: { type: String, enum: POST_TYPES, default: "blog", required: true },
    published: { type: Boolean, default: false },

    excerpt: { type: String, maxlength: 500 },
    coverImage: { type: String, maxlength: 2048 },
    version: { type: String, maxlength: 50 },
    author: { type: String, maxlength: 120 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "posts" },
);

PostSchema.index({ type: 1, published: 1, createdAt: -1 });
PostSchema.index({ published: 1, createdAt: -1 });

export type PostDocument = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  type: PostType;
  published: boolean;
  excerpt?: string;
  coverImage?: string;
  version?: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const Post: Model<PostDocument> =
  (mongoose.models.Post as Model<PostDocument>) ??
  mongoose.model<PostDocument>("Post", PostSchema, "posts");

export default Post;
