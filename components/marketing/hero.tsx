import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { PanelFrame } from "@/components/marketing/panel-frame";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="edge-grid pointer-events-none absolute inset-x-0 top-0 h-[32rem]"
      />

      <div className="relative mx-auto w-full max-w-[75rem] px-5 pt-10 md:px-6 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="hero-rise mt-5 text-balance font-heading text-[clamp(2.125rem,6vw,4.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] sm:leading-[1.03]">
            Own the edge between your users and your origin.
          </h1>

          <p
            className="hero-rise mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-[1.6] text-muted-foreground sm:mt-6 sm:text-[17px]"
            style={{ animationDelay: "40ms" }}
          >
            NetGoat is a self-hosted control plane for reverse proxy routes, DNS,
            automatic TLS, a readable WAF and live traffic analytics. One
            deployment you run, one panel you own.
          </p>

          <div
            className="hero-rise mt-7 flex flex-col items-stretch gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
            style={{ animationDelay: "80ms" }}
          >
            <Button size="lg" render={<Link href="/auth/register" />}>
              Get started
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#features" />}
            >
              See what is in the panel
            </Button>
          </div>
        </div>

        <div
          className="hero-rise relative mt-10 md:mt-16"
          style={{ animationDelay: "160ms" }}
        >
          <PanelFrame />
        </div>
      </div>
    </section>
  );
}
