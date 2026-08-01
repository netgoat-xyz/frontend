"use client";

import {
  deleteDomainProxyConfig,
  upsertDomainProxyConfig,
} from "@/actions/teamDomains";
import { ArrowRight, Globe, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type UpstreamServer = {
  url: string;
};

type HealthCheck = {
  enabled?: boolean;
  path?: string;
};

type ReverseProxyConfig = {
  _id: string;
  name: string;
  subdomain?: string;
  enabled?: boolean;
  preserve_host?: boolean;
  websocket_enabled?: boolean;
  health_check?: HealthCheck;
  upstream_servers?: UpstreamServer[];
};

type SubdomainRecord = {
  subdomain: string;
  full_domain: string;
};

function upstreamListToText(servers: UpstreamServer[] | undefined) {
  return (servers || []).map((server) => server.url).join("\n");
}

export function ReverseProxiesClient({
  teamSlug,
  domainId,
  domainName,
  primaryTarget,
  reverseProxies,
  subdomains,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  primaryTarget?: string;
  reverseProxies: ReverseProxyConfig[];
  subdomains: SubdomainRecord[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scope, setScope] = useState("");
  const [name, setName] = useState("");
  const [upstreams, setUpstreams] = useState(primaryTarget ? `${primaryTarget}\n` : "");
  const [preserveHost, setPreserveHost] = useState(true);
  const [websocketEnabled, setWebsocketEnabled] = useState(false);
  const [healthCheckPath, setHealthCheckPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const scopeOptions = useMemo(
    () => [
      { value: "", label: `Root domain (${domainName})` },
      ...subdomains.map((subdomain) => ({
        value: subdomain.subdomain,
        label: subdomain.full_domain,
      })),
    ],
    [domainName, subdomains],
  );

  const resetForm = () => {
    setEditingId(null);
    setScope("");
    setName("");
    setUpstreams(primaryTarget ? `${primaryTarget}\n` : "");
    setPreserveHost(true);
    setWebsocketEnabled(false);
    setHealthCheckPath("");
  };

  const handleEdit = (config: ReverseProxyConfig) => {
    setEditingId(config._id);
    setScope(config.subdomain || "");
    setName(config.name || "");
    setUpstreams(upstreamListToText(config.upstream_servers));
    setPreserveHost(config.preserve_host !== false);
    setWebsocketEnabled(Boolean(config.websocket_enabled));
    setHealthCheckPath(config.health_check?.enabled ? config.health_check.path || "/" : "");
  };

  const handleSave = async () => {
    const upstreamServers = upstreams
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (upstreamServers.length === 0) {
      toast.error("Add at least one upstream server.");
      return;
    }

    try {
      setSaving(true);
      await upsertDomainProxyConfig(teamSlug, domainId, {
        configId: editingId || undefined,
        name,
        subdomain: scope || undefined,
        upstream_servers: upstreamServers,
        preserve_host: preserveHost,
        websocket_enabled: websocketEnabled,
        health_check_path: healthCheckPath,
      });
      toast.success(editingId ? "Proxy pool updated." : "Proxy pool created.");
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save proxy pool.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (configId: string) => {
    if (!window.confirm("Remove this proxy pool?")) {
      return;
    }

    try {
      setRemovingId(configId);
      await deleteDomainProxyConfig(teamSlug, domainId, configId);
      toast.success("Proxy pool removed.");
      if (editingId === configId) {
        resetForm();
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove proxy pool.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-5">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-950/60">
            <Plus className="h-5 w-5 text-neutral-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100">
              {editingId ? "Edit upstream pool" : "Create upstream pool"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Set the primary target and any additional reverse-proxy upstreams used by the agent snapshot.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Scope
            </label>
            <select
              id="proxy-scope"
              aria-label="Scope"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            >
              {scopeOptions.map((option) => (
                <option key={option.value || "root"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Pool name
            </label>
            <input
              id="proxy-pool-name"
              aria-label="Pool name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Primary application pool"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Upstream servers
          </label>
          <textarea
            id="proxy-upstream-servers"
            aria-label="Upstream servers"
            value={upstreams}
            onChange={(event) => setUpstreams(event.target.value)}
            rows={6}
            placeholder={"http://127.0.0.1:3000\nhttp://127.0.0.1:3001"}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Put one URL on each line. The first server becomes the primary target for this scope.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Health check path
            </label>
            <input
              id="proxy-health-check-path"
              aria-label="Health check path"
              value={healthCheckPath}
              onChange={(event) => setHealthCheckPath(event.target.value)}
              placeholder="/health"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          <div className="flex flex-col justify-end gap-3 pb-1 text-sm text-neutral-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preserveHost}
                onChange={(event) => setPreserveHost(event.target.checked)}
                className="h-4 w-4 accent-white"
              />
              Preserve host header
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={websocketEnabled}
                onChange={(event) => setWebsocketEnabled(event.target.checked)}
                className="h-4 w-4 accent-white"
              />
              Enable WebSocket upgrades
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Create pool"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Current routing
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Root traffic defaults to the primary origin unless a scoped upstream pool overrides it.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Primary root origin
          </div>
          <div className="mt-2 font-mono text-sm text-neutral-200">
            {primaryTarget || "Not configured"}
          </div>
        </div>

        {reverseProxies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-950/30 px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900">
              <Globe className="h-6 w-6 text-neutral-500" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">No proxy pools configured</h3>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Create a pool when you want multiple upstreams, WebSocket tuning, or scoped routing for a subdomain.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reverseProxies.map((config) => (
              <div
                key={config._id}
                className="rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-100">{config.name}</h4>
                      <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {config.subdomain ? `${config.subdomain}.${domainName}` : domainName}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {(config.upstream_servers || []).map((server) => (
                        <div
                          key={server.url}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            Upstream
                          </span>
                          <ArrowRight className="h-3 w-3 text-neutral-500" />
                          <span className="font-mono text-xs">{server.url}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-neutral-400">
                      <span className="rounded-full border border-neutral-800 bg-neutral-900/70 px-2 py-1">
                        Preserve host: {config.preserve_host === false ? "Off" : "On"}
                      </span>
                      <span className="rounded-full border border-neutral-800 bg-neutral-900/70 px-2 py-1">
                        WebSockets: {config.websocket_enabled ? "On" : "Off"}
                      </span>
                      <span className="rounded-full border border-neutral-800 bg-neutral-900/70 px-2 py-1">
                        Health check: {config.health_check?.enabled ? config.health_check.path || "/" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(config)}
                      className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(config._id)}
                      disabled={removingId === config._id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {removingId === config._id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
