import { CheckCircle2, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogPublisher, PluginManifest } from "./pluginTypes";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.trim().toLowerCase();
  const tone = normalized === "approved" || normalized === "published" || normalized === "enabled" || normalized === "verified" || normalized === "deployed"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : normalized === "submitted" || normalized === "pending"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : normalized === "rejected" || normalized === "revoked" || normalized === "suspended"
        ? "border-red-400/30 bg-red-400/10 text-red-300"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", tone, className)}>
      {normalized || "draft"}
    </Badge>
  );
}

export function PublisherTrustBadge({ publisher, compact = false }: { publisher: CatalogPublisher | null; compact?: boolean }) {
  if (!publisher) return null;
  const verified = publisher.verificationStatus === "verified";

  return (
    <div className="flex min-w-0 items-center gap-2">
      {verified ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-300" aria-label="Verified publisher" />
      ) : null}
      <span className={cn("truncate text-sm font-medium", compact && "text-xs")}>{publisher.displayName || publisher.slug || "Publisher"}</span>
      {verified ? <span className="sr-only">Verified publisher</span> : null}
    </div>
  );
}

export function CredibilityScore({ publisher, detailed = false }: { publisher: CatalogPublisher | null; detailed?: boolean }) {
  if (!publisher) return null;
  const score = Math.max(0, Math.min(100, publisher.credibilityScore));
  const color = score >= 70 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-neutral-400";

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Publisher credibility</span>
        <span className="font-medium tabular-nums text-foreground">{score}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      {detailed ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Informational only: verification +{publisher.credibilityBreakdown.verification}, approved releases +{publisher.credibilityBreakdown.releases}, active installs +{publisher.credibilityBreakdown.installations}, review adjustments −{publisher.credibilityBreakdown.reviewPenalty}. A score never grants runtime permissions.
        </p>
      ) : null}
    </div>
  );
}

export function CopyValue({ value, label = "Copy value" }: { value: string; label?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy this value");
    }
  };

  return (
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={label} onClick={copy}>
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}

export function ManifestSummary({ manifest }: { manifest: PluginManifest }) {
  return (
    <div className="rounded-lg border bg-input/20 p-3 font-mono text-xs leading-5 text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span><span className="text-foreground/75">factory</span> {manifest.factoryId || "—"}</span>
        <span><span className="text-foreground/75">api</span> {manifest.apiVersion || "—"}</span>
      </div>
      <div className="mt-1.5 break-words"><span className="text-foreground/75">capabilities</span> {manifest.capabilities.length ? manifest.capabilities.join(", ") : "none"}</div>
    </div>
  );
}

export function RuntimeSafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-sky-50", compact && "p-3 text-xs") }>
      <div className="flex gap-3">
        <ShieldAlert className={cn("mt-0.5 h-4 w-4 shrink-0 text-sky-300", compact && "h-3.5 w-3.5")} />
        <p className="leading-5 text-sky-100/85">
          Plugin releases are descriptors for middleware factories already compiled into the NetGoat agent. Source code, URLs, binaries, modules, and arbitrary artifacts are never accepted or executed from this catalog.
        </p>
      </div>
    </div>
  );
}

export function PublisherLinks({ publisher }: { publisher: CatalogPublisher | null }) {
  if (!publisher || (!publisher.websiteUrl && !publisher.supportUrl)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {publisher.websiteUrl ? <a className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")} href={publisher.websiteUrl} target="_blank" rel="noreferrer">Website <ExternalLink className="ml-1.5 h-3 w-3" /></a> : null}
      {publisher.supportUrl ? <a className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")} href={publisher.supportUrl} target="_blank" rel="noreferrer">Support <ExternalLink className="ml-1.5 h-3 w-3" /></a> : null}
    </div>
  );
}
