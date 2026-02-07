import { getPostBySlug } from "@/actions/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import NavigationTop from "@/components/elements/NavigationTop";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";

export const dynamic = "force-dynamic";

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post || post.type !== "blog") {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationTop />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
            <Link href="/blog" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
        </div>

        <article className="prose prose-invert lg:prose-xl max-w-none">
          <h1>{post.title}</h1>
          
          {post.coverImage && (
            <div className="w-full h-64 md:h-96 relative mb-8 rounded-lg overflow-hidden not-prose border border-neutral-800">
              <img 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-8 not-prose">
             <span>{new Date(post.createdAt).toLocaleDateString()}</span>
             {post.author && <span>by {post.author}</span>}
          </div>
          
          <Markdown>{post.content}</Markdown>
        </article>
      </main>
      <BelowScreenFooter />
    </div>
  );
}
