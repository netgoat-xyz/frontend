import {
  getGitHubReleaseByTag,
  type GitHubReleaseCategory,
} from "@/actions/github";
import Header from "@/components/interface/homescreen/header";
import Footer from "@/components/interface/homescreen/footer";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export const revalidate = 900;

type ChangelogDetailPageProps = {
  params: Promise<{ category: string; tag: string }>;
};

function isValidCategory(value: string): value is GitHubReleaseCategory {
  return value === "main-agent" || value === "frontend";
}

export default async function ChangelogDetailPage(props: ChangelogDetailPageProps) {
  const translationsPromise = getTranslations("ChangelogDetail");
  const params = await props.params;
  const categoryParam = decodeURIComponent(params.category);
  const tag = decodeURIComponent(params.tag);

  if (!isValidCategory(categoryParam)) {
    notFound();
  }

  const [t, release] = await Promise.all([
    translationsPromise,
    getGitHubReleaseByTag(tag, categoryParam),
  ]);

  if (!release) {
    notFound();
  }

  return (
    <ShaderBackground>
      <div className="min-h-svh w-full flex flex-col bg-transparent relative">
        <Header />

        <main className="flex-1 z-10 w-full">
          <div className="container mx-auto px-4 max-w-4xl pt-8 pb-4">
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t("back")}
            </Link>
          </div>

          <section className="container mx-auto px-4 max-w-4xl mt-6 mb-10">
            <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {release.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <Tag className="w-2.5 h-2.5" />
                  {release.tagName}
                </span>
                {release.prerelease && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <FlaskConical className="w-2.5 h-2.5" />
                    {t("preRelease")}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight mb-5">
                {release.name}
              </h1>

              <div className="flex items-center flex-wrap gap-4 text-xs text-white/35">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(release.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {release.authorLogin}
                </span>
                <span className="inline-flex items-center gap-1.5 text-white/45">
                  {release.repository}
                </span>
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-violet-300/80 hover:text-violet-300 transition-colors"
                >
                  {t("githubRelease")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          <article className="container mx-auto px-4 max-w-4xl pb-24">
            <div className="rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm p-6 md:p-10">
              <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-light prose-headings:tracking-tight prose-p:text-white/60 prose-p:leading-relaxed prose-p:font-light prose-a:text-violet-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-white/80 prose-code:text-violet-200 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-li:text-white/60 prose-ul:text-white/60 prose-ol:text-white/60 prose-blockquote:border-violet-500/30 prose-blockquote:text-white/40 prose-img:rounded-xl prose-img:border prose-img:border-white/6">
                {release.body.trim() ? (
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {release.body}
                  </Markdown>
                ) : (
                  <p className="text-white/50">{t("emptyReleaseNotes")}</p>
                )}
              </div>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </ShaderBackground>
  );
}
