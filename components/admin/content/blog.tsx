"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Calendar, Clock, Trash2, Edit } from "lucide-react";
import { PageTitle } from "../../SiteTitle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

interface BlogHomeProps {
  onCreate: () => void;
  onEdit: (slug: string) => void;
}

export default function BlogHome({ onCreate, onEdit }: BlogHomeProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
      else setPosts(data.posts || []);
    } catch {
      setMessage("Oops! Either database went kaboom or no posts yet :(");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (slug: string) => {
    let deleted = false;

    toast(`Delete blog?`, {
      description: "This action is irreversible.",
      action: {
        label: "Confirm",
        onClick: async () => {
          try {
            const res = await fetch(`/api/blog/${slug}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            deleted = true;
            fetchPosts();
            toast("Deleted!", { description: "Blog post removed." });
          } catch {
            toast("Error", { description: "Failed to delete blog post." });
          }
        },
      },
      duration: 8000,
    });

    setTimeout(() => {
      if (!deleted) console.log("Delete cancelled");
    }, 8000);
  };

  if (loading) {
    return (
      <div className="w-full mx-auto p-6 space-y-12">
        <PageTitle
          title="Blog Management"
          subtitle="Create, edit, and manage blog posts."
          actions={<Button onClick={onCreate}>New Post</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-4"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex justify-between pt-4 border-t">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-6">
        <PageTitle
          title="Blog Management"
          subtitle="Create, edit, and manage blog posts."
          actions={<Button onClick={onCreate}>New Post</Button>}
        />
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mt-12 mb-2">No posts</h2>
          <p className="text-muted-foreground">
            {message || "No blogs to edit 💥"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full mx-auto p-6 space-y-12">
      <PageTitle
        title="Blog Management"
        subtitle="Create, edit, and manage blog posts."
        actions={<Button onClick={onCreate}>New Post</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="group relative rounded-xl border bg-card shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
          >
            <div className="p-6 flex flex-col flex-grow">
              <span className="text-xs uppercase tracking-wide text-primary font-medium mb-2">
                {post.category}
              </span>
              <h2 className="text-lg font-semibold mb-3">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-3">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />{" "}
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {post.readTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(post.slug)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.slug)}
                    className="text-destructive hover:text-destructive/65"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const url = window.location.origin + `/blog/${post.slug}`;
                      if (navigator.share) {
                        navigator.share({
                          title: post.title,
                          text: post.excerpt,
                          url,
                        });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast("Copied!", {
                          description: "Link copied to clipboard",
                        });
                      }
                    }}
                    className="text-primary hover:text-primary/65"
                  >
                    <Share2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
