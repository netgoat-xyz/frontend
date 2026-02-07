import { getPosts } from "@/actions/content";
import NavigationTop from "@/components/elements/NavigationTop";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";
import Markdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  const { posts } = await getPosts("changelog");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationTop />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
          <p className="text-muted-foreground text-lg">
            New updates and improvements to NetGoat.
          </p>
        </div>

        <div className="relative border-l border-neutral-800 ml-4 space-y-12">
          {posts.map((post: any) => (
            <div key={post._id} className="relative pl-8 pb-8">
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-neutral-800 bg-background" />
              <div className="flex flex-col space-y-2 mb-4">
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 font-mono">
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {post.version && (
                        <Badge variant="outline" className="font-mono text-xs">{post.version}</Badge>
                    )}
                 </div>
                 <h2 className="text-xl font-bold">{post.title}</h2>
              </div>
              
              {post.coverImage && (
                <div className="w-full relative mb-6 rounded-lg overflow-hidden border border-neutral-800">
                  <img src={post.coverImage} alt={post.title} className="w-full h-auto max-h-96 object-cover" />
                </div>
              )}

              <div className="prose prose-invert prose-sm text-neutral-300">
                <Markdown>{post.content}</Markdown>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="pl-8 text-neutral-500">
               No changelog entries yet.
            </div>
          )}
        </div>
      </main>
      <BelowScreenFooter />
    </div>
  );
}
