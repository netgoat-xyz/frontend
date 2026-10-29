import Image from "next/image";

import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

/**
 * Logos arrive as 400×400 app-icon squares (or a transparent mark, in
 * Tailscale's case), so each one is framed as a tile: full-bleed for the
 * squares, on white for the transparent PNG.
 */
const INTEGRATIONS = [
  {
    name: "Cloudflare",
    logo: "/integrations/cloudflare.jpeg",
    line: "Mirror a zone and move traffic over gradually.",
    tile: "full",
  },
  {
    name: "Tailscale",
    logo: "/integrations/tailscale.png",
    line: "Reach origins on your tailnet, no public ports.",
    tile: "light",
  },
  {
    name: "AWS",
    logo: "/integrations/aws.jpeg",
    line: "Put ALB and CloudFront origins behind the rules.",
    tile: "full",
  },
  {
    name: "Google Cloud",
    logo: "/integrations/gcp.jpeg",
    line: "Front Cloud Run services with the same pipeline.",
    tile: "full",
  },
  {
    name: "Sentry",
    logo: "/integrations/sentry.jpeg",
    line: "Forward edge errors with route context attached.",
    tile: "full",
  },
  {
    name: "Grafana",
    logo: "/integrations/grafana.jpeg",
    line: "Scrape request, cache and WAF metrics.",
    tile: "full",
  },
  {
    name: "ngrok",
    logo: "/integrations/ngrok.jpeg",
    line: "Give a local tunnel a stable hostname.",
    tile: "full",
  },
] as const;

export function IntegrationWall() {
  return (
    <section id="integrations" className="scroll-mt-20 border-b">
      <div className="mx-auto w-full max-w-[75rem] px-5 py-16 md:px-6 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Integrations"
            title="Keep the rest of your stack."
            lede="NetGoat sits in front of what you already run. These are the integrations wired into the panel today."
          />
        </Reveal>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map((integration, index) => (
            <li key={integration.name} className="bg-card">
              <Reveal delay={Math.min(index * 40, 160)} className="flex h-full">
                <div className="flex h-full w-full flex-col gap-3 p-5">
                  {integration.tile === "light" ? (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border bg-white p-1.5">
                      <Image
                        src={integration.logo}
                        alt=""
                        width={36}
                        height={36}
                        className="size-full object-contain"
                      />
                    </span>
                  ) : (
                    <Image
                      src={integration.logo}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded-[10px] object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-heading text-sm font-semibold tracking-tight">
                      {integration.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-[1.55] text-muted-foreground">
                      {integration.line}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}

          <li className="bg-muted/40">
            <div className="flex h-full flex-col justify-center gap-2 p-5">
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Didn&apos;t see yours?
              </p>
              <p className="text-sm leading-[1.55] text-muted-foreground">
                Anything that speaks HTTP sits behind NetGoat. The agent is open
                source under AGPL-3.0, so wire up the rest yourself.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
