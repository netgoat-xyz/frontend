import {
  CloudServerIcon,
  Database02Icon,
  ServerStack01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CopyButton } from "@/components/dashboard/copy-button";
import { Reveal } from "@/components/marketing/reveal";
import { Eyebrow } from "@/components/marketing/section-heading";

const COMMAND = `git clone https://github.com/netgoat-xyz/netgoat
cd netgoat && cp .env.example .env
./scripts/generate-secrets.sh >> .env
docker compose up --build`;

const POINTS = [
  {
    icon: Database02Icon,
    title: "The database is yours",
    body: "Domains, routes, rules and analytics live in your own MongoDB. Nothing is mirrored to us because there is no us in the request path.",
  },
  {
    icon: CloudServerIcon,
    title: "Origins stay private",
    body: "Edge agents dial out to the panel and pick up snapshots, so origins behind NAT, a tunnel or a tailnet never need an inbound port.",
  },
  {
    icon: ServerStack01Icon,
    title: "It keeps serving without the panel",
    body: "Each agent holds its last known-good configuration and its local routes. If the control plane goes away, traffic keeps flowing on the rules it already has.",
  },
];

export function SelfHost() {
  return (
    <section id="self-host" className="scroll-mt-20 border-b">
      <div className="mx-auto grid w-full max-w-[75rem] gap-12 px-5 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="min-w-0">
          <Eyebrow>Self-host</Eyebrow>
          <h2 className="mt-4 text-balance font-heading text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Run it on hardware you already pay for.
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
            The whole stack ships as one compose file: control plane, panel and
            the Mongo it writes to. Secrets are generated on your machine, not
            handed to you by someone else&apos;s dashboard.
          </p>

          <ul className="mt-8 flex flex-col gap-6">
            {POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
                  <HugeiconsIcon icon={point.icon} className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold tracking-tight">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-[1.6] text-muted-foreground">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-start gap-2 text-sm text-muted-foreground sm:items-center">
            <HugeiconsIcon
              icon={Tick02Icon}
              className="mt-0.5 size-4 shrink-0 text-success sm:mt-0"
              aria-hidden
            />
            Docker and Docker Compose are the only requirements beyond the
            checkout.
          </p>
        </Reveal>

        <Reveal delay={40} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border bg-code text-code-foreground shadow-sm">
            <div className="flex h-10 items-center justify-between border-b px-3.5">
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                self-host
              </span>
              <CopyButton value={COMMAND} label="commands" />
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.85] sm:px-5 sm:text-[13px] sm:leading-[1.9]">
              <code>
                {COMMAND.split("\n").map((line, index) => (
                  <span
                    key={line}
                    className="block whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal"
                  >
                    <span
                      aria-hidden
                      className="mr-3 text-muted-foreground/60 select-none"
                    >
                      {index === 0 ? "$" : ">"}
                    </span>
                    {line}
                  </span>
                ))}
              </code>
            </pre>
            <div className="border-t px-4 py-3.5 font-mono text-[11px] text-muted-foreground sm:px-5">
              panel on localhost:3000 · agent on :8080 · mongo on :27017
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
