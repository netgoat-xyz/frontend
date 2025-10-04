import { NextResponse } from "next/server";
import BlogPost from "@/models/BlogPost";
import mongoose from "mongoose";

async function connectDB() {
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}


export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const parami = await params; 
    const post = await BlogPost.findOne({ slug: parami.slug });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error("GET /blog/:slug error:", err);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }, // Destructured definition
) {
  try {
    await connectDB();
    const slug = params; // Accessing params directly

   const deleted = await BlogPost.findOneAndDelete({ slug });

    if (!deleted) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("DELETE /blog/:slug error:", err);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 },
    );
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }, // Destructured definition
) {
  try {
    await connectDB();
    const slug = params; // Accessing params directly

    const updates = await req.json();
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    // Replace with your actual model logic:
    // const updatedPost = await BlogPost.findOneAndUpdate({ slug }, updates, { new: true });
    const updatedPost = await (BlogPost as any).findOneAndUpdate(
      { slug },
      updates,
      { new: true },
    );

    if (!updatedPost) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (err) {
    console.error("PATCH /blog/:slug error:", err);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 },
    );
  }
}
