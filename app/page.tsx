import dynamic from "next/dynamic";
import React from "react";

import Header from "@/components/interface/homescreen/header";
import HeroContent from "@/components/interface/homescreen/hero-content";
import ShaderBackground from "@/components/interface/homescreen/shader-background";
import ScrollIndicator from "@/components/interface/homescreen/scroll-indicator";
import { getExperiments } from "@/actions/experiments";

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
  const flags = await getExperiments();
  if (flags["fuhThisShit"]) {
    return <p>Fuh all this</p>;
  }

  return (
    <ShaderBackground>
      {/* Hero — full viewport */}
      <div className="relative h-screen flex flex-col">
        <Header />
        <div className="grow relative w-full">
          <HeroContent />
          <ScrollIndicator />
        </div>
      </div>

      {/* Below-the-fold content */}
      <div
        id="content-start"
        className="relative z-10 bg-black/30 backdrop-blur-3xl"
      >
        <Stats />
        <Features />
        <Brands />
        <HowItWorks />
        <CallToAction />
        <Footer />
      </div>
    </ShaderBackground>
  );
}