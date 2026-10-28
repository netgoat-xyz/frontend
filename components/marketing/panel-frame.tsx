import { LockPasswordIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const DESKTOP = {
  light: { src: "/marketing/panel-light.png", width: 2608, height: 1920 },
  dark: { src: "/marketing/panel-dark.png", width: 2608, height: 1920 },
} as const;

const MOBILE = {
  light: { src: "/marketing/panel-mobile-light.png", width: 780, height: 1688 },
  dark: { src: "/marketing/panel-mobile-dark.png", width: 780, height: 1688 },
} as const;

/** The panel on a laptop: a browser frame cut off at the bottom edge. */
function BrowserFrame() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl shadow-black/8 dark:shadow-black/40">
      <div className="flex h-10 items-center gap-3 border-b bg-muted/40 px-3.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/12" />
          <span className="size-2.5 rounded-full bg-foreground/12" />
          <span className="size-2.5 rounded-full bg-foreground/12" />
        </span>
        <span className="mx-auto flex h-6 items-center gap-1.5 rounded-md border bg-background px-2.5 font-mono text-[11px] text-muted-foreground">
          <HugeiconsIcon
            icon={LockPasswordIcon}
            className="size-3 opacity-70"
            aria-hidden
          />
          netgoat.local/dashboard
        </span>
        <span aria-hidden className="w-10" />
      </div>

      <div className="relative h-[22rem] overflow-hidden md:h-[30rem]">
        <Image
          src={DESKTOP.light.src}
          alt="The NetGoat panel showing a verified domain, its request counters and the WAF, TLS, access and routing cards."
          width={DESKTOP.light.width}
          height={DESKTOP.light.height}
          sizes="(min-width: 1200px) 1152px, 100vw"
          className="w-full dark:hidden"
        />
        <Image
          src={DESKTOP.dark.src}
          alt=""
          aria-hidden
          width={DESKTOP.dark.width}
          height={DESKTOP.dark.height}
          sizes="(min-width: 1200px) 1152px, 100vw"
          priority
          className="hidden w-full dark:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"
        />
      </div>
    </div>
  );
}

/** The same panel on a phone, for readers who are holding one. */
function PhoneFrame() {
  return (
    <div className="mx-auto w-full max-w-[17rem]">
      <div className="rounded-[2.5rem] border bg-card p-2 shadow-2xl shadow-black/20 dark:shadow-black/50">
        <div className="relative overflow-hidden rounded-[1.9rem] border bg-background">
          <Image
            src={MOBILE.light.src}
            alt="The NetGoat panel on a phone: the domain header, its status chips and the request, blocked, bandwidth and subdomain counters."
            width={MOBILE.light.width}
            height={MOBILE.light.height}
            sizes="272px"
            className="w-full dark:hidden"
          />
          <Image
            src={MOBILE.dark.src}
            alt=""
            aria-hidden
            width={MOBILE.dark.width}
            height={MOBILE.dark.height}
            sizes="272px"
            priority
            className="hidden w-full dark:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The signature of the landing page: real screenshots of this panel in device
 * frames. The light and dark captures are the same page in the same build; only
 * the theme differs, so the figure can swap with it.
 */
export function PanelFrame({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div className="hidden md:block">
        <BrowserFrame />
      </div>
      <div className="md:hidden">
        <PhoneFrame />
      </div>
    </figure>
  );
}
