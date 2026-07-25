"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Code2,
  FileCheck2,
  Loader2,
  Lock,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDeveloperPlugin,
  createPluginPublisher,
  createPluginRelease,
  installPluginForTeam,
  listDeveloperPluginCatalog,
  listMyDeveloperPlugins,
  listMyPluginPublishers,
  listTeamPluginInstallations,
  requestPluginPublisherVerification,
  setTeamPluginInstallationEnabled,
  submitPluginRelease,
  uninstallPluginForTeam,
  updateDeveloperPlugin,
  updatePluginPublisher,
} from "@/actions/developerPlugins";
import { getUserTeams } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  asArray,
  asRecord,
  asString,
  formatDate,
  titleFromSlug,
  toInstallationList,
  toPluginList,
  toPublisherList,
  type CatalogPlugin,
  type CatalogPublisher,
  type PluginInstallation,
  type UnknownRecord,
} from "./pluginTypes";
import {
  CopyValue,
  CredibilityScore,
  ManifestSummary,
  PublisherLinks,
  PublisherTrustBadge,
  RuntimeSafetyNotice,
  StatusBadge,
} from "./pluginUi";

type ServerAction = (...args: unknown[]) => Promise<unknown>;

type TeamOption = {
  id: string;
  name: string;
  slug: string;
};

type PublisherDraft = {
  slug: string;
  display_name: string;
  description: string;
  website_url: string;
  support_url: string;
};

type PluginDraft = {
  publisher_id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  tags: string;
};

type ReleaseDraft = {
  plugin_id: string;
  version: string;
  changelog: string;
  factory_id: string;
  descriptor_sha256: string;
  granted_capabilities: string[];
  config: string;
};

const EMPTY_PUBLISHER: PublisherDraft = {
  slug: "",
  display_name: "",
  description: "",
  website_url: "",
  support_url: "",
};

const EMPTY_PLUGIN: PluginDraft = {
  publisher_id: "",
  slug: "",
  name: "",
  summary: "",
  description: "",
  category: "security",
  tags: "",
};

const EMPTY_RELEASE: ReleaseDraft = {
  plugin_id: "",
  version: "1.0.0",
  changelog: "",
  factory_id: "builtin.noop",
  descriptor_sha256: "22d6f9898bf456265c2549c38ef185c11de1da1eeee944bb8e97470ed438d2c0",
  granted_capabilities: [],
  config: "{}",
};

const CAPABILITIES = ["request.read", "route.read", "response.write"] as const;

function invoke(action: unknown, ...args: unknown[]): Promise<unknown> {
  return (action as ServerAction)(...args);
}

function normalizeTeamOptions(value: unknown): TeamOption[] {
  return asArray(value).flatMap((item) => {
    const record = asRecord(item);
    const id = asString(record.id) || asString(record._id);
    const name = asString(record.name);
    const slug = asString(record.slug);
    return id ? [{ id, name: name || slug || "Untitled team", slug }] : [];
  });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function normalizedTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function defaultPublisherDraft(publisher: CatalogPublisher): PublisherDraft {
  return {
    slug: publisher.slug,
    display_name: publisher.displayName,
    description: publisher.description,
    website_url: publisher.websiteUrl,
    support_url: publisher.supportUrl,
  };
}

function defaultPluginDraft(plugin: CatalogPlugin): PluginDraft {
  return {
    publisher_id: plugin.publisherId,
    slug: plugin.slug,
    name: plugin.name,
    summary: plugin.summary,
    description: plugin.description,
    category: plugin.category,
    tags: plugin.tags.join(", "),
  };
}

export default function DeveloperPortal() {
  const [catalog, setCatalog] = useState<CatalogPlugin[]>([]);
  const [publishers, setPublishers] = useState<CatalogPublisher[]>([]);
  const [myPlugins, setMyPlugins] = useState<CatalogPlugin[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatorAvailable, setCreatorAvailable] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("catalog");
  const [publisherDraft, setPublisherDraft] = useState<PublisherDraft>(EMPTY_PUBLISHER);
  const [editingPublisherId, setEditingPublisherId] = useState("");
  const [pluginDraft, setPluginDraft] = useState<PluginDraft>(EMPTY_PLUGIN);
  const [editingPluginId, setEditingPluginId] = useState("");
  const [releaseDraft, setReleaseDraft] = useState<ReleaseDraft>(EMPTY_RELEASE);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<CatalogPlugin | null>(null);

  const refresh = useCallback(async (options?: { quiet?: boolean }) => {
    if (options?.quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const [catalogResult, publishersResult, pluginsResult, teamsResult] = await Promise.allSettled([
        invoke(listDeveloperPluginCatalog),
        invoke(listMyPluginPublishers),
        invoke(listMyDeveloperPlugins),
        invoke(getUserTeams),
      ]);

      if (catalogResult.status === "fulfilled") {
        setCatalog(toPluginList(catalogResult.value));
      } else if (!options?.quiet) {
        toast.error(errorMessage(catalogResult.reason, "Could not load the plugin catalog."));
      }

      const signedIn = publishersResult.status === "fulfilled" || pluginsResult.status === "fulfilled" || teamsResult.status === "fulfilled";
      setCreatorAvailable(signedIn);
      setPublishers(publishersResult.status === "fulfilled" ? toPublisherList(publishersResult.value) : []);
      setMyPlugins(pluginsResult.status === "fulfilled" ? toPluginList(pluginsResult.value) : []);
      const loadedTeams = teamsResult.status === "fulfilled" ? normalizeTeamOptions(teamsResult.value) : [];
      setTeams(loadedTeams);
      setSelectedTeamSlug((current) => current || loadedTeams[0]?.slug || loadedTeams[0]?.id || "");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshInstallations = useCallback(async (teamSlug: string) => {
    if (!teamSlug) {
      setInstallations([]);
      return;
    }

    try {
      const result = await invoke(listTeamPluginInstallations, { team_slug: teamSlug });
      setInstallations(toInstallationList(result));
    } catch (error) {
      setInstallations([]);
      toast.error(errorMessage(error, "Could not load installed plugins for this team."));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refreshInstallations(selectedTeamSlug);
  }, [refreshInstallations, selectedTeamSlug]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(catalog.map((plugin) => plugin.category).filter(Boolean))).sort()],
    [catalog],
  );
  const visibleCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((plugin) => {
      const haystack = [
        plugin.name,
        plugin.slug,
        plugin.summary,
        plugin.description,
        plugin.category,
        ...plugin.tags,
        plugin.publisher?.displayName || "",
      ].join(" ").toLowerCase();
      return (category === "all" || plugin.category === category) && (!query || haystack.includes(query));
    });
  }, [catalog, category, search]);

  const selectedTeam = teams.find((team) => team.slug === selectedTeamSlug || (!team.slug && team.id === selectedTeamSlug)) ?? null;

  const submitPublisher = async () => {
    setSaving("publisher");
    try {
      if (editingPublisherId) {
        await invoke(updatePluginPublisher, { publisher_id: editingPublisherId, ...publisherDraft });
        toast.success("Publisher profile updated.");
      } else {
        await invoke(createPluginPublisher, publisherDraft);
        toast.success("Publisher profile created. Request verification when your information is ready.");
      }
      setPublisherDraft(EMPTY_PUBLISHER);
      setEditingPublisherId("");
      await refresh({ quiet: true });
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this publisher profile."));
    } finally {
      setSaving(null);
    }
  };

  const requestVerification = async (publisher: CatalogPublisher) => {
    setSaving(`verify-${publisher.id}`);
    try {
      await invoke(requestPluginPublisherVerification, { publisher_id: publisher.id });
      toast.success("Publisher verification requested. An administrator will review the profile and support links.");
      await refresh({ quiet: true });
    } catch (error) {
      toast.error(errorMessage(error, "Could not request publisher verification."));
    } finally {
      setSaving(null);
    }
  };

  const submitPlugin = async () => {
    setSaving("plugin");
    try {
      const payload = {
        ...pluginDraft,
        category: pluginDraft.category.trim().toLowerCase(),
        tags: normalizedTags(pluginDraft.tags),
      };
      if (editingPluginId) {
        await invoke(updateDeveloperPlugin, {
          plugin_id: editingPluginId,
          slug: payload.slug,
          name: payload.name,
          summary: payload.summary,
          description: payload.description,
          category: payload.category,
          tags: payload.tags,
        });
        toast.success("Plugin draft updated.");
      } else {
        await invoke(createDeveloperPlugin, payload);
        toast.success("Plugin draft created. Add an immutable release when it is ready for review.");
      }
      setPluginDraft((current) => ({ ...EMPTY_PLUGIN, publisher_id: current.publisher_id }));
      setEditingPluginId("");
      await refresh({ quiet: true });
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this plugin draft."));
    } finally {
      setSaving(null);
    }
  };

  const submitRelease = async () => {
    let config: UnknownRecord;
    try {
      const parsed = JSON.parse(releaseDraft.config) as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Config must be a JSON object.");
      }
      config = parsed as UnknownRecord;
    } catch (error) {
      toast.error(errorMessage(error, "Config must be valid JSON."));
      return;
    }

    setSaving("release");
    try {
      const releaseInput = {
        version: releaseDraft.version.trim(),
        changelog: releaseDraft.changelog.trim(),
        descriptor_sha256: releaseDraft.descriptor_sha256.trim().toLowerCase(),
        manifest: {
          kind: "builtin-middleware-v1",
          api_version: "netgoat.dev/middleware/v1",
          factory_id: releaseDraft.factory_id.trim().toLowerCase(),
          granted_capabilities: releaseDraft.granted_capabilities,
          config,
        },
      };
      const result = await invoke(createPluginRelease, { plugin_id: releaseDraft.plugin_id, ...releaseInput });
      const resultRecord = asRecord(result);
      const releaseId = asString(resultRecord.releaseId) || asString(resultRecord.id) || asString(resultRecord._id) || asString(asRecord(resultRecord.release).id) || asString(asRecord(resultRecord.release)._id);
      if (releaseId) {
        await invoke(submitPluginRelease, { release_id: releaseId });
        toast.success("Release submitted for review. It cannot execute until approved and deployed.");
      } else {
        toast.success("Release draft created. Submit it from the plugin release list after refreshing.");
      }
      setReleaseDraft((current) => ({ ...EMPTY_RELEASE, plugin_id: current.plugin_id }));
      await refresh({ quiet: true });
    } catch (error) {
      toast.error(errorMessage(error, "Could not create this release."));
    } finally {
      setSaving(null);
    }
  };

  const submitExistingRelease = async (releaseId: string) => {
    setSaving(`submit-${releaseId}`);
    try {
      await invoke(submitPluginRelease, { release_id: releaseId });
      toast.success("Release submitted for review.");
      await refresh({ quiet: true });
    } catch (error) {
      toast.error(errorMessage(error, "Could not submit this release."));
    } finally {
      setSaving(null);
    }
  };

  const installPlugin = async (plugin: CatalogPlugin) => {
    if (!selectedTeamSlug) {
      toast.error("Choose a team before installing a plugin.");
      return;
    }
    if (!plugin.currentRelease?.id) {
      toast.error("This plugin has no approved release available to install.");
      return;
    }

    setSaving(`install-${plugin.id}`);
    try {
      await invoke(installPluginForTeam, { team_slug: selectedTeamSlug, release_id: plugin.currentRelease.id });
      toast.success(`${plugin.name} installed for ${selectedTeam?.name || "your team"}.`);
      await refreshInstallations(selectedTeamSlug);
      setSelectedPlugin(null);
    } catch (error) {
      toast.error(errorMessage(error, "Could not install this plugin."));
    } finally {
      setSaving(null);
    }
  };

  const updateInstallation = async (installation: PluginInstallation, enabled: boolean) => {
    setSaving(`installation-${installation.id}`);
    try {
      await invoke(setTeamPluginInstallationEnabled, { team_slug: selectedTeamSlug, installation_id: installation.id, enabled });
      toast.success(enabled ? "Plugin enabled for this team." : "Plugin disabled for this team.");
      await refreshInstallations(selectedTeamSlug);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this installation."));
    } finally {
      setSaving(null);
    }
  };

  const uninstallPlugin = async (installation: PluginInstallation) => {
    setSaving(`installation-${installation.id}`);
    try {
      await invoke(uninstallPluginForTeam, { team_slug: selectedTeamSlug, installation_id: installation.id });
      toast.success("Plugin removed from this team.");
      await refreshInstallations(selectedTeamSlug);
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this plugin."));
    } finally {
      setSaving(null);
    }
  };

  const startPublisherEdit = (publisher: CatalogPublisher) => {
    setPublisherDraft(defaultPublisherDraft(publisher));
    setEditingPublisherId(publisher.id);
    setActiveTab("build");
  };

  const startPluginEdit = (plugin: CatalogPlugin) => {
    setPluginDraft(defaultPluginDraft(plugin));
    setEditingPluginId(plugin.id);
    setActiveTab("build");
  };

  if (loading) {
    return <DeveloperPortalSkeleton />;
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/45 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl md:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" /> Developer platform
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Ship trusted extensions for the NetGoat edge.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Publish reviewable descriptors for middleware that is already compiled into your agents. Teams can inspect publisher verification, credibility signals, permissions, and immutable release identities before enabling an extension.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Signal icon={<ShieldCheck className="h-4 w-4" />} label="Verified publishers" text="Manually reviewed by NetGoat administrators" />
            <Signal icon={<FileCheck2 className="h-4 w-4" />} label="Immutable releases" text="Manifest and descriptor digests are recorded" />
            <Signal icon={<Lock className="h-4 w-4" />} label="No remote code" text="Catalogs describe trusted built-in factories only" />
          </div>
        </div>
      </section>

      <RuntimeSafetyNotice />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center">
          <TabsList className="w-full justify-start bg-muted/50 md:w-auto">
            <TabsTrigger value="catalog" className="gap-2"><Boxes className="h-4 w-4" /> Explore</TabsTrigger>
            <TabsTrigger value="build" className="gap-2"><Code2 className="h-4 w-4" /> Build</TabsTrigger>
            <TabsTrigger value="installed" className="gap-2"><PackageCheck className="h-4 w-4" /> Team installs</TabsTrigger>
          </TabsList>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh({ quiet: true })} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh catalog
          </Button>
        </div>

        <TabsContent value="catalog" className="mt-0 space-y-6">
          <CatalogToolbar
            category={category}
            categories={categories}
            onCategoryChange={setCategory}
            onSearchChange={setSearch}
            search={search}
          />
          {visibleCatalog.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCatalog.map((plugin) => (
                <PluginCard key={plugin.id || plugin.slug} plugin={plugin} onSelect={() => setSelectedPlugin(plugin)} />
              ))}
            </div>
          ) : (
            <EmptyCatalog query={search} />
          )}
        </TabsContent>

        <TabsContent value="build" className="mt-0 space-y-6">
          {creatorAvailable ? (
            <DeveloperConsole
              editingPluginId={editingPluginId}
              editingPublisherId={editingPublisherId}
              myPlugins={myPlugins}
              publishers={publishers}
              pluginDraft={pluginDraft}
              publisherDraft={publisherDraft}
              releaseDraft={releaseDraft}
              saving={saving}
              onPluginDraftChange={setPluginDraft}
              onPublisherDraftChange={setPublisherDraft}
              onReleaseDraftChange={setReleaseDraft}
              onSavePlugin={() => void submitPlugin()}
              onSavePublisher={() => void submitPublisher()}
              onSaveRelease={() => void submitRelease()}
              onStartPluginEdit={startPluginEdit}
              onStartPublisherEdit={startPublisherEdit}
              onRequestVerification={(publisher) => void requestVerification(publisher)}
              onSubmitRelease={(releaseId) => void submitExistingRelease(releaseId)}
            />
          ) : (
            <SignInToBuild />
          )}
        </TabsContent>

        <TabsContent value="installed" className="mt-0 space-y-6">
          <TeamInstallations
            installations={installations}
            selectedTeamId={selectedTeamSlug}
            teams={teams}
            saving={saving}
            onSelectTeam={setSelectedTeamSlug}
            onToggle={(installation, enabled) => void updateInstallation(installation, enabled)}
            onUninstall={(installation) => void uninstallPlugin(installation)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedPlugin)} onOpenChange={(open) => !open && setSelectedPlugin(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          {selectedPlugin ? (
            <PluginDetail
              plugin={selectedPlugin}
              team={selectedTeam}
              canInstall={Boolean(selectedTeamSlug)}
              saving={saving === `install-${selectedPlugin.id}`}
              onInstall={() => void installPlugin(selectedPlugin)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Signal({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/35 p-3.5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">{icon}{label}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function CatalogToolbar({
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
}: {
  search: string;
  category: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} className="pl-9" placeholder="Search plugins, publishers, or capabilities" />
      </div>
      <Select value={category} onValueChange={(value) => onCategoryChange(value || "all")}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
        <SelectContent>
          {categories.map((item) => <SelectItem key={item} value={item}>{item === "all" ? "All categories" : titleFromSlug(item)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function PluginCard({ plugin, onSelect }: { plugin: CatalogPlugin; onSelect: () => void }) {
  const release = plugin.currentRelease;
  return (
    <button type="button" onClick={onSelect} className="group text-left">
      <Card className="h-full border-border/60 bg-card/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/35 hover:shadow-xl hover:shadow-black/15">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-200">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-lg">{plugin.name || titleFromSlug(plugin.slug)}</CardTitle>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{plugin.slug}</p>
              </div>
            </div>
            <StatusBadge status={plugin.status} className="shrink-0" />
          </div>
          <CardDescription className="line-clamp-3 min-h-15 text-sm leading-6">{plugin.summary || plugin.description || "No summary provided."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <PublisherTrustBadge publisher={plugin.publisher} />
            {plugin.publisher?.verificationStatus === "verified" ? <span className="text-xs text-sky-300">Verified</span> : null}
          </div>
          <CredibilityScore publisher={plugin.publisher} />
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={plugin.category} />
            {plugin.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">{tag}</span>)}
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <span>{release ? `Release ${release.version}` : "No active release"}</span>
          <span className="font-medium text-foreground transition-colors group-hover:text-sky-200">Inspect extension →</span>
        </CardFooter>
      </Card>
    </button>
  );
}

function PluginDetail({
  plugin,
  team,
  canInstall,
  saving,
  onInstall,
}: {
  plugin: CatalogPlugin;
  team: TeamOption | null;
  canInstall: boolean;
  saving: boolean;
  onInstall: () => void;
}) {
  const release = plugin.currentRelease;
  return (
    <>
      <DialogHeader className="pr-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-200"><Boxes className="h-5 w-5" /></div>
          <div>
            <DialogTitle className="text-xl">{plugin.name || titleFromSlug(plugin.slug)}</DialogTitle>
            <DialogDescription className="mt-1 font-mono text-xs">{plugin.slug}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-5 py-2">
        <p className="text-sm leading-6 text-muted-foreground">{plugin.description || plugin.summary || "No description provided."}</p>
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <PublisherTrustBadge publisher={plugin.publisher} />
              <p className="mt-1 text-xs text-muted-foreground">{plugin.publisher?.slug || "Unknown publisher"}</p>
            </div>
            <StatusBadge status={plugin.publisher?.verificationStatus || "unverified"} />
          </div>
          <div className="mt-4"><CredibilityScore publisher={plugin.publisher} detailed /></div>
          <div className="mt-3"><PublisherLinks publisher={plugin.publisher} /></div>
        </div>
        {release ? (
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="font-medium">Approved release {release.version}</h3><StatusBadge status={release.status} /></div>
            {release.changelog ? <p className="text-sm text-muted-foreground">{release.changelog}</p> : null}
            <ManifestSummary manifest={release.manifest} />
            <DigestRow label="Descriptor SHA-256" value={release.descriptorSha256} />
            <DigestRow label="Manifest SHA-256 (audit)" value={release.sha256} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">This plugin does not have an approved release available for installation.</div>
        )}
        <RuntimeSafetyNotice compact />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <p className="mr-auto text-xs text-muted-foreground">{team ? `Install for ${team.name}` : "Choose a team in the Team installs tab to enable this plugin."}</p>
        <Button type="button" onClick={onInstall} disabled={!release || !canInstall || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
          Install plugin
        </Button>
      </DialogFooter>
    </>
  );
}

function DigestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <code className="min-w-0 flex-1 truncate text-xs text-foreground/80">{value || "Not available"}</code>
      {value ? <CopyValue value={value} label={`Copy ${label}`} /> : null}
    </div>
  );
}

function DeveloperConsole({
  publishers,
  myPlugins,
  publisherDraft,
  pluginDraft,
  releaseDraft,
  editingPublisherId,
  editingPluginId,
  saving,
  onPublisherDraftChange,
  onPluginDraftChange,
  onReleaseDraftChange,
  onSavePublisher,
  onSavePlugin,
  onSaveRelease,
  onStartPublisherEdit,
  onStartPluginEdit,
  onRequestVerification,
  onSubmitRelease,
}: {
  publishers: CatalogPublisher[];
  myPlugins: CatalogPlugin[];
  publisherDraft: PublisherDraft;
  pluginDraft: PluginDraft;
  releaseDraft: ReleaseDraft;
  editingPublisherId: string;
  editingPluginId: string;
  saving: string | null;
  onPublisherDraftChange: (value: PublisherDraft) => void;
  onPluginDraftChange: (value: PluginDraft) => void;
  onReleaseDraftChange: (value: ReleaseDraft) => void;
  onSavePublisher: () => void;
  onSavePlugin: () => void;
  onSaveRelease: () => void;
  onStartPublisherEdit: (publisher: CatalogPublisher) => void;
  onStartPluginEdit: (plugin: CatalogPlugin) => void;
  onRequestVerification: (publisher: CatalogPublisher) => void;
  onSubmitRelease: (releaseId: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
      <div className="space-y-6">
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-sky-300" /> {editingPublisherId ? "Edit publisher profile" : "Create a publisher profile"}</CardTitle>
            <CardDescription>A public identity for your plugins. Verification is a manual review of this profile; it does not permit new code to run.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Publisher name" required><Input value={publisherDraft.display_name} maxLength={96} placeholder="Acme Edge Tools" onChange={(event) => onPublisherDraftChange({ ...publisherDraft, display_name: event.target.value })} /></Field>
            <Field label="Publisher slug" required><Input value={publisherDraft.slug} maxLength={80} placeholder="acme-edge" autoCapitalize="none" onChange={(event) => onPublisherDraftChange({ ...publisherDraft, slug: event.target.value })} /></Field>
            <Field label="Website URL"><Input value={publisherDraft.website_url} type="url" placeholder="https://example.com" onChange={(event) => onPublisherDraftChange({ ...publisherDraft, website_url: event.target.value })} /></Field>
            <Field label="Support URL"><Input value={publisherDraft.support_url} type="url" placeholder="https://support.example.com" onChange={(event) => onPublisherDraftChange({ ...publisherDraft, support_url: event.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="About this publisher"><Textarea value={publisherDraft.description} rows={3} placeholder="What do you build and how can teams reach you?" onChange={(event) => onPublisherDraftChange({ ...publisherDraft, description: event.target.value })} /></Field></div>
          </CardContent>
          <CardFooter className="justify-end border-t border-border/50 pt-5"><Button type="button" onClick={onSavePublisher} disabled={saving === "publisher"}>{saving === "publisher" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{editingPublisherId ? "Save profile" : "Create publisher"}</Button></CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5 text-sky-300" /> {editingPluginId ? "Edit plugin draft" : "Create a plugin draft"}</CardTitle>
            <CardDescription>Describe the extension and select the publisher that owns it. Publishing requires an approved immutable release.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Publisher" required>
              <Select value={pluginDraft.publisher_id} onValueChange={(value) => onPluginDraftChange({ ...pluginDraft, publisher_id: value || "" })}>
                <SelectTrigger><SelectValue placeholder="Choose a publisher" /></SelectTrigger>
                <SelectContent>{publishers.map((publisher) => <SelectItem key={publisher.id} value={publisher.id}>{publisher.displayName || publisher.slug}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category" required><Input value={pluginDraft.category} maxLength={40} placeholder="security" autoCapitalize="none" onChange={(event) => onPluginDraftChange({ ...pluginDraft, category: event.target.value })} /></Field>
            <Field label="Plugin name" required><Input value={pluginDraft.name} maxLength={96} placeholder="Trusted Header Policy" onChange={(event) => onPluginDraftChange({ ...pluginDraft, name: event.target.value })} /></Field>
            <Field label="Plugin slug" required><Input value={pluginDraft.slug} maxLength={80} placeholder="trusted-header-policy" autoCapitalize="none" onChange={(event) => onPluginDraftChange({ ...pluginDraft, slug: event.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Summary" required><Input value={pluginDraft.summary} maxLength={280} placeholder="A concise explanation of what this built-in middleware descriptor configures." onChange={(event) => onPluginDraftChange({ ...pluginDraft, summary: event.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description"><Textarea value={pluginDraft.description} rows={4} placeholder="Describe behavior, configuration assumptions, and expected impact." onChange={(event) => onPluginDraftChange({ ...pluginDraft, description: event.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Tags"><Input value={pluginDraft.tags} placeholder="security, headers, policy" onChange={(event) => onPluginDraftChange({ ...pluginDraft, tags: event.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Comma-separated; use concise, searchable labels.</p></Field></div>
          </CardContent>
          <CardFooter className="justify-end border-t border-border/50 pt-5"><Button type="button" onClick={onSavePlugin} disabled={saving === "plugin" || !publishers.length}>{saving === "plugin" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{editingPluginId ? "Save plugin draft" : "Create plugin draft"}</Button></CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-sky-300" /> Create an immutable release</CardTitle>
            <CardDescription>Each release only selects a factory compiled into NetGoat agents. You cannot upload source, a module, a URL, or a binary here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RuntimeSafetyNotice compact />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plugin" required>
                <Select value={releaseDraft.plugin_id} onValueChange={(value) => onReleaseDraftChange({ ...releaseDraft, plugin_id: value || "" })}>
                  <SelectTrigger><SelectValue placeholder="Choose a plugin draft" /></SelectTrigger>
                  <SelectContent>{myPlugins.map((plugin) => <SelectItem key={plugin.id} value={plugin.id}>{plugin.name || plugin.slug}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Version" required><Input value={releaseDraft.version} placeholder="1.0.0" autoCapitalize="none" onChange={(event) => onReleaseDraftChange({ ...releaseDraft, version: event.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Compiled descriptor SHA-256" required><Input value={releaseDraft.descriptor_sha256} className="font-mono text-xs" maxLength={64} placeholder="64-character SHA-256 provided by the NetGoat agent build" autoCapitalize="none" autoComplete="off" onChange={(event) => onReleaseDraftChange({ ...releaseDraft, descriptor_sha256: event.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Required. This binds the release to an already compiled middleware descriptor. The catalog-calculated manifest SHA-256 is retained for audit only and cannot be substituted here. The current agent ships <code>builtin.noop</code> as a safe reference descriptor.</p></Field></div>
              <div className="sm:col-span-2"><Field label="Built-in factory ID" required><Input value={releaseDraft.factory_id} className="font-mono text-sm" maxLength={80} placeholder="builtin.noop" autoCapitalize="none" onChange={(event) => onReleaseDraftChange({ ...releaseDraft, factory_id: event.target.value })} /><p className="mt-1 text-xs text-muted-foreground"><code>builtin.noop</code> (v1.0.0, no capabilities) is the built-in reference. Use a different factory and digest only when supplied by the agent build.</p></Field></div>
            </div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Granted capabilities</legend><p className="text-xs text-muted-foreground">Grant the smallest set your factory’s compiled manifest requires.</p><div className="flex flex-wrap gap-2">{CAPABILITIES.map((capability) => { const checked = releaseDraft.granted_capabilities.includes(capability); return <label key={capability} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors", checked ? "border-sky-400/40 bg-sky-400/10 text-sky-100" : "border-border bg-muted/20 text-muted-foreground")}><input className="sr-only" type="checkbox" checked={checked} onChange={() => onReleaseDraftChange({ ...releaseDraft, granted_capabilities: checked ? releaseDraft.granted_capabilities.filter((item) => item !== capability) : [...releaseDraft.granted_capabilities, capability] })} />{capability}</label>; })}</div></fieldset>
            <Field label="Factory configuration (JSON object)" required><Textarea value={releaseDraft.config} rows={8} spellCheck={false} className="font-mono text-xs leading-5" placeholder={'{\n  "mode": "strict"\n}'} onChange={(event) => onReleaseDraftChange({ ...releaseDraft, config: event.target.value })} /></Field>
            <Field label="Release notes"><Textarea value={releaseDraft.changelog} rows={3} placeholder="What changed, why, and how teams should roll this out." onChange={(event) => onReleaseDraftChange({ ...releaseDraft, changelog: event.target.value })} /></Field>
          </CardContent>
          <CardFooter className="justify-end border-t border-border/50 pt-5"><Button type="button" onClick={onSaveRelease} disabled={saving === "release" || !myPlugins.length}>{saving === "release" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}Create and submit release</Button></CardFooter>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card className="border-border/60 bg-card/50">
          <CardHeader><CardTitle className="text-base">Your publishers</CardTitle><CardDescription>Verification status and credibility are visible to teams.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{publishers.length ? publishers.map((publisher) => <div key={publisher.id} className="rounded-xl border bg-muted/20 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><PublisherTrustBadge publisher={publisher} /><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{publisher.slug}</p></div><StatusBadge status={publisher.verificationStatus} /></div><div className="mt-3"><CredibilityScore publisher={publisher} /></div><div className="mt-2 flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onStartPublisherEdit(publisher)}>Edit profile</Button>{publisher.verificationStatus !== "verified" && publisher.verificationStatus !== "pending" ? <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-sky-200 hover:text-sky-100" disabled={saving === `verify-${publisher.id}`} onClick={() => onRequestVerification(publisher)}>{saving === `verify-${publisher.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Request verification</Button> : null}</div></div>) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Create a publisher profile to begin.</div>}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader><CardTitle className="text-base">Your plugin drafts</CardTitle><CardDescription>Drafts are inert until an approved release is deployed.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{myPlugins.length ? myPlugins.map((plugin) => <div key={plugin.id} className="rounded-xl border bg-muted/20 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{plugin.name || plugin.slug}</p><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{plugin.slug}</p></div><StatusBadge status={plugin.status} /></div><Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => onStartPluginEdit(plugin)}>Edit draft</Button>{plugin.releases.length ? <div className="mt-3 space-y-2 border-t border-border/50 pt-3">{plugin.releases.map((release) => <div key={release.id || release.version} className="flex items-center justify-between gap-2 text-xs"><span className="font-mono text-muted-foreground">v{release.version}</span><div className="flex items-center gap-2"><StatusBadge status={release.status} />{release.status === "draft" && release.id ? <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={saving === `submit-${release.id}`} onClick={() => onSubmitRelease(release.id)}>{saving === `submit-${release.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}</Button> : null}</div></div>)}</div> : null}</div>) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Plugin drafts will appear here.</div>}</CardContent>
        </Card>
      </aside>
    </div>
  );
}

function TeamInstallations({
  teams,
  selectedTeamId,
  installations,
  saving,
  onSelectTeam,
  onToggle,
  onUninstall,
}: {
  teams: TeamOption[];
  selectedTeamId: string;
  installations: PluginInstallation[];
  saving: string | null;
  onSelectTeam: (teamId: string) => void;
  onToggle: (installation: PluginInstallation, enabled: boolean) => void;
  onUninstall: (installation: PluginInstallation) => void;
}) {
  if (!teams.length) return <SignInToBuild teamMode />;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">Team extensions</h2><p className="mt-1 text-sm text-muted-foreground">Track which approved catalog plugins this team intends to use. A platform administrator separately deploys a reviewed descriptor to the agent fleet.</p></div>
        <Select value={selectedTeamId} onValueChange={(value) => onSelectTeam(value || "")}><SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Choose a team" /></SelectTrigger><SelectContent>{teams.map((team) => <SelectItem key={team.id} value={team.slug || team.id}>{team.name}</SelectItem>)}</SelectContent></Select>
      </div>
      {installations.length ? <div className="grid gap-4 lg:grid-cols-2">{installations.map((installation) => { const busy = saving === `installation-${installation.id}`; const plugin = installation.plugin; return <Card key={installation.id || `${installation.pluginId}-${installation.releaseId}`} className="border-border/60 bg-card/50"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-base">{plugin?.name || installation.pluginId || "Installed plugin"}</CardTitle><CardDescription className="mt-1 font-mono text-xs">{installation.releaseVersion || installation.release?.version || "Unknown version"}</CardDescription></div><StatusBadge status={installation.status} /></div></CardHeader><CardContent className="space-y-3"><PublisherTrustBadge publisher={installation.publisher || plugin?.publisher || null} compact /><DigestRow label="Manifest SHA-256" value={installation.manifestSha256} /><div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2"><div><p className="text-sm font-medium">Enabled</p><p className="text-xs text-muted-foreground">Tracks this team’s approved catalog installation. Fleet deployment remains an admin action.</p></div><Switch checked={installation.status === "enabled"} disabled={busy} onCheckedChange={(enabled) => onToggle(installation, enabled)} /></div></CardContent><CardFooter className="justify-between border-t border-border/50 pt-4"><span className="text-xs text-muted-foreground">Installed {formatDate(installation.installedAt)}</span><Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => onUninstall(installation)}>{busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}Remove</Button></CardFooter></Card>; })}</div> : <div className="rounded-2xl border border-dashed p-10 text-center"><PackageCheck className="mx-auto h-8 w-8 text-muted-foreground/50" /><h2 className="mt-4 font-medium">No plugins installed</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Browse the catalog and install an approved plugin for this team. Every installation remains independently enableable and removable.</p></div>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}{required ? <span className="ml-1 text-destructive">*</span> : null}</Label>{children}</div>;
}

function EmptyCatalog({ query }: { query: string }) {
  return <div className="rounded-2xl border border-dashed p-10 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground/50" /><h2 className="mt-4 font-medium">No matching plugins</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{query ? "Try a broader search, or clear the category filter." : "Approved extensions will appear here after review and deployment."}</p></div>;
}

function SignInToBuild({ teamMode = false }: { teamMode?: boolean }) {
  return <div className="rounded-2xl border border-dashed p-10 text-center"><Wrench className="mx-auto h-8 w-8 text-muted-foreground/50" /><h2 className="mt-4 font-medium">{teamMode ? "Sign in to manage team installs" : "Sign in to publish"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{teamMode ? "Choose a team, inspect its installed descriptors, and control which approved plugins are enabled." : "Create a publisher profile, assemble a descriptor-based plugin, and submit immutable releases for review."}</p><Link href="/auth/login" className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">Sign in</Link></div>;
}

function DeveloperPortalSkeleton() {
  return <div className="space-y-8 animate-pulse"><div className="h-75 rounded-3xl border border-border/60 bg-card/50" /><div className="h-16 rounded-xl border border-border/60 bg-card/50" /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-76 rounded-2xl border border-border/60 bg-card/50" />)}</div></div>;
}
