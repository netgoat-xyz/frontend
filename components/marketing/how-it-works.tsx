import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

const STEPS = [
  {
    title: "Add the domain",
    body: "Create it in the panel and NetGoat hands you one TXT record. When DNS answers, the domain flips to verified on its own.",
  },
  {
    title: "Point it at an origin",
    body: "An address like 10.0.0.4:8080 is enough to start. Add a pool for failover, then split traffic with routes and subdomains.",
  },
  {
    title: "Watch it hold",
    body: "The edge issues TLS, applies WAF rules with the next snapshot, and reports requests, blocked share and bandwidth back to the panel.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b">
      <div className="mx-auto w-full max-w-[75rem] px-5 py-16 md:px-6 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Three steps between a hostname and your origin."
          />
        </Reveal>

        <ol className="relative mt-10 grid gap-8 md:mt-12 md:grid-cols-3 md:gap-8">
          {/* The wire: it runs down the steps on phones and across them from md. */}
          <div
            aria-hidden
            className="absolute top-1 bottom-1 left-[5px] w-px bg-border md:hidden"
          />
          <div
            aria-hidden
            className="wire-draw absolute top-[5px] right-0 left-0 hidden h-px bg-border md:block"
          />

          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <Reveal delay={index * 40} className="relative pl-7 md:pl-0">
                <span
                  aria-hidden
                  className="absolute top-[3px] left-0 z-10 size-[11px] rounded-full border-2 border-background bg-success md:static md:top-auto md:block"
                />
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase md:mt-5">
                  {`Step ${index + 1}`}
                </p>
                <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-sm text-sm leading-[1.6] text-muted-foreground">
                  {step.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
