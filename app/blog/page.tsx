import { getPosts } from "@/actions/content";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Header from "@/components/interface/homescreen/header";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Footer from "@/components/interface/homescreen/footer";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

export default function BlogPage() {
    const t = useTranslations("HomePage");
  
  return (
    <ShaderBackground>
      <div className="min-h-svh w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 container mx-auto px-4 md:px-6 pt-16 pb-24 z-10 max-w-6xl">
          {/* Hero Section */}
          <div className="flex flex-col items-center w-full mx-auto text-center space-y-5 mb-24">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <BookOpen className="w-3 h-3 text-violet-300 mr-2" />
              <span className="text-white/70 text-xs font-light">
                {t("blog.subtitle")}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white">
              {t("blog.title")}
            </h1>
            <p className="text-sm md:text-base max-w-md text-white/50 leading-relaxed font-light">
              {t("blog.description")}
            </p>
            <div className="w-16 h-px bg-linear-to-r from-transparent via-white/20 to-transparent mt-4" />
          </div>

          <Suspense fallback={<BlogSkeleton />}>
            <BlogPostsList />
          </Suspense>
        </main>

        <Footer />
      </div>
    </ShaderBackground>
  );
}

function BlogSkeleton() {
  return (
    <div className="space-y-16">
      {/* Featured skeleton */}
      <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="h-64 md:h-80 bg-white/5 animate-pulse" />
          <div className="p-8 md:p-10 space-y-4 flex flex-col justify-center">
            <Skeleton className="h-4 w-20 bg-white/10 rounded-full" />
            <Skeleton className="h-8 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-2/3 bg-white/10" />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-48 bg-white/5 animate-pulse" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-4 w-24 bg-white/10 rounded-full" />
              <Skeleton className="h-6 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function BlogPostsList() {
  const { posts } = await getPosts("blog");

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <BookOpen className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-lg text-white/40 font-light mb-2">No posts yet</p>
        <p className="text-sm text-white/20 font-light">
          Check back soon for updates.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ogUrl = `${siteUrl}/api/og/blog?title=${featured.title}&author="Netgoat OSS Team"&date=${new Date(
    featured.createdAt,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}&description=${
    featured.content
      ? featured.content
          .replace(/[#*`\[\]]/g, "")
          .substring(0, 200)
          .trim()
      : ""
  }`;

  return (
    <div className="space-y-16">
      {/* Featured Post */}
      <Link href={`/blog/${featured.slug}` as any} className="group block">
        <article className="rounded-2xl border border-white/6 bg-white/2 hover:bg-white/4 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/12 hover:shadow-2xl hover:shadow-violet-500/5">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="h-64 md:h-96 overflow-hidden relative">
              <img
                src={ogUrl}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/40 via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  Featured
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
                  <Calendar className="w-3 h-3" />
                  {new Date(featured.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white/90 group-hover:text-white transition-colors leading-tight">
                {featured.title}
              </h2>

              <p className="text-sm text-white/40 leading-relaxed line-clamp-3 font-light">
                {featured.content
                  ? featured.content
                      .replace(/[#*`\[\]]/g, "")
                      .substring(0, 200)
                      .trim()
                  : ""}
                {featured.content && featured.content.length > 200 && "…"}
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-violet-300/70 group-hover:text-violet-300 transition-colors">
                  Read article
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>

      {/* Remaining Posts Grid */}
      {rest.length > 0 && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post: any) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}` as any}
              className="group block h-full"
            >
              <article className="h-full flex flex-col rounded-2xl border border-white/6 bg-white/2 hover:bg-white/4 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/12 hover:shadow-2xl hover:shadow-violet-500/5">
                {/* Image */}
                <div className="w-full h-48 overflow-hidden relative">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <h3 className="text-lg font-light tracking-tight text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-sm text-white/30 leading-relaxed line-clamp-3 font-light flex-1">
                    {post.content
                      ? post.content
                          .replace(/[#*`\[\]]/g, "")
                          .substring(0, 120)
                          .trim()
                      : ""}
                    {post.content && post.content.length > 120 && "…"}
                  </p>

                  <div className="pt-2 mt-auto">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-violet-300/50 group-hover:text-violet-300 transition-all">
                      Read more
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
