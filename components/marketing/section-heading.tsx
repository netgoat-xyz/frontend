import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The small mono label that opens a section, hung off a short piece of the
 * wire. It is the one piece of chrome every marketing section shares.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      <span aria-hidden className="h-px w-6 shrink-0 bg-border" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-balance font-heading text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
          {lede}
        </p>
      ) : null}
      {children}
    </div>
  );
}
