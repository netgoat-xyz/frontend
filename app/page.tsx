import dynamic from "next/dynamic";

import Header from "@/components/interface/homescreen/header";
import HeroContent from "@/components/interface/homescreen/hero-content";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import ScrollIndicator from "@/components/interface/homescreen/scroll-indicator";
import LaunchWrapper from "@/components/interface/homescreen/launch-wrapper";
import { getExperiments } from "@/actions/experiments";
import { getGitHubStats } from "@/actions/github";

const Features = dynamic(
  () => import("@/components/interface/homescreen/features"),
  { ssr: true }
);
const Stats = dynamic(
  () => import("@/components/interface/homescreen/stats"),
  { ssr: true }
);
const Brands = dynamic(
  () => import("@/components/interface/homescreen/brands"),
  { ssr: true }
);
const HowItWorks = dynamic(
  () => import("@/components/interface/homescreen/how-it-works"),
  { ssr: true }
);
const CallToAction = dynamic(
  () => import("@/components/interface/homescreen/cta"),
  { ssr: true }
);
const Footer = dynamic(
  () => import("@/components/interface/homescreen/footer"),
  { ssr: true }
);

export default async function ShaderShowcase() {
  const [flags, githubStats] = await Promise.all([
    getExperiments(),
    getGitHubStats(),
  ]);

  if (flags["fuhThisShit"]) {
    return <p>Fuh all this</p>;
  }

  return (
    <ShaderBackground>
      <div className="relative min-h-svh flex flex-col">
        <Header />
        <div className="grow relative w-full">
          <HeroContent />
          <LaunchWrapper>
            <ScrollIndicator />
          </LaunchWrapper>
        </div>
      </div>

      <LaunchWrapper>
        <div
          id="content-start"
          className="relative z-10"
        >
          <Stats
            initialStats={{
              commits: githubStats.commits,
              stars: githubStats.stars,
              contributors: githubStats.contributors,
            }}
          />
          <Features />
          <Brands />
          <HowItWorks />
          <CallToAction />
        </div>
      </LaunchWrapper>

      <Footer />
    </ShaderBackground>
  );
}