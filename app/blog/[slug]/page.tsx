import { getPostBySlug } from "@/actions/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import Markdown from "react-markdown";
import Header from "@/components/interface/homescreen/header";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Footer from "@/components/interface/homescreen/footer";

export const dynamic = "force-dynamic";

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post || post.type !== "blog") {
    notFound();
  }

  const readingTime = post.content ? estimateReadingTime(post.content) : 1;

  return (
    <ShaderBackground>
      <div className="min-h-screen w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 z-10 w-full">
          {/* Back link */}
          <div className="container mx-auto px-4 max-w-3xl pt-8">
            <Link
              href={"/blog" as any}
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Blog
            </Link>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="container mx-auto px-4 max-w-4xl mt-8">
              <div className="w-full h-64 md:h-105 relative rounded-2xl overflow-hidden border border-white/6">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
              </div>
            </div>
          )}

          {/* Article Header */}
          <div className="container mx-auto px-4 max-w-3xl mt-10 mb-12">
            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center flex-wrap gap-4 text-xs text-white/30">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {post.author && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {post.author}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {readingTime} min read
              </span>
            </div>

            <div className="w-full h-px bg-linear-to-r from-white/6 via-white/12 to-white/6 mt-8" />
          </div>

          {/* Article Content */}
          <article className="container mx-auto px-4 max-w-3xl pb-24">
            <div className="prose prose-invert prose-lg max-w-none prose-headings:font-light prose-headings:tracking-tight prose-p:text-white/60 prose-p:leading-relaxed prose-p:font-light prose-a:text-violet-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-white/80 prose-code:text-violet-200 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:border-violet-500/30 prose-blockquote:text-white/40 prose-li:text-white/60 prose-img:rounded-xl prose-img:border prose-img:border-white/[0.06]">
              <Markdown>{post.content}</Markdown>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </ShaderBackground>
  );
}
