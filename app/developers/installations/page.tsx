"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageCheck, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  listTeamPluginInstallations,
  setTeamPluginInstallationEnabled,
  uninstallPluginForTeam,
  listDeveloperPluginCatalog,
} from "@/actions/developerPlugins";
import { getUserTeams } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  asArray, asRecord, asString, formatDate,
  toInstallationList, toPluginList,
  type PluginInstallation,
} from "@/components/interface/developers/pluginTypes";
import {
  CopyValue, PublisherTrustBadge, StatusBadge,
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

export default function InstallationsPage() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const refreshTeams = useCallback(async () => {
    try {
      const teamsResult = await invoke(getUserTeams);
      const loadedTeams = normalizeTeamOptions(teamsResult);
      setTeams(loadedTeams);
      setSelectedTeamSlug((current) => current || loadedTeams[0]?.slug || loadedTeams[0]?.id || "");
      return loadedTeams;
    } catch { return []; }
  }, []);

  const refreshInstallations = useCallback(async (teamSlug: string) => {
    if (!teamSlug) { setInstallations([]); setLoading(false); return; }
    try {
      const result = await invoke(listTeamPluginInstallations, { team_slug: teamSlug });
      setInstallations(toInstallationList(result));
    } catch { setInstallations([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const loadedTeams = await refreshTeams();
      if (loadedTeams.length > 0) {
        const slug = loadedTeams[0]?.slug || loadedTeams[0]?.id || "";
        await refreshInstallations(slug);
      } else {
        setLoading(false);
      }
    };
    void init();
  }, [refreshTeams, refreshInstallations]);

  const handleSelectTeam = async (slug: string) => {
    setSelectedTeamSlug(slug);
    setLoading(true);
    await refreshInstallations(slug);
  };

  const updateInstallation = async (installation: PluginInstallation, enabled: boolean) => {
    setSaving(`installation-${installation.id}`);
    try {
      await invoke(setTeamPluginInstallationEnabled, { team_slug: selectedTeamSlug, installation_id: installation.id, enabled });
      toast.success(enabled ? "Plugin enabled." : "Plugin disabled.");
      await refreshInstallations(selectedTeamSlug);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update installation."));
    } finally { setSaving(null); }
  };

  const uninstallPlugin = async (installation: PluginInstallation) => {
    setSaving(`installation-${installation.id}`);
    try {
      await invoke(uninstallPluginForTeam, { team_slug: selectedTeamSlug, installation_id: installation.id });
      toast.success("Plugin removed.");
      await refreshInstallations(selectedTeamSlug);
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove plugin."));
    } finally { setSaving(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Team Installs
        </div>
      </div>

      {!teams.length ? (
        <div className="rounded-xl border border-dashed border-neutral-800 p-10 text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-neutral-600" />
          <h2 className="mt-4 font-medium text-neutral-200">Sign in to manage team installs</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Choose a team, inspect its installed descriptors, and control which approved plugins are enabled.
          </p>
          <Link href="/auth/login" className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900 hover:bg-white transition-colors">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-neutral-200">Team extensions</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Track which approved catalog plugins this team uses.
              </p>
            </div>
            <Select value={selectedTeamSlug} onValueChange={handleSelectTeam}>
              <SelectTrigger className="w-full sm:w-64 bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.slug || team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : installations.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {installations.map((installation) => {
                const busy = saving === `installation-${installation.id}`;
                const plugin = installation.plugin;
                return (
                  <Card key={installation.id || `${installation.pluginId}-${installation.releaseId}`} className="border-neutral-800 bg-neutral-900">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base text-neutral-100">
                            {plugin?.name || installation.pluginId || "Installed plugin"}
                          </CardTitle>
                          <CardDescription className="mt-1 font-mono text-xs text-neutral-500">
                            {installation.releaseVersion || installation.release?.version || "Unknown version"}
                          </CardDescription>
                        </div>
                        <StatusBadge status={installation.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <PublisherTrustBadge publisher={installation.publisher || plugin?.publisher || null} compact />
                      {installation.manifestSha256 ? (
                        <CopyValueRow label="Manifest SHA-256" value={installation.manifestSha256} />
                      ) : null}
                      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-neutral-200">Enabled</p>
                          <p className="text-xs text-neutral-500">Controls this team's installation.</p>
                        </div>
                        <Switch
                          checked={installation.status === "enabled"}
                          disabled={busy}
                          onCheckedChange={(enabled) => updateInstallation(installation, enabled)}
                          className="data-[state=checked]:bg-sky-500"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="justify-between border-t border-neutral-800 pt-4">
                      <span className="text-xs text-neutral-500">Installed {formatDate(installation.installedAt)}</span>
                      <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" disabled={busy} onClick={() => uninstallPlugin(installation)}>
                        {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}Remove
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 p-10 text-center">
              <PackageCheck className="mx-auto h-8 w-8 text-neutral-600" />
              <h2 className="mt-4 font-medium text-neutral-200">No plugins installed</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Install plugins from the catalog to see them here.
              </p>
              <Link href="/developers/catalog">
                <Button className="mt-4 bg-neutral-100 text-neutral-900 hover:bg-white">Browse Catalog</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CopyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <code className="min-w-0 flex-1 truncate text-xs text-neutral-300">{value}</code>
      <CopyValue value={value} label={`Copy ${label}`} />
    </div>
  );
}
