import mongoose from "mongoose";
import { NextResponse } from "next/server";
import BlogPost from "@/models/BlogPost";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI env var");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const db = await mongoose.connect(MONGODB_URI);
  isConnected = db.connections[0].readyState === 1;
  console.log("✅ MongoDB connected");
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const post = await BlogPost.findOne({ slug: params.slug });
    if (!post)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error("GET /blog/:slug error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const deleted = await BlogPost.findOneAndDelete({ slug: params.slug });
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /blog/:slug error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const updates = await req.json();
    if (!updates || Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });

    const updatedPost = await BlogPost.findOneAndUpdate(
      { slug: params.slug },
      updates,
      { new: true }
    );

    if (!updatedPost)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(updatedPost);
  } catch (err) {
    console.error("PATCH /blog/:slug error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
