import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { IntegrationWall } from "@/components/marketing/integration-wall";
import { SelfHost } from "@/components/marketing/self-host";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const TITLE =
  "NetGoat — reverse proxy, DNS, TLS and WAF in one panel you own";
const DESCRIPTION =
  "A self-hosted edge panel: reverse proxy routes, DNS records, automatic TLS, a readable WAF and live traffic analytics. Run it on your own hardware.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NetGoat",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",
  description: DESCRIPTION,
  url: "/",
};

export default function LandingPage() {
  return (
    <div data-marketing className="relative min-h-svh">
      <div
        data-marketing-top
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
      />
      <SiteHeader />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <SelfHost />
        <IntegrationWall />
        <CtaBand />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
    </div>
  );
}
