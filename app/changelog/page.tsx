import {
  getCategorizedGitHubReleases,
  getReleaseDescriptionsBatch,
  type GitHubRelease,
} from "@/actions/github";
import Header from "@/components/interface/homescreen/header";
import Footer from "@/components/interface/homescreen/footer";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitCommit,
  Calendar,
  Tag,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const revalidate = 300;

export default function ChangelogPage() {
  return (
    <ShaderBackground>
      <div className="min-h-svh w-full flex flex-col bg-transparent relative">
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
  const categorizedReleases = await getCategorizedGitHubReleases(30);

  const [mainAgentReleases, frontendReleases] = await Promise.all([
    getReleasesWithDescriptions(categorizedReleases["main-agent"]),
    getReleasesWithDescriptions(categorizedReleases.frontend),
  ]);

  const hasReleases =
    mainAgentReleases.length > 0 ||
    frontendReleases.length > 0;

  if (!hasReleases) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <GitCommit className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-lg text-white/40 font-light mb-2">
          No GitHub releases found
        </p>
        <p className="text-sm text-white/20 font-light">
          Publish a release to show it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <ReleaseCategorySection
        title="Main Agent"
        subtitle="Releases from netgoat-xyz/netgoat"
        releases={mainAgentReleases}
      />
      <ReleaseCategorySection
        title="Frontend"
        subtitle="Releases from netgoat-xyz/frontend"
        releases={frontendReleases}
      />
    </div>
  );
}

async function getReleasesWithDescriptions(releases: GitHubRelease[]) {
  return getReleaseDescriptionsBatch(releases);
}

function ReleaseCategorySection(props: {
  title: string;
  subtitle: string;
  releases: Array<{ release: GitHubRelease; description: string }>;
}) {
  const { title, subtitle, releases } = props;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white/90">
          {title}
        </h2>
        <p className="text-xs md:text-sm text-white/35 font-light mt-2">{subtitle}</p>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/2 p-6 text-sm text-white/45 font-light">
          No releases published yet in this repository.
        </div>
      ) : (
        <div className="relative pl-8 border-l border-white/8 ml-2">
          {releases.map(({ release, description }, idx) => (
            <div
              key={release.id}
              className={`relative ${idx < releases.length - 1 ? "pb-14" : "pb-0"}`}
            >
              <div className="absolute -left-9.25 top-1.5 w-2.5 h-2.5 rounded-full bg-violet-400/60 ring-[3px] ring-black shadow-lg shadow-violet-500/20" />

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-white/30 font-light">
                  <Calendar className="w-3 h-3" />
                  {new Date(release.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <Tag className="w-2.5 h-2.5" />
                  {release.tagName}
                </span>
                {release.prerelease && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    Pre-release
                  </span>
                )}
              </div>

              <h3 className="text-xl md:text-2xl font-light tracking-tight text-white/90 mb-4 leading-snug">
                {release.name}
              </h3>

              <div className="rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm p-6 md:p-8 space-y-4">
                <p className="text-sm text-white/50 leading-relaxed font-light line-clamp-4">
                  {description}
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    href={`/changelog/${release.category}/${encodeURIComponent(release.tagName)}`}
                    className="inline-flex items-center gap-2 text-xs font-medium text-violet-300/80 hover:text-violet-300 transition-colors"
                  >
                    Read full changelog
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={release.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/65 transition-colors"
                  >
                    View on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
