"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  FileCheck2,
  Lock,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  listDeveloperPluginCatalog,
  installPluginForTeam,
  listTeamPluginInstallations,
} from "@/actions/developerPlugins";
import { getUserTeams } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  type PluginInstallation,
} from "@/components/interface/developers/pluginTypes";
import {
  CopyValue,
  CredibilityScore,
  ManifestSummary,
  PublisherTrustBadge,
  RuntimeSafetyNotice,
  StatusBadge,
} from "@/components/interface/developers/pluginUi";

type ServerAction = (...args: unknown[]) => Promise<unknown>;
type TeamOption = { id: string; name: string; slug: string };

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

function Signal({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3.5">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">{icon}{label}</div>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{text}</p>
    </div>
  );
}

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<CatalogPlugin[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedPlugin, setSelectedPlugin] = useState<CatalogPlugin | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { quiet?: boolean }) => {
    if (options?.quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [catalogResult, teamsResult] = await Promise.allSettled([
        invoke(listDeveloperPluginCatalog),
        invoke(getUserTeams),
      ]);
      if (catalogResult.status === "fulfilled") {
        setCatalog(toPluginList(catalogResult.value));
      } else if (!options?.quiet) {
        toast.error(errorMessage(catalogResult.reason, "Could not load the plugin catalog."));
      }
      const loadedTeams = teamsResult.status === "fulfilled" ? normalizeTeamOptions(teamsResult.value) : [];
      setTeams(loadedTeams);
      setSelectedTeamSlug((current) => current || loadedTeams[0]?.slug || loadedTeams[0]?.id || "");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshInstallations = useCallback(async (teamSlug: string) => {
    if (!teamSlug) { setInstallations([]); return; }
    try {
      const result = await invoke(listTeamPluginInstallations, { team_slug: teamSlug });
      setInstallations(toInstallationList(result));
    } catch { setInstallations([]); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { void refreshInstallations(selectedTeamSlug); }, [refreshInstallations, selectedTeamSlug]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(catalog.map((p) => p.category).filter(Boolean))).sort()],
    [catalog]
  );

  const visibleCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((plugin) => {
      const haystack = [plugin.name, plugin.slug, plugin.summary, plugin.description, plugin.category, ...plugin.tags, plugin.publisher?.displayName || ""].join(" ").toLowerCase();
      return (category === "all" || plugin.category === category) && (!query || haystack.includes(query));
    });
  }, [catalog, category, search]);

  const selectedTeam = teams.find((t) => t.slug === selectedTeamSlug || (!t.slug && t.id === selectedTeamSlug)) ?? null;

  const installPlugin = async (plugin: CatalogPlugin) => {
    if (!selectedTeamSlug) { toast.error("Choose a team first."); return; }
    if (!plugin.currentRelease?.id) { toast.error("No approved release available."); return; }
    setSaving(`install-${plugin.id}`);
    try {
      await invoke(installPluginForTeam, { team_slug: selectedTeamSlug, release_id: plugin.currentRelease.id });
      toast.success(`${plugin.name} installed.`);
      await refreshInstallations(selectedTeamSlug);
      setSelectedPlugin(null);
    } catch (error) {
      toast.error(errorMessage(error, "Could not install this plugin."));
    } finally { setSaving(null); }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-neutral-800" />
        <div className="h-10 rounded-lg bg-neutral-800" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-neutral-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Plugin Catalog
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Signal icon={<ShieldCheck className="h-4 w-4" />} label="Verified publishers" text="Manually reviewed by NetGoat administrators" />
        <Signal icon={<FileCheck2 className="h-4 w-4" />} label="Immutable releases" text="Manifest and descriptor digests are recorded" />
        <Signal icon={<Lock className="h-4 w-4" />} label="No remote code" text="Catalogs describe trusted built-in factories only" />
      </div>

      <RuntimeSafetyNotice />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-500"
            placeholder="Search plugins, publishers, or capabilities"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v || "all")}>
          <SelectTrigger className="w-full sm:w-48 bg-neutral-900 border-neutral-800 text-neutral-200">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>{item === "all" ? "All categories" : titleFromSlug(item)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => void refresh({ quiet: true })} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
        </Button>
      </div>

      {visibleCatalog.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCatalog.map((plugin) => (
            <button key={plugin.id || plugin.slug} type="button" onClick={() => setSelectedPlugin(plugin)} className="group text-left">
              <Card className="h-full border-neutral-800 bg-neutral-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/35 hover:shadow-xl hover:shadow-black/15">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-200">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg text-neutral-100">{plugin.name || titleFromSlug(plugin.slug)}</CardTitle>
                        <p className="mt-0.5 truncate font-mono text-xs text-neutral-500">{plugin.slug}</p>
                      </div>
                    </div>
                    <StatusBadge status={plugin.status} className="shrink-0" />
                  </div>
                  <CardDescription className="line-clamp-3 min-h-15 text-sm leading-6 text-neutral-400">
                    {plugin.summary || plugin.description || "No summary provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <PublisherTrustBadge publisher={plugin.publisher} />
                  </div>
                  <CredibilityScore publisher={plugin.publisher} />
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={plugin.category} />
                    {plugin.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-500">{tag}</span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t border-neutral-800 pt-4 text-xs text-neutral-500">
                  <span>{plugin.currentRelease ? `Release ${plugin.currentRelease.version}` : "No active release"}</span>
                  <span className="font-medium text-neutral-300 transition-colors group-hover:text-sky-300">Inspect →</span>
                </CardFooter>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-neutral-600" />
          <h2 className="mt-4 font-medium text-neutral-200">No matching plugins</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            {search ? "Try a broader search, or clear the category filter." : "Approved extensions will appear here after review and deployment."}
          </p>
        </div>
      )}

      <Dialog open={Boolean(selectedPlugin)} onOpenChange={(open) => !open && setSelectedPlugin(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl border-neutral-800 bg-neutral-900">
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

function PluginDetail({
  plugin, team, canInstall, saving, onInstall,
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-200">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-xl text-neutral-100">{plugin.name || titleFromSlug(plugin.slug)}</DialogTitle>
            <DialogDescription className="mt-1 font-mono text-xs text-neutral-500">{plugin.slug}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-5 py-2">
        <p className="text-sm leading-6 text-neutral-400">{plugin.description || plugin.summary || "No description provided."}</p>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <PublisherTrustBadge publisher={plugin.publisher} />
              <p className="mt-1 text-xs text-neutral-500">{plugin.publisher?.slug || "Unknown publisher"}</p>
            </div>
            <StatusBadge status={plugin.publisher?.verificationStatus || "unverified"} />
          </div>
          <div className="mt-4"><CredibilityScore publisher={plugin.publisher} detailed /></div>
        </div>
        {release ? (
          <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-neutral-200">Approved release {release.version}</h3>
              <StatusBadge status={release.status} />
            </div>
            {release.changelog ? <p className="text-sm text-neutral-400">{release.changelog}</p> : null}
            <ManifestSummary manifest={release.manifest} />
            <DigestRow label="Descriptor SHA-256" value={release.descriptorSha256} />
            <DigestRow label="Manifest SHA-256 (audit)" value={release.sha256} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">
            No approved release available for installation.
          </div>
        )}
        <RuntimeSafetyNotice compact />
      </div>
      <DialogFooter className="gap-2 sm:gap-0 border-t border-neutral-800 pt-4">
        <p className="mr-auto text-xs text-neutral-500">
          {team ? `Install for ${team.name}` : "Choose a team to enable this plugin."}
        </p>
        <Button type="button" onClick={onInstall} disabled={!release || !canInstall || saving} className="bg-neutral-100 text-neutral-900 hover:bg-white">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
          Install plugin
        </Button>
      </DialogFooter>
    </>
  );
}

function DigestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <code className="min-w-0 flex-1 truncate text-xs text-neutral-300">{value || "Not available"}</code>
      {value ? <CopyValue value={value} label={`Copy ${label}`} /> : null}
    </div>
  );
}
