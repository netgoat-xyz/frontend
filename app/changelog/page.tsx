import { getPosts } from "@/actions/content";
import Header from "@/components/interface/homescreen/header";
import Footer from "@/components/interface/homescreen/footer";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Markdown from "react-markdown";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitCommit,
  Calendar,
  Tag,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ChangelogPage() {
  return (
    <ShaderBackground>
      <div className="min-h-screen w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 container mx-auto px-4 md:px-6 pt-16 pb-24 z-10 max-w-3xl">
          {/* Hero */}
          <div className="flex flex-col items-center w-full text-center space-y-5 mb-20">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3 h-3 text-violet-300 mr-2" />
              <span className="text-white/70 text-xs font-light">
                What&apos;s New
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white">
              Changelog
            </h1>
            <p className="text-sm md:text-base max-w-md text-white/50 leading-relaxed font-light">
              New updates, improvements, and fixes to NetGoat.
            </p>
            <div className="w-16 h-px bg-linear-to-r from-transparent via-white/20 to-transparent mt-4" />
          </div>

          <Suspense fallback={<ChangelogSkeleton />}>
            <ChangelogContent />
          </Suspense>
        </main>

        <Footer />
      </div>
    </ShaderBackground>
  );
}

function ChangelogSkeleton() {
  return (
    <div className="relative pl-8 border-l border-white/6 ml-2 space-y-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-9.25 top-1 w-2.5 h-2.5 rounded-full bg-white/10 ring-4 ring-black" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 bg-white/10 rounded-full" />
            <Skeleton className="h-7 w-2/3 bg-white/10" />
            <div className="rounded-2xl border border-white/6 bg-white/2 p-6 space-y-3">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-4/5 bg-white/10" />
              <Skeleton className="h-4 w-3/5 bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function ChangelogContent() {
  const { posts } = await getPosts("changelog");

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <GitCommit className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-lg text-white/40 font-light mb-2">
          No changelog entries yet
        </p>
        <p className="text-sm text-white/20 font-light">
          Check back soon for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 border-l border-white/8 ml-2">
      {posts.map((post: any, idx: number) => (
        <div
          key={post._id}
          className={`relative ${idx < posts.length - 1 ? "pb-14" : "pb-0"}`}
        >
          {/* Timeline dot */}
          <div className="absolute -left-9.25 top-1.5 w-2.5 h-2.5 rounded-full bg-violet-400/60 ring-[3px] ring-black shadow-lg shadow-violet-500/20" />

          {/* Date + version badge */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/30 font-light">
              <Calendar className="w-3 h-3" />
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {post.version && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                <Tag className="w-2.5 h-2.5" />
                {post.version}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-light tracking-tight text-white/90 mb-4 leading-snug">
            {post.title}
          </h2>

          {/* Cover image */}
          {post.coverImage && (
            <div className="w-full relative mb-5 rounded-2xl overflow-hidden border border-white/6">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-auto max-h-80 object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
            </div>
          )}

          {/* Content card */}
          <div className="rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm p-6 md:p-8">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-light prose-headings:tracking-tight prose-p:text-white/50 prose-p:leading-relaxed prose-p:font-light prose-a:text-violet-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-white/70 prose-code:text-violet-200 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-li:text-white/50 prose-ul:text-white/50 prose-blockquote:border-violet-500/30 prose-blockquote:text-white/35 prose-img:rounded-xl prose-img:border prose-img:border-white/6">
              <Markdown>{post.content}</Markdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
