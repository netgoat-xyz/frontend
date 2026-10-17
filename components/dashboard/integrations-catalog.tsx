"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Category = "cloud" | "networking" | "monitoring" | "observability";

type Integration = {
  key: string;
  name: string;
  category: Category;
  logo: string;
  description: string;
  details: string;
};

const CATEGORY_LABELS: Record<Category | "all", string> = {
  all: "All",
  cloud: "Cloud",
  networking: "Networking",
  monitoring: "Monitoring",
  observability: "Observability",
};

const INTEGRATIONS: Integration[] = [
  {
    key: "cloudflare",
    name: "Cloudflare",
    category: "networking",
    logo: "/integrations/cloudflare.jpeg",
    description:
      "Mirror existing Cloudflare DNS zones so NetGoat can take over traffic gradually.",
    details:
      "Import records from a Cloudflare zone, keep TTLs and proxied flags, then flip nameservers when you are ready. Records stay in sync while both providers are active.",
  },
  {
    key: "sentry",
    name: "Sentry",
    category: "monitoring",
    logo: "/integrations/sentry.jpeg",
    description:
      "Forward edge errors to Sentry with domain and route context attached.",
    details:
      "Every 5xx or upstream failure is sent with the request host, matched route and trace id, so stack traces line up with real traffic instead of synthetic probes.",
  },
  {
    key: "grafana",
    name: "Grafana",
    category: "observability",
    logo: "/integrations/grafana.jpeg",
    description:
      "Scrape request, cache and WAF metrics from NetGoat into your dashboards.",
    details:
      "NetGoat exposes a Prometheus-compatible metrics endpoint at the edge. Point your Grafana Agent or Prometheus scrape config at it and build dashboards on the same series the panel uses.",
  },
  {
    key: "tailscale",
    name: "Tailscale",
    category: "networking",
    logo: "/integrations/tailscale.png",
    description:
      "Keep origins on your tailnet — NetGoat reaches them without public exposure.",
    details:
      "Register a tailnet node as an origin connector. Upstreams resolve over WireGuard, so private services stay private while the public hostname is still fronted by WAF and caching.",
  },
  {
    key: "gcp",
    name: "Google Cloud",
    category: "cloud",
    logo: "/integrations/gcp.jpeg",
    description:
      "Front Cloud Run and GCLB origins with the full NetGoat request pipeline.",
    details:
      "Add a Cloud Run service URL or a Google Cloud Load Balancer as origin. Health checks, retries and timeout policies apply before traffic reaches your VPC.",
  },
  {
    key: "aws",
    name: "AWS",
    category: "cloud",
    logo: "/integrations/aws.jpeg",
    description:
      "Put ALB, NLB and CloudFront distributions behind NetGoat rules and analytics.",
    details:
      "Keep your existing load balancers as origins and layer WAF rules, rate limits and request analytics in front. Signed origin headers are generated for private upstreams.",
  },
  {
    key: "ngrok",
    name: "ngrok",
    category: "networking",
    logo: "/integrations/ngrok.jpeg",
    description:
      "Point a stable development hostname at a local ngrok tunnel.",
    details:
      "Handy for webhooks and demos: keep the production domain on the same endpoints, but route a preview subdomain to your ngrok tunnel while you iterate locally.",
  },
];

/** Searchable catalog of integrations with detail dialogs. */
export function IntegrationsCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selected, setSelected] = useState<Integration | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INTEGRATIONS.filter((integration) => {
      const matchesCategory =
        category === "all" || integration.category === category;
      const matchesQuery =
        !needle ||
        integration.name.toLowerCase().includes(needle) ||
        integration.description.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-3 flex items-center">
            <HugeiconsIcon icon={Search01Icon} className="size-4" />
          </span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search integrations"
            aria-label="Search integrations"
            className="ps-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as Array<Category | "all">).map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={cn(
                  "focus-visible:ring-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                  category === key
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {CATEGORY_LABELS[key]}
              </button>
            ),
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No integrations match “{query}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((integration) => (
            <button
              key={integration.key}
              type="button"
              onClick={() => setSelected(integration)}
              className="bg-card hover:border-foreground/20 focus-visible:ring-ring flex flex-col gap-3 rounded-xl border p-4 text-start transition-colors outline-none focus-visible:ring-2"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={integration.logo}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-md object-cover"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {integration.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {CATEGORY_LABELS[integration.category]}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {integration.description}
              </p>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogPopup className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Image
                    src={selected.logo}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-lg object-cover"
                  />
                  <div className="flex flex-col">
                    <DialogTitle>{selected.name}</DialogTitle>
                    <DialogDescription>
                      {CATEGORY_LABELS[selected.category]}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="ms-auto">
                    Preview
                  </Badge>
                </div>
              </DialogHeader>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {selected.details}
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  render={<a href="mailto:support@netgoat.dev?subject=Integration%20access" />}
                >
                  Request early access
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogPopup>
      </Dialog>
    </>
  );
}
