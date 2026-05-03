import { getPosts } from "@/actions/content";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Header from "@/components/interface/homescreen/header";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Footer from "@/components/interface/homescreen/footer";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

export const revalidate = 300;

function resolveIntlLocale(locale: string) {
  if (locale === "jp") return "ja-JP";
  if (locale === "zh") return "zh-CN";
  if (locale === "tl") return "fil-PH";
  if (locale === "ms") return "ms-MY";
  return locale;
}

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  content?: string;
  createdAt: string;
  coverImage?: string;
}

export default function BlogPage() {
    const t = useTranslations("HomePage");
  
  return (
    <ShaderBackground>
      <div className="min-h-svh w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 container mx-auto px-4 md:px-6 pt-16 pb-24 z-10 max-w-6xl">
          {/* Hero Section */}
          <div className="flex flex-col items-center w-full mx-auto text-center space-y-5 mb-24">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/5 backdrop-blur-sm border border-border/60">
              <BookOpen className="w-3 h-3 text-primary mr-2" />
              <span className="text-muted-foreground text-xs font-light">
                {t("blog.subtitle")}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              {t("blog.title")}
            </h1>
            <p className="text-sm md:text-base max-w-md text-muted-foreground leading-relaxed font-light">
              {t("blog.description")}
            </p>
            <div className="w-16 h-px bg-linear-to-r from-transparent via-border/60 to-transparent mt-4" />
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
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="h-64 md:h-80 bg-muted/30 animate-pulse" />
          <div className="p-8 md:p-10 space-y-4 flex flex-col justify-center">
            <Skeleton className="h-4 w-20 bg-muted/40 rounded-full" />
            <Skeleton className="h-8 w-3/4 bg-muted/40" />
            <Skeleton className="h-4 w-full bg-muted/40" />
            <Skeleton className="h-4 w-2/3 bg-muted/40" />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-48 bg-muted/30 animate-pulse" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-4 w-24 bg-muted/40 rounded-full" />
              <Skeleton className="h-6 w-3/4 bg-muted/40" />
              <Skeleton className="h-4 w-full bg-muted/40" />
              <Skeleton className="h-4 w-1/2 bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function BlogPostsList() {
  const t = await getTranslations("HomePage.blog");
  const locale = resolveIntlLocale(await getLocale());
  const { posts } = (await getPosts("blog")) as { posts: BlogPost[] };

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border/60 flex items-center justify-center mb-6">
          <BookOpen className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <p className="text-lg text-muted-foreground font-light mb-2">{t("empty.title")}</p>
        <p className="text-sm text-muted-foreground/70 font-light">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ogUrl = `${siteUrl}/api/og/blog?title=${featured.title}&author="Netgoat OSS Team"&date=${new Date(
    featured.createdAt,
  ).toLocaleDateString(locale, {
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
      <Link href={`/blog/${featured.slug}`} className="group block">
        <article className="rounded-2xl border border-border/60 bg-card/50 hover:bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-border hover:shadow-2xl hover:shadow-primary/10">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="h-64 md:h-96 overflow-hidden relative">
              <img
                src={ogUrl}
                alt={featured.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-background/70 via-background/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                  {t("labels.featured")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Calendar className="w-3 h-3" />
                  {new Date(featured.createdAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground/90 group-hover:text-foreground transition-colors leading-tight">
                {featured.title}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 font-light">
                {featured.content
                  ? featured.content
                      .replace(/[#*`\[\]]/g, "")
                      .substring(0, 200)
                      .trim()
                  : ""}
                {featured.content && featured.content.length > 200 && "…"}
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
                  {t("actions.readArticle")}
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
          {rest.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group block h-full"
            >
              <article className="h-full flex flex-col rounded-2xl border border-border/60 bg-card/50 hover:bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-border hover:shadow-2xl hover:shadow-primary/10">
                {/* Image */}
                <div className="w-full h-48 overflow-hidden relative">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <h3 className="text-lg font-light tracking-tight text-foreground/90 group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-3 font-light flex-1">
                    {post.content
                      ? post.content
                          .replace(/[#*`\[\]]/g, "")
                          .substring(0, 120)
                          .trim()
                      : ""}
                    {post.content && post.content.length > 120 && "…"}
                  </p>

                  <div className="pt-2 mt-auto">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-primary/70 group-hover:text-primary transition-all">
                      {t("actions.readMore")}
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
