import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["blog", "changelog", "whats-new"], 
    default: "blog",
    required: true 
  },
  published: { type: Boolean, default: false },
  excerpt: String,
  coverImage: String,
  version: String, 
  author: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: "posts" });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
