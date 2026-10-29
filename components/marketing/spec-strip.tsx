const SPECS = [
  "Reverse proxy",
  "DNS records",
  "Automatic TLS",
  "WAF rules",
  "Access policies",
  "Traffic analytics",
  "Alerts",
  "Edge agents",
];

/**
 * One mono line naming what the panel actually covers. It doubles as the seam
 * between the hero and the rest of the page: a swipeable strip on phones, a
 * centered line from `sm` up.
 */
export function SpecStrip() {
  return (
    <section
      aria-label="What NetGoat covers"
      className="border-y bg-muted/30"
    >
      <div className="mx-auto flex w-full max-w-[75rem] items-center gap-3 overflow-x-auto px-5 py-3.5 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-2 sm:overflow-x-visible md:px-6 [&::-webkit-scrollbar]:hidden">
        {SPECS.map((spec, index) => (
          <span
            key={spec}
            className="flex shrink-0 items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
          >
            {index > 0 ? (
              <span
                aria-hidden
                className="size-1 rounded-full bg-foreground/20"
              />
            ) : null}
            {spec}
          </span>
        ))}
      </div>
    </section>
  );
}
