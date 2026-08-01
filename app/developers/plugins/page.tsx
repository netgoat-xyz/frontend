"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Code2,
  Loader2,
  ShieldCheck,
  Boxes,
  Rocket,
  FileCheck2,
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  createDeveloperPlugin,
  createPluginPublisher,
  createPluginRelease,
  listDeveloperPluginCatalog,
  listMyDeveloperPlugins,
  listMyPluginPublishers,
  requestPluginPublisherVerification,
  submitPluginRelease,
  updateDeveloperPlugin,
  updatePluginPublisher,
} from "@/actions/developerPlugins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  asArray, asRecord, asString, titleFromSlug,
  toPluginList, toPublisherList,
  type CatalogPlugin, type CatalogPublisher, type UnknownRecord,
} from "@/components/interface/developers/pluginTypes";
import {
  CredibilityScore, PublisherTrustBadge, RuntimeSafetyNotice, StatusBadge,
} from "@/components/interface/developers/pluginUi";

type ServerAction = (...args: unknown[]) => Promise<unknown>;

function invoke(action: unknown, ...args: unknown[]): Promise<unknown> {
  return (action as ServerAction)(...args);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

type PublisherDraft = { slug: string; display_name: string; description: string; website_url: string; support_url: string };
type PluginDraft = { publisher_id: string; slug: string; name: string; summary: string; description: string; category: string; tags: string };
type ReleaseDraft = { plugin_id: string; version: string; changelog: string; factory_id: string; descriptor_sha256: string; granted_capabilities: string[]; config: string };

const EMPTY_PUBLISHER: PublisherDraft = { slug: "", display_name: "", description: "", website_url: "", support_url: "" };
const EMPTY_PLUGIN: PluginDraft = { publisher_id: "", slug: "", name: "", summary: "", description: "", category: "security", tags: "" };
const EMPTY_RELEASE: ReleaseDraft = { plugin_id: "", version: "1.0.0", changelog: "", factory_id: "builtin.noop", descriptor_sha256: "22d6f9898bf456265c2549c38ef185c11de1da1eeee944bb8e97470ed438d2c0", granted_capabilities: [], config: "{}" };
const CAPABILITIES = ["request.read", "route.read", "response.write"] as const;

function defaultPublisherDraft(p: CatalogPublisher): PublisherDraft {
  return { slug: p.slug, display_name: p.displayName, description: p.description, website_url: p.websiteUrl, support_url: p.supportUrl };
}
function defaultPluginDraft(p: CatalogPlugin): PluginDraft {
  return { publisher_id: p.publisherId, slug: p.slug, name: p.name, summary: p.summary, description: p.description, category: p.category, tags: p.tags.join(", ") };
}
function normalizedTags(value: string): string[] {
  return [...new Set(value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

export default function PluginsPage() {
  const [publishers, setPublishers] = useState<CatalogPublisher[]>([]);
  const [myPlugins, setMyPlugins] = useState<CatalogPlugin[]>([]);
  const [catalog, setCatalog] = useState<CatalogPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorAvailable, setCreatorAvailable] = useState(false);
  const [publisherDraft, setPublisherDraft] = useState<PublisherDraft>(EMPTY_PUBLISHER);
  const [editingPublisherId, setEditingPublisherId] = useState("");
  const [pluginDraft, setPluginDraft] = useState<PluginDraft>(EMPTY_PLUGIN);
  const [editingPluginId, setEditingPluginId] = useState("");
  const [releaseDraft, setReleaseDraft] = useState<ReleaseDraft>(EMPTY_RELEASE);
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pubResult, plugResult, catResult] = await Promise.allSettled([
        invoke(listMyPluginPublishers), invoke(listMyDeveloperPlugins), invoke(listDeveloperPluginCatalog),
      ]);
      const signedIn = pubResult.status === "fulfilled" || plugResult.status === "fulfilled";
      setCreatorAvailable(signedIn);
      setPublishers(pubResult.status === "fulfilled" ? toPublisherList(pubResult.value) : []);
      setMyPlugins(plugResult.status === "fulfilled" ? toPluginList(plugResult.value) : []);
      if (catResult.status === "fulfilled") setCatalog(toPluginList(catResult.value));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const submitPublisher = async () => {
    setSaving("publisher");
    try {
      if (editingPublisherId) {
        await invoke(updatePluginPublisher, { publisher_id: editingPublisherId, ...publisherDraft });
        toast.success("Publisher profile updated.");
      } else {
        await invoke(createPluginPublisher, publisherDraft);
        toast.success("Publisher profile created.");
      }
      setPublisherDraft(EMPTY_PUBLISHER); setEditingPublisherId(""); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not save publisher.")); }
    finally { setSaving(null); }
  };

  const requestVerification = async (publisher: CatalogPublisher) => {
    setSaving(`verify-${publisher.id}`);
    try {
      await invoke(requestPluginPublisherVerification, { publisher_id: publisher.id });
      toast.success("Verification requested."); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not request verification.")); }
    finally { setSaving(null); }
  };

  const submitPlugin = async () => {
    setSaving("plugin");
    try {
      const payload = { ...pluginDraft, category: pluginDraft.category.trim().toLowerCase(), tags: normalizedTags(pluginDraft.tags) };
      if (editingPluginId) {
        await invoke(updateDeveloperPlugin, { plugin_id: editingPluginId, ...payload });
        toast.success("Plugin updated.");
      } else {
        await invoke(createDeveloperPlugin, payload);
        toast.success("Plugin draft created.");
      }
      setPluginDraft((c) => ({ ...EMPTY_PLUGIN, publisher_id: c.publisher_id })); setEditingPluginId(""); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not save plugin.")); }
    finally { setSaving(null); }
  };

  const submitRelease = async () => {
    let config: UnknownRecord;
    try {
      const parsed = JSON.parse(releaseDraft.config) as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Config must be a JSON object.");
      config = parsed as UnknownRecord;
    } catch (error) { toast.error(errorMessage(error, "Config must be valid JSON.")); return; }
    setSaving("release");
    try {
      const releaseInput = {
        version: releaseDraft.version.trim(), changelog: releaseDraft.changelog.trim(),
        descriptor_sha256: releaseDraft.descriptor_sha256.trim().toLowerCase(),
        manifest: { kind: "builtin-middleware-v1", api_version: "netgoat.dev/middleware/v1", factory_id: releaseDraft.factory_id.trim().toLowerCase(), granted_capabilities: releaseDraft.granted_capabilities, config },
      };
      const result = await invoke(createPluginRelease, { plugin_id: releaseDraft.plugin_id, ...releaseInput });
      const resultRecord = asRecord(result);
      const releaseId = asString(resultRecord.releaseId) || asString(resultRecord.id) || asString(resultRecord._id) || asString(asRecord(resultRecord.release).id) || asString(asRecord(resultRecord.release)._id);
      if (releaseId) {
        await invoke(submitPluginRelease, { release_id: releaseId });
        toast.success("Release submitted for review.");
      } else {
        toast.success("Release created.");
      }
      setReleaseDraft((c) => ({ ...EMPTY_RELEASE, plugin_id: c.plugin_id })); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not create release.")); }
    finally { setSaving(null); }
  };

  const submitExistingRelease = async (releaseId: string) => {
    setSaving(`submit-${releaseId}`);
    try { await invoke(submitPluginRelease, { release_id: releaseId }); toast.success("Release submitted."); await refresh(); }
    catch (error) { toast.error(errorMessage(error, "Could not submit release.")); }
    finally { setSaving(null); }
  };

  const startPublisherEdit = (p: CatalogPublisher) => { setPublisherDraft(defaultPublisherDraft(p)); setEditingPublisherId(p.id); };
  const startPluginEdit = (p: CatalogPlugin) => { setPluginDraft(defaultPluginDraft(p)); setEditingPluginId(p.id); };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-neutral-800" />
        <div className="h-64 rounded-xl bg-neutral-800" />
        <div className="h-64 rounded-xl bg-neutral-800" />
        <div className="h-64 rounded-xl bg-neutral-800" />
      </div>
    );
  }

  if (!creatorAvailable) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
            <Sparkles className="h-3.5 w-3.5" /> Build Plugins
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-800 p-10 text-center">
          <Wrench className="mx-auto h-8 w-8 text-neutral-600" />
          <h2 className="mt-4 font-medium text-neutral-200">Sign in to publish</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Create a publisher profile, assemble a descriptor-based plugin, and submit immutable releases for review.
          </p>
          <Link href="/auth/login" className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 hover:bg-white transition-colors">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Build Plugins
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <div className="space-y-6">
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
                {editingPublisherId ? "Edit publisher profile" : "Create a publisher profile"}
              </CardTitle>
              <CardDescription className="text-neutral-500">
                A public identity for your plugins. Verification is a manual review of this profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Publisher name" required>
                <Input value={publisherDraft.display_name} maxLength={96} placeholder="Acme Edge Tools" onChange={(e) => setPublisherDraft({ ...publisherDraft, display_name: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <Field label="Publisher slug" required>
                <Input value={publisherDraft.slug} maxLength={80} placeholder="acme-edge" autoCapitalize="none" onChange={(e) => setPublisherDraft({ ...publisherDraft, slug: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <Field label="Website URL">
                <Input value={publisherDraft.website_url} type="url" placeholder="https://example.com" onChange={(e) => setPublisherDraft({ ...publisherDraft, website_url: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <Field label="Support URL">
                <Input value={publisherDraft.support_url} type="url" placeholder="https://support.example.com" onChange={(e) => setPublisherDraft({ ...publisherDraft, support_url: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="About this publisher">
                  <Textarea value={publisherDraft.description} rows={3} placeholder="What do you build?" onChange={(e) => setPublisherDraft({ ...publisherDraft, description: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
                </Field>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-neutral-800 pt-5">
              <Button type="button" onClick={submitPublisher} disabled={saving === "publisher"} className="bg-neutral-100 text-neutral-900 hover:bg-white">
                {saving === "publisher" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {editingPublisherId ? "Save profile" : "Create publisher"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <Boxes className="h-5 w-5 text-sky-300" />
                {editingPluginId ? "Edit plugin draft" : "Create a plugin draft"}
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Describe the extension and select the publisher that owns it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Publisher" required>
                <Select value={pluginDraft.publisher_id} onValueChange={(v) => setPluginDraft({ ...pluginDraft, publisher_id: v || "" })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200"><SelectValue placeholder="Choose a publisher" /></SelectTrigger>
                  <SelectContent>{publishers.map((p) => <SelectItem key={p.id} value={p.id}>{p.displayName || p.slug}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Category" required>
                <Input value={pluginDraft.category} maxLength={40} placeholder="security" autoCapitalize="none" onChange={(e) => setPluginDraft({ ...pluginDraft, category: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <Field label="Plugin name" required>
                <Input value={pluginDraft.name} maxLength={96} placeholder="Trusted Header Policy" onChange={(e) => setPluginDraft({ ...pluginDraft, name: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <Field label="Plugin slug" required>
                <Input value={pluginDraft.slug} maxLength={80} placeholder="trusted-header-policy" autoCapitalize="none" onChange={(e) => setPluginDraft({ ...pluginDraft, slug: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Summary" required>
                  <Input value={pluginDraft.summary} maxLength={280} placeholder="A concise explanation of what this middleware configures." onChange={(e) => setPluginDraft({ ...pluginDraft, summary: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea value={pluginDraft.description} rows={4} placeholder="Describe behavior, configuration, and expected impact." onChange={(e) => setPluginDraft({ ...pluginDraft, description: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Tags">
                  <Input value={pluginDraft.tags} placeholder="security, headers, policy" onChange={(e) => setPluginDraft({ ...pluginDraft, tags: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
                  <p className="mt-1 text-xs text-neutral-500">Comma-separated; use concise, searchable labels.</p>
                </Field>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-neutral-800 pt-5">
              <Button type="button" onClick={submitPlugin} disabled={saving === "plugin" || !publishers.length} className="bg-neutral-100 text-neutral-900 hover:bg-white">
                {saving === "plugin" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingPluginId ? "Save plugin draft" : "Create plugin draft"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <Rocket className="h-5 w-5 text-sky-300" /> Create an immutable release
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Each release only selects a factory compiled into NetGoat agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <RuntimeSafetyNotice compact />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Plugin" required>
                  <Select value={releaseDraft.plugin_id} onValueChange={(v) => setReleaseDraft({ ...releaseDraft, plugin_id: v || "" })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200"><SelectValue placeholder="Choose a plugin draft" /></SelectTrigger>
                    <SelectContent>{myPlugins.map((p) => <SelectItem key={p.id} value={p.id}>{p.name || p.slug}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Version" required>
                  <Input value={releaseDraft.version} placeholder="1.0.0" autoCapitalize="none" onChange={(e) => setReleaseDraft({ ...releaseDraft, version: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Compiled descriptor SHA-256" required>
                    <Input value={releaseDraft.descriptor_sha256} className="font-mono text-xs bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" maxLength={64} placeholder="64-character SHA-256" autoCapitalize="none" autoComplete="off" onChange={(e) => setReleaseDraft({ ...releaseDraft, descriptor_sha256: e.target.value })} />
                    <p className="mt-1 text-xs text-neutral-500">Required. Binds the release to an already compiled middleware descriptor.</p>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Built-in factory ID" required>
                    <Input value={releaseDraft.factory_id} className="font-mono text-sm bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" maxLength={80} placeholder="builtin.noop" autoCapitalize="none" onChange={(e) => setReleaseDraft({ ...releaseDraft, factory_id: e.target.value })} />
                  </Field>
                </div>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-neutral-200">Granted capabilities</legend>
                <p className="text-xs text-neutral-500">Grant the smallest set your factory requires.</p>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map((capability) => {
                    const checked = releaseDraft.granted_capabilities.includes(capability);
                    return (
                      <label key={capability} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors", checked ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-neutral-700 bg-neutral-800 text-neutral-400")}>
                        <input className="sr-only" type="checkbox" checked={checked} onChange={() => setReleaseDraft({ ...releaseDraft, granted_capabilities: checked ? releaseDraft.granted_capabilities.filter((i) => i !== capability) : [...releaseDraft.granted_capabilities, capability] })} />
                        {capability}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <Field label="Factory configuration (JSON object)" required>
                <Textarea value={releaseDraft.config} rows={8} spellCheck={false} className="font-mono text-xs leading-5 bg-neutral-800 border-neutral-700 text-neutral-200" placeholder='{"mode": "strict"}' onChange={(e) => setReleaseDraft({ ...releaseDraft, config: e.target.value })} />
              </Field>
              <Field label="Release notes">
                <Textarea value={releaseDraft.changelog} rows={3} placeholder="What changed, why, and how to roll out." onChange={(e) => setReleaseDraft({ ...releaseDraft, changelog: e.target.value })} className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500" />
              </Field>
            </CardContent>
            <CardFooter className="justify-end border-t border-neutral-800 pt-5">
              <Button type="button" onClick={submitRelease} disabled={saving === "release" || !myPlugins.length} className="bg-neutral-100 text-neutral-900 hover:bg-white">
                {saving === "release" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
                Create and submit release
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-base text-neutral-100">Your publishers</CardTitle>
              <CardDescription className="text-neutral-500">Verification status is visible to teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {publishers.length ? publishers.map((p) => (
                <div key={p.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <PublisherTrustBadge publisher={p} />
                      <p className="mt-1 truncate font-mono text-xs text-neutral-500">{p.slug}</p>
                    </div>
                    <StatusBadge status={p.verificationStatus} />
                  </div>
                  <div className="mt-3"><CredibilityScore publisher={p} /></div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-neutral-400 hover:text-neutral-200" onClick={() => startPublisherEdit(p)}>Edit</Button>
                    {p.verificationStatus !== "verified" && p.verificationStatus !== "pending" ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-sky-200 hover:text-sky-100" disabled={saving === `verify-${p.id}`} onClick={() => requestVerification(p)}>
                        {saving === `verify-${p.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Verify
                      </Button>
                    ) : null}
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">Create a publisher profile to begin.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-base text-neutral-100">Your plugin drafts</CardTitle>
              <CardDescription className="text-neutral-500">Drafts are inert until an approved release.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myPlugins.length ? myPlugins.map((plugin) => (
                <div key={plugin.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-200">{plugin.name || plugin.slug}</p>
                      <p className="mt-1 truncate font-mono text-xs text-neutral-500">{plugin.slug}</p>
                    </div>
                    <StatusBadge status={plugin.status} />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-neutral-400 hover:text-neutral-200" onClick={() => startPluginEdit(plugin)}>Edit draft</Button>
                  {plugin.releases.length ? (
                    <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                      {plugin.releases.map((release) => (
                        <div key={release.id || release.version} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-neutral-500">v{release.version}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={release.status} />
                            {release.status === "draft" && release.id ? (
                              <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs border-neutral-700 text-neutral-400 hover:text-neutral-200" disabled={saving === `submit-${release.id}`} onClick={() => submitExistingRelease(release.id)}>
                                {saving === `submit-${release.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">Plugin drafts will appear here.</div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label className="text-neutral-300">{label}{required ? <span className="ml-1 text-red-400">*</span> : null}</Label>{children}</div>;
}
