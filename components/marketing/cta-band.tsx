import { ArrowRight01Icon, Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/netgoat-xyz/netgoat";

export function CtaBand() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="edge-grid pointer-events-none absolute inset-x-0 bottom-0 h-[24rem] rotate-180"
      />
      <div className="relative mx-auto w-full max-w-[75rem] px-5 py-20 md:px-6 md:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
              Put the goat on the wire.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
              Bring up the stack, add a domain and watch the first request land
              in the panel. It takes about as long as reading this page.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
              <Button size="lg" render={<Link href="/auth/register" />}>
                Get started
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer" />
                }
              >
                <HugeiconsIcon icon={Github01Icon} aria-hidden />
                Read the code
              </Button>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              AGPL-3.0 · self-hosted · no telemetry
            </p>
          </div>
        </Reveal>
      </div>

      {/* One request crossing the seam before the footer. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border">
        <span className="wire-sweep absolute top-1/2 -ml-[3px] size-1.5 -translate-y-1/2 rounded-full bg-success shadow-[0_0_8px_2px] shadow-success/30" />
      </div>
    </section>
  );
}
