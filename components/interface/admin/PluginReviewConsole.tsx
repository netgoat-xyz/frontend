"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  PackageCheck,
  RefreshCw,
  Rocket,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  deployApprovedPluginRelease,
  getDeployedPluginSnapshot,
  listPluginReviewQueue,
  removeDeployedPluginRelease,
  reviewPluginPublisherVerification,
  reviewPluginRelease,
} from "@/actions/developerPlugins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatDate,
  toDeploymentList,
  toPlugin,
  toReviewQueue,
  type CatalogPublisher,
  type CatalogRelease,
  type PluginDeployment,
  type PluginReviewQueue,
} from "../developers/pluginTypes";
import {
  CopyValue,
  CredibilityScore,
  ManifestSummary,
  PublisherLinks,
  PublisherTrustBadge,
  RuntimeSafetyNotice,
  StatusBadge,
} from "../developers/pluginUi";

type ServerAction = (...args: unknown[]) => Promise<unknown>;

function invoke(action: unknown, ...args: unknown[]): Promise<unknown> {
  return (action as ServerAction)(...args);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

type ReviewTarget =
  | { kind: "publisher"; publisher: CatalogPublisher }
  | { kind: "release"; release: CatalogRelease & { plugin: ReturnType<typeof toPlugin> | null; publisher: CatalogPublisher | null } }
  | null;

export default function PluginReviewConsole() {
  const [queue, setQueue] = useState<PluginReviewQueue>({ publishers: [], releases: [] });
  const [deployments, setDeployments] = useState<PluginDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);
  const [reviewDecision, setReviewDecision] = useState<"verified" | "rejected" | "approved" | "revoked">("verified");
  const [reviewNote, setReviewNote] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [queueResult, deploymentsResult] = await Promise.allSettled([
        invoke(listPluginReviewQueue),
        invoke(getDeployedPluginSnapshot),
      ]);

      if (queueResult.status === "fulfilled") {
        setQueue(toReviewQueue(queueResult.value));
      } else {
        toast.error(errorMessage(queueResult.reason, "Could not load the plugin review queue."));
      }

      if (deploymentsResult.status === "fulfilled") {
        setDeployments(toDeploymentList(deploymentsResult.value));
      } else {
        toast.error(errorMessage(deploymentsResult.reason, "Could not load the deployed plugin snapshot."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredDeployments = useMemo(() => {
    const query = factoryFilter.trim().toLowerCase();
    if (!query) return deployments;
    return deployments.filter((deployment) => [
      deployment.factoryId,
      deployment.plugin?.name,
      deployment.plugin?.slug,
      deployment.version,
    ].join(" ").toLowerCase().includes(query));
  }, [deployments, factoryFilter]);

  const openPublisherReview = (publisher: CatalogPublisher, decision: "verified" | "rejected") => {
    setReviewTarget({ kind: "publisher", publisher });
    setReviewDecision(decision);
    setReviewNote(publisher.verificationNote || "");
  };

  const openReleaseReview = (release: PluginReviewQueue["releases"][number], decision: "approved" | "rejected" | "revoked") => {
    setReviewTarget({ kind: "release", release });
    setReviewDecision(decision === "revoked" && release.status === "submitted" ? "rejected" : decision);
    setReviewNote(release.reviewNote || "");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    const targetId = reviewTarget.kind === "publisher" ? reviewTarget.publisher.id : reviewTarget.release.id;
    if (!targetId) {
      toast.error("This review target has no identifier.");
      return;
    }
    setSaving(`review-${targetId}`);
    try {
      if (reviewTarget.kind === "publisher") {
        await invoke(reviewPluginPublisherVerification, {
          publisher_id: targetId,
          decision: reviewDecision === "verified" ? "verify" : "reject",
          note: reviewNote.trim(),
        });
        toast.success(reviewDecision === "verified" ? "Publisher verified." : "Publisher verification rejected.");
      } else {
        await invoke(reviewPluginRelease, {
          release_id: targetId,
          decision: reviewDecision === "approved" ? "approve" : reviewDecision === "rejected" ? "reject" : "revoke",
          note: reviewNote.trim(),
        });
        toast.success(reviewDecision === "approved" ? "Release approved." : reviewDecision === "rejected" ? "Release rejected." : "Release revoked.");
      }
      setReviewTarget(null);
      await refresh(true);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this review decision."));
    } finally {
      setSaving(null);
    }
  };

  const deployRelease = async (release: PluginReviewQueue["releases"][number]) => {
    if (!release.id) {
      toast.error("This release has no identifier.");
      return;
    }
    setSaving(`deploy-${release.id}`);
    try {
      await invoke(deployApprovedPluginRelease, { release_id: release.id });
      toast.success("Approved release deployed to the next agent snapshot.");
      await refresh(true);
    } catch (error) {
      toast.error(errorMessage(error, "Could not deploy this release."));
    } finally {
      setSaving(null);
    }
  };

  const removeDeployment = async (deployment: PluginDeployment) => {
    const releaseId = deployment.releaseId || deployment.release?.id;
    if (!releaseId) {
      toast.error("This deployment has no release identifier.");
      return;
    }
    setSaving(`remove-${releaseId}`);
    try {
      await invoke(removeDeployedPluginRelease, { plugin_id: deployment.pluginId });
      toast.success("Release removed from the deployed snapshot.");
      await refresh(true);
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this deployment."));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <ReviewConsoleSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100"><ClipboardCheck className="h-3.5 w-3.5 text-sky-300" /> Trust &amp; deployment review</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Plugin governance</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Review publisher identity claims, inspect immutable middleware descriptors, and deploy only releases backed by compiled agent capability.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh(true)} disabled={refreshing}><RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />Refresh queues</Button>
      </div>

      <RuntimeSafetyNotice />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Publisher reviews" value={queue.publishers.length} detail="Awaiting identity decision" icon={<ShieldCheck className="h-5 w-5" />} tone="sky" />
        <Metric title="Release reviews" value={queue.releases.filter((release) => release.status === "submitted").length} detail="Awaiting descriptor review" icon={<FileCheck2 className="h-5 w-5" />} tone="amber" />
        <Metric title="Deployed descriptors" value={deployments.length} detail="Included in agent snapshots" icon={<Rocket className="h-5 w-5" />} tone="emerald" />
      </div>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="bg-muted/50"><TabsTrigger value="reviews">Review queue</TabsTrigger><TabsTrigger value="deployments">Deployed snapshot</TabsTrigger></TabsList>
        <TabsContent value="reviews" className="mt-0 space-y-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <ReviewPublisherList publishers={queue.publishers} saving={saving} onReview={openPublisherReview} />
            <ReviewReleaseList releases={queue.releases} saving={saving} onReview={openReleaseReview} onDeploy={(release) => void deployRelease(release)} />
          </section>
        </TabsContent>
        <TabsContent value="deployments" className="mt-0 space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium">Authoritative deployed snapshot</h2><p className="mt-1 text-sm text-muted-foreground">Connected agents receive only this administratively curated set of approved built-in descriptor selections.</p></div><div className="w-full sm:w-72"><Label htmlFor="deployment-search" className="sr-only">Filter deployments</Label><Input id="deployment-search" value={factoryFilter} placeholder="Filter by factory or plugin" onChange={(event) => setFactoryFilter(event.target.value)} /></div></div>
          {filteredDeployments.length ? <div className="space-y-4">{filteredDeployments.map((deployment) => <DeploymentCard key={deployment.id || deployment.releaseId || deployment.factoryId} deployment={deployment} saving={saving} onRemove={() => void removeDeployment(deployment)} />)}</div> : <EmptyState title="No deployed descriptors" description="Approve a submitted release, then deploy it after confirming the compiled descriptor digest and capability set." />}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          {reviewTarget ? <ReviewDialog target={reviewTarget} decision={reviewDecision} note={reviewNote} saving={saving} onDecisionChange={setReviewDecision} onNoteChange={setReviewNote} onSubmit={() => void submitReview()} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ title, value, detail, icon, tone }: { title: string; value: number; detail: string; icon: React.ReactNode; tone: "sky" | "amber" | "emerald" }) {
  const colors = tone === "sky" ? "border-sky-400/25 bg-sky-400/10 text-sky-300" : tone === "amber" ? "border-amber-400/25 bg-amber-400/10 text-amber-300" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  return <Card className="border-border/60 bg-card/50"><CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2"><div><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><CardDescription className="mt-1 text-xs">{detail}</CardDescription></div><div className={cn("rounded-lg border p-2", colors)}>{icon}</div></CardHeader><CardContent><p className="text-3xl font-semibold tabular-nums">{value}</p></CardContent></Card>;
}

function ReviewPublisherList({ publishers, saving, onReview }: { publishers: CatalogPublisher[]; saving: string | null; onReview: (publisher: CatalogPublisher, decision: "verified" | "rejected") => void }) {
  return <Card className="border-border/60 bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-sky-300" /> Publisher verification</CardTitle><CardDescription>Verify the public identity and support information, not permissions or code trust.</CardDescription></CardHeader><CardContent className="space-y-4">{publishers.length ? publishers.map((publisher) => <div key={publisher.id || publisher.slug} className="space-y-4 rounded-xl border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><PublisherTrustBadge publisher={publisher} /><p className="mt-1 font-mono text-xs text-muted-foreground">{publisher.slug}</p>{publisher.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{publisher.description}</p> : null}</div><StatusBadge status={publisher.verificationStatus} /></div><CredibilityScore publisher={publisher} detailed /><PublisherLinks publisher={publisher} /><div className="flex flex-wrap gap-2 border-t border-border/50 pt-3"><Button type="button" size="sm" onClick={() => onReview(publisher, "verified")} disabled={Boolean(saving)}><CheckCircle2 className="mr-2 h-4 w-4" />Verify</Button><Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onReview(publisher, "rejected")} disabled={Boolean(saving)}><XCircle className="mr-2 h-4 w-4" />Reject</Button></div></div>) : <EmptyState title="No publisher reviews" description="Publisher verification requests will appear here." />}</CardContent></Card>;
}

function ReviewReleaseList({ releases, saving, onReview, onDeploy }: { releases: PluginReviewQueue["releases"]; saving: string | null; onReview: (release: PluginReviewQueue["releases"][number], decision: "approved" | "rejected" | "revoked") => void; onDeploy: (release: PluginReviewQueue["releases"][number]) => void }) {
  return <Card className="border-border/60 bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-sky-300" /> Immutable release review</CardTitle><CardDescription>Approve only descriptors known to be compiled into supported agents. The manifest hash is evidence; deployment pins the compiled descriptor hash.</CardDescription></CardHeader><CardContent className="space-y-4">{releases.length ? releases.map((release) => <div key={release.id || `${release.pluginId}-${release.version}`} className="space-y-4 rounded-xl border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-medium">{release.plugin?.name || release.plugin?.slug || "Plugin release"}</p><p className="mt-1 font-mono text-xs text-muted-foreground">v{release.version} · {release.manifest.factoryId || "unknown factory"}</p><div className="mt-2"><PublisherTrustBadge publisher={release.publisher} compact /></div></div><StatusBadge status={release.status} /></div>{release.changelog ? <p className="text-sm leading-6 text-muted-foreground">{release.changelog}</p> : null}<ManifestSummary manifest={release.manifest} /><DigestRow label="Compiled descriptor SHA-256" value={release.descriptorSha256} /><DigestRow label="Manifest SHA-256 (audit)" value={release.sha256} />{release.reviewNote ? <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/85">Review note: {release.reviewNote}</div> : null}<div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">{release.status === "submitted" ? <><Button type="button" size="sm" disabled={Boolean(saving)} onClick={() => onReview(release, "approved")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button><Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={Boolean(saving)} onClick={() => onReview(release, "revoked")}><XCircle className="mr-2 h-4 w-4" />Reject</Button></> : null}{release.status === "approved" ? <Button type="button" size="sm" disabled={saving === `deploy-${release.id}`} onClick={() => onDeploy(release)}>{saving === `deploy-${release.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}Deploy</Button> : null}{release.status === "approved" ? <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={Boolean(saving)} onClick={() => onReview(release, "revoked")}><CircleAlert className="mr-2 h-4 w-4" />Revoke</Button> : null}</div></div>) : <EmptyState title="No release reviews" description="Submitted immutable releases will appear here." />}</CardContent></Card>;
}

function DeploymentCard({ deployment, saving, onRemove }: { deployment: PluginDeployment; saving: string | null; onRemove: () => void }) {
  const release = deployment.release;
  const busy = saving === `remove-${deployment.releaseId}`;
  return <Card className="border-border/60 bg-card/50"><CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)_auto] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-medium">{deployment.plugin?.name || deployment.plugin?.slug || deployment.factoryId || "Plugin deployment"}</h3><StatusBadge status={deployment.status} /></div><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{deployment.factoryId || release?.manifest.factoryId || "Unknown factory"} · v{deployment.version || release?.version || "—"}</p><p className="mt-2 text-xs text-muted-foreground">Deployed {formatDate(deployment.deployedAt)}</p></div><div className="space-y-2"><DigestRow label="Descriptor SHA-256" value={deployment.sha256 || release?.descriptorSha256 || ""} />{release ? <ManifestSummary manifest={release.manifest} /> : null}</div><Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={busy} onClick={onRemove}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Remove</Button></CardContent></Card>;
}

function ReviewDialog({ target, decision, note, saving, onDecisionChange, onNoteChange, onSubmit }: { target: NonNullable<ReviewTarget>; decision: "verified" | "rejected" | "approved" | "revoked"; note: string; saving: string | null; onDecisionChange: (decision: "verified" | "rejected" | "approved" | "revoked") => void; onNoteChange: (note: string) => void; onSubmit: () => void }) {
  const isPublisher = target.kind === "publisher";
  const targetId = isPublisher ? target.publisher.id : target.release.id;
  const title = isPublisher ? "Review publisher verification" : "Review immutable release";
  const description = isPublisher ? "Record the evidence supporting the publisher identity decision. Verification never grants runtime access." : "Confirm the compiled descriptor digest, factory identifier, and minimum capability set before approving.";
  const approve = isPublisher ? "verified" : "approved";
  const decline = isPublisher ? "rejected" : target.release.status === "approved" ? "revoked" : "rejected";
  return <><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-4 py-2">{isPublisher ? <div className="rounded-lg border bg-muted/20 p-3"><PublisherTrustBadge publisher={target.publisher} /><p className="mt-1 font-mono text-xs text-muted-foreground">{target.publisher.slug}</p></div> : <div className="space-y-2 rounded-lg border bg-muted/20 p-3"><p className="font-medium">{target.release.plugin?.name || target.release.plugin?.slug || "Plugin release"} v{target.release.version}</p><ManifestSummary manifest={target.release.manifest} /><DigestRow label="Descriptor SHA-256" value={target.release.descriptorSha256} /></div>}<div className="grid gap-2"><Label>Decision</Label><div className="grid grid-cols-2 gap-2"><Button type="button" variant={decision === approve ? "default" : "outline"} onClick={() => onDecisionChange(approve)}>{approve === "verified" ? "Verify publisher" : "Approve release"}</Button><Button type="button" variant={decision === decline ? "destructive" : "outline"} onClick={() => onDecisionChange(decline)}>{decline === "rejected" ? "Reject verification" : "Revoke / reject"}</Button></div></div><div className="grid gap-2"><Label htmlFor="review-note">Review note</Label><Textarea id="review-note" value={note} rows={5} maxLength={2000} placeholder="Record identity evidence, descriptor compatibility, rollout considerations, or the reason for rejection." onChange={(event) => onNoteChange(event.target.value)} /><p className="text-xs text-muted-foreground">This note becomes part of the auditable review history.</p></div></div><DialogFooter><Button type="button" onClick={onSubmit} disabled={saving === `review-${targetId}`}>{saving === `review-${targetId}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}Record decision</Button></DialogFooter></>;
}

function DigestRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2"><span className="shrink-0 text-xs text-muted-foreground">{label}</span><code className="min-w-0 flex-1 truncate text-xs text-foreground/80">{value || "Not available"}</code>{value ? <CopyValue value={value} label={`Copy ${label}`} /> : null}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><PackageCheck className="mx-auto h-7 w-7 text-muted-foreground/50" /><h3 className="mt-3 text-sm font-medium">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

function ReviewConsoleSkeleton() {
  return <div className="space-y-8 animate-pulse"><div className="h-28 rounded-2xl border border-border/60 bg-card/50" /><div className="h-16 rounded-xl border border-border/60 bg-card/50" /><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 rounded-xl border border-border/60 bg-card/50" />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-125 rounded-xl border border-border/60 bg-card/50" /><div className="h-125 rounded-xl border border-border/60 bg-card/50" /></div></div>;
}
