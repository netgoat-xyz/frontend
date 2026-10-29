import {
  AnalyticsUpIcon,
  Globe02Icon,
  PlusSignIcon,
  Route01Icon,
  Shield01Icon,
  SquareLock01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import type * as React from "react";

import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CardBody({
  icon,
  title,
  description,
  children,
  className,
  bodyClassName,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden transition-[border-color,box-shadow] duration-(--duration-quick) ease-(--ease-smooth-out) hover:border-foreground/16 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <span className="flex size-7 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
          <HugeiconsIcon icon={icon} className="size-4" aria-hidden />
        </span>
        <h3 className="font-heading text-[15px] font-semibold tracking-tight">
          {title}
        </h3>
      </div>
      <p className="px-5 pt-2.5 text-sm leading-[1.55] text-muted-foreground">
        {description}
      </p>
      <div
        className={cn(
          "mt-5 flex-1 border-t bg-muted/30 px-5 py-4",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Card>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] tracking-tight text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * A real capture of the panel, cropped to a region. The frame owns the aspect
 * ratio (mobile crops in tighter than desktop) and the image covers it, so a
 * capture can never stretch or leave a gap.
 */
function Screenshot({
  light,
  dark,
  alt,
  sizes,
  className,
}: {
  light: string;
  dark: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-background",
        className,
      )}
    >
      <Image
        src={light}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover object-left-top dark:hidden"
      />
      <Image
        src={dark}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        className="hidden object-cover object-left-top dark:block"
      />
    </div>
  );
}

const ROUTES = [
  { match: "/api/*", upstream: "api-pool", note: "2 upstreams" },
  { match: "/assets/*", upstream: "static-cache", note: "cache 1h" },
  { match: "default", upstream: "10.0.0.4:8080", note: "fallback" },
];

function RouteRows() {
  return (
    <ul className="flex flex-col gap-2">
      {ROUTES.map((route) => (
        <li key={route.match} className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-success"
          />
          <Mono>{route.match}</Mono>
          <span aria-hidden className="h-px flex-1 bg-border" />
          <Mono>{route.upstream}</Mono>
          <span className="hidden font-mono text-[10px] text-muted-foreground/70 sm:inline">
            {route.note}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CertificateBar() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Mono>api.example.com</Mono>
        <span className="rounded-full bg-success/12 px-2 py-0.5 font-mono text-[10px] text-success-foreground">
          renews in 49d
        </span>
      </div>
      <div
        aria-hidden
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/8"
      >
        <div className="h-full w-[82%] rounded-full bg-success" />
      </div>
      <div className="mt-2 flex justify-between">
        <Mono>issued 41d ago</Mono>
        <Mono>renewals are automatic</Mono>
      </div>
    </div>
  );
}

function AnalyticsSpark() {
  return (
    <div>
      <svg
        viewBox="0 0 320 84"
        className="h-20 w-full text-success"
        role="img"
        aria-label="Requests and blocked traffic over time"
        preserveAspectRatio="none"
      >
        <path
          d="M0 66 L24 60 L48 62 L72 48 L96 52 L120 38 L144 44 L168 30 L192 34 L216 22 L240 26 L264 16 L288 20 L320 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 66 L24 60 L48 62 L72 48 L96 52 L120 38 L144 44 L168 30 L192 34 L216 22 L240 26 L264 16 L288 20 L320 10 L320 84 L0 84 Z"
          className="fill-current opacity-10"
        />
      </svg>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          <Mono>requests</Mono>
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-destructive" />
          <Mono>blocked</Mono>
        </span>
      </div>
    </div>
  );
}

const MEMBERS = [
  { name: "you@example.com", role: "Owner" },
  { name: "sre@example.com", role: "Admin" },
  { name: "ops@example.com", role: "Member" },
];

function MemberRows() {
  return (
    <ul className="flex flex-col gap-2">
      {MEMBERS.map((member) => (
        <li key={member.name} className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-full border bg-background"
          />
          <Mono>{member.name}</Mono>
          <span className="ml-auto rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {member.role}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-20 border-b">
      <div className="mx-auto w-full max-w-[75rem] px-5 py-16 md:px-6 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="The whole edge in one panel."
            lede="Everything between DNS and your origin, wired together: routes, certificates, rules and the traffic they produce."
          />
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Reveal className="flex">
            <CardBody
              icon={Route01Icon}
              title="Routes you can reason about"
              description="Match on path, host or header and send the request to a pool. When an upstream goes quiet, the next one in the pool takes the connection."
              className="w-full"
            >
              <RouteRows />
            </CardBody>
          </Reveal>

          <Reveal delay={40} className="flex">
            <CardBody
              icon={SquareLock01Icon}
              title="TLS that renews itself"
              description="Certificates are issued and rotated at the edge. The panel shows what is live, what it covers and when it turns over."
              className="w-full"
            >
              <CertificateBar />
            </CardBody>
          </Reveal>

          <Reveal delay={80} className="flex">
            <CardBody
              icon={AnalyticsUpIcon}
              title="Traffic you can watch"
              description="Requests, blocked share and bandwidth per domain, fed by the edge. Spikes become alerts on the activity timeline."
              className="w-full"
            >
              <AnalyticsSpark />
            </CardBody>
          </Reveal>

          <Reveal className="flex md:col-span-2" delay={0}>
            <CardBody
              icon={Shield01Icon}
              title="A WAF with readable rules"
              description="Match method, path, header or address, then block, challenge or log. Rules stream to the edge with the next snapshot."
              className="w-full"
            >
              <Screenshot
                light="/marketing/waf-card-light.png"
                dark="/marketing/waf-card-dark.png"
                alt="The WAF tab: a rule named Block admin posts matching POST requests to /admin, and the form used to add more."
                sizes="(min-width: 1024px) 720px, 100vw"
                className="aspect-[16/10] sm:aspect-[1300/510]"
              />
            </CardBody>
          </Reveal>

          <Reveal delay={40} className="flex">
            <CardBody
              icon={UserGroupIcon}
              title="Personal or team"
              description="Start alone, add teammates when it matters. Every write in the workspace is guarded and recorded in the activity timeline."
              className="w-full"
              bodyClassName="flex flex-col"
            >
              <MemberRows />
              <p className="mt-auto flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  className="size-3.5"
                  aria-hidden
                />
                Invite a teammate by email
              </p>
            </CardBody>
          </Reveal>

          <Reveal className="flex md:col-span-2 lg:col-span-3" delay={0}>
            <CardBody
              icon={Globe02Icon}
              title="DNS you can read back"
              description="Records written from the panel, listed with their TTL, proxied flag and live status. Verification for a new domain is one TXT record."
              className="w-full"
            >
              <Screenshot
                light="/marketing/dns-card-light.png"
                dark="/marketing/dns-card-dark.png"
                alt="The DNS tab: an A record for api.example.com pointing at 203.0.113.10, proxied, marked live, with the actions to refresh or delete it."
                sizes="(min-width: 1024px) 1120px, 100vw"
                className="aspect-[16/9] sm:aspect-[2624/600]"
              />
            </CardBody>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
