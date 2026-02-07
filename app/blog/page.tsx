import { getPosts } from "@/actions/content";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavigationTop from "@/components/elements/NavigationTop";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function BlogPage() {
  return (
    <ShaderBackground>
      <div className="min-h-screen flex flex-col bg-transparent">
        <NavigationTop />
        <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-16 mt-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Our Blog
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-blue-100/70">
              Latest news, updates, and engineering deep dives.
            </p>
          </div>

          <Suspense fallback={<BlogSkeleton />}>
            <BlogPostsList />
          </Suspense>
        </main>
        <BelowScreenFooter />
      </div>
    </ShaderBackground>
  );
}

function BlogSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
          <div className="w-full h-48 bg-white/5 animate-pulse" />
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-1/4 bg-white/10" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full bg-white/10 mb-2" />
            <Skeleton className="h-4 w-full bg-white/10 mb-2" />
            <Skeleton className="h-4 w-2/3 bg-white/10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function BlogPostsList() {
  const { posts } = await getPosts("blog");

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl text-muted-foreground font-light">No posts published yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post: any) => (
        <Link key={post._id} href={"/blog/" + post.slug as any} className="group block h-full">
          <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/60 hover:border-violet-500/30 transition-all duration-300 overflow-hidden flex flex-col group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
            {post.coverImage ? (
              <div className="w-full h-48 bg-neutral-900/50 overflow-hidden relative">
                <img 
                  src={post.coverImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
                <div className="w-full h-48 bg-gradient-to-br from-violet-900/20 to-indigo-900/20 flex items-center justify-center">
                    <span className="text-4xl opacity-50">📄</span>
                </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="group-hover:text-primary transition-colors text-xl leading-tight text-white/90">
                    {post.title}
                </CardTitle>
              </div>
              <CardDescription className="text-blue-200/50 font-mono text-xs pt-2">
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed text-blue-100/60">
                {post.content ? post.content.replace(/[#*`]/g, "").substring(0, 150) : ""}...
              </p>
            </CardContent>
             <div className="px-6 pb-6 pt-0 mt-auto">
                 <span className="text-xs font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Read article <span className="transition-transform group-hover:translate-x-1">→</span>
                 </span>
             </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
