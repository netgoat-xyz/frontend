"use client";

import { Database, Gauge, RotateCcw, Save } from "lucide-react";
import { useState, type ReactNode } from "react";
import { updateDomainSettings, type RouteKeyMode, type RoutePolicy } from "@/actions/teamDomains";
import { CustomSelect } from "@/components/ui/custom-select";

type PolicyMode = "inherit" | "enabled" | "disabled";

type CacheSettingsProps = {
  teamSlug: string;
  domainId: string;
  initialRoutePolicy?: RoutePolicy | null;
};

const CACHE_MODE_OPTIONS = [
  { value: "inherit", label: "Inherit global policy" },
  { value: "enabled", label: "Enabled for this route" },
  { value: "disabled", label: "Disabled for this route" },
];

const TTL_OPTIONS = [
  { value: "inherit", label: "Inherit global TTL" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "900", label: "15 minutes" },
  { value: "3600", label: "1 hour" },
  { value: "14400", label: "4 hours" },
  { value: "86400", label: "1 day" },
];

const BANDWIDTH_MODE_OPTIONS = [
  { value: "inherit", label: "Inherit global policy" },
  { value: "enabled", label: "Enabled for this route" },
  { value: "disabled", label: "Disabled for this route" },
];

const BANDWIDTH_KEY_OPTIONS = [
  { value: "inherit", label: "Inherit global key" },
  { value: "ip", label: "Client IP" },
  { value: "host", label: "Host" },
  { value: "route", label: "Route" },
  { value: "global", label: "Global" },
];

function policyMode(value: boolean | undefined): PolicyMode {
  return value === undefined ? "inherit" : value ? "enabled" : "disabled";
}

function modeValue(value: PolicyMode): boolean | undefined {
  return value === "inherit" ? undefined : value === "enabled";
}

function optionalInteger(value: string, label: string, min: number, max: number): number | undefined {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number between ${min.toLocaleString()} and ${max.toLocaleString()}.`);
  }

  return parsed;
}

function optionalTtl(value: string): number | undefined {
  return value === "inherit" ? undefined : Number(value);
}

export function CacheSettings({ teamSlug, domainId, initialRoutePolicy }: CacheSettingsProps) {
  const initialCache = initialRoutePolicy?.cache;
  const initialBandwidth = initialRoutePolicy?.bandwidth;
  const [cacheMode, setCacheMode] = useState<PolicyMode>(() => policyMode(initialCache?.enabled));
  const [cacheTtl, setCacheTtl] = useState(() => initialCache?.ttl_seconds?.toString() ?? "inherit");
  const [maxEntries, setMaxEntries] = useState(() => initialCache?.max_entries?.toString() ?? "");
  const [maxBodyBytes, setMaxBodyBytes] = useState(() => initialCache?.max_body_bytes?.toString() ?? "");
  const [bandwidthMode, setBandwidthMode] = useState<PolicyMode>(() => policyMode(initialBandwidth?.enabled));
  const [bytesPerSecond, setBytesPerSecond] = useState(() => initialBandwidth?.bytes_per_second?.toString() ?? "");
  const [burstBytes, setBurstBytes] = useState(() => initialBandwidth?.burst_bytes?.toString() ?? "");
  const [bandwidthKey, setBandwidthKey] = useState<RouteKeyMode | "inherit">(
    () => initialBandwidth?.key ?? "inherit"
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const buildRoutePolicy = (): RoutePolicy => {
    const cache: NonNullable<RoutePolicy["cache"]> = {};
    const cacheEnabled = modeValue(cacheMode);
    const ttlSeconds = optionalTtl(cacheTtl);
    const entries = optionalInteger(maxEntries, "Maximum entries", 1, 100000);
    const bodyBytes = optionalInteger(maxBodyBytes, "Maximum body bytes", 1024, 104857600);

    if (cacheEnabled !== undefined) cache.enabled = cacheEnabled;
    if (ttlSeconds !== undefined) cache.ttl_seconds = ttlSeconds;
    if (entries !== undefined) cache.max_entries = entries;
    if (bodyBytes !== undefined) cache.max_body_bytes = bodyBytes;

    const bandwidth: NonNullable<RoutePolicy["bandwidth"]> = {};
    const bandwidthEnabled = modeValue(bandwidthMode);
    const rate = optionalInteger(bytesPerSecond, "Bytes per second", 1024, 10737418240);
    const burst = optionalInteger(burstBytes, "Burst bytes", 1024, 10737418240);

    if (bandwidthEnabled !== undefined) bandwidth.enabled = bandwidthEnabled;
    if (rate !== undefined) bandwidth.bytes_per_second = rate;
    if (burst !== undefined) bandwidth.burst_bytes = burst;
    if (bandwidthKey !== "inherit") bandwidth.key = bandwidthKey;

    const routePolicy: RoutePolicy = {};
    if (Object.keys(cache).length > 0) routePolicy.cache = cache;
    if (Object.keys(bandwidth).length > 0) routePolicy.bandwidth = bandwidth;
    return routePolicy;
  };

  const savePolicy = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await updateDomainSettings(teamSlug, domainId, { route_policy: buildRoutePolicy() });
      setStatus({ tone: "success", message: "Route policy saved. Changes will be included in the next agent snapshot." });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not save the route policy.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPolicy = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await updateDomainSettings(teamSlug, domainId, { route_policy: null });
      setCacheMode("inherit");
      setCacheTtl("inherit");
      setMaxEntries("");
      setMaxBodyBytes("");
      setBandwidthMode("inherit");
      setBytesPerSecond("");
      setBurstBytes("");
      setBandwidthKey("inherit");
      setStatus({ tone: "success", message: "Route overrides cleared. This route now inherits the agent defaults." });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not clear the route policy.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Database size={16} className="text-neutral-400" /> Route cache policy
          </h3>
          <p className="mt-1 text-[11px] text-neutral-500">
            Empty fields inherit the agent-wide defaults. Explicit values apply only to this domain route.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cache override" description="Enable, disable, or inherit cache behavior for this route.">
            <CustomSelect
              value={cacheMode}
              onValueChange={(value) => setCacheMode(value as PolicyMode)}
              options={CACHE_MODE_OPTIONS}
              triggerClassName="w-full bg-neutral-800/50 border-neutral-700/50 text-xs"
            />
          </Field>
          <Field label="Cache TTL" description="Seconds before a cached response expires.">
            <CustomSelect
              value={cacheTtl}
              onValueChange={setCacheTtl}
              options={TTL_OPTIONS}
              triggerClassName="w-full bg-neutral-800/50 border-neutral-700/50 text-xs"
            />
          </Field>
          <Field label="Maximum entries" description="Optional cache-entry cap, from 1 to 100,000.">
            <input
              type="number"
              min={1}
              max={100000}
              value={maxEntries}
              onChange={(event) => setMaxEntries(event.target.value)}
              placeholder="Inherit global limit"
              className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </Field>
          <Field label="Maximum response body" description="Optional cacheable-body cap in bytes, from 1 KiB to 100 MiB.">
            <input
              type="number"
              min={1024}
              max={104857600}
              value={maxBodyBytes}
              onChange={(event) => setMaxBodyBytes(event.target.value)}
              placeholder="Inherit global limit"
              className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </Field>
        </div>

        <div className="pt-5 border-t border-neutral-800/50">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Gauge size={15} className="text-neutral-400" /> Route bandwidth policy
          </h4>
          <p className="mt-1 text-[11px] text-neutral-500">
            Shape upload and download traffic without changing the global agent policy.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bandwidth override" description="Enable, disable, or inherit throttling for this route.">
              <CustomSelect
                value={bandwidthMode}
                onValueChange={(value) => setBandwidthMode(value as PolicyMode)}
                options={BANDWIDTH_MODE_OPTIONS}
                triggerClassName="w-full bg-neutral-800/50 border-neutral-700/50 text-xs"
              />
            </Field>
            <Field label="Bucket key" description="How traffic buckets are isolated.">
              <CustomSelect
                value={bandwidthKey}
                onValueChange={(value) => setBandwidthKey(value as RouteKeyMode | "inherit")}
                options={BANDWIDTH_KEY_OPTIONS}
                triggerClassName="w-full bg-neutral-800/50 border-neutral-700/50 text-xs"
              />
            </Field>
            <Field label="Bytes per second" description="Optional sustained rate, from 1 KiB/s to 10 GiB/s.">
              <input
                type="number"
                min={1024}
                max={10737418240}
                value={bytesPerSecond}
                onChange={(event) => setBytesPerSecond(event.target.value)}
                placeholder="Inherit global rate"
                className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
            </Field>
            <Field label="Burst bytes" description="Optional burst allowance, from 1 KiB to 10 GiB.">
              <input
                type="number"
                min={1024}
                max={10737418240}
                value={burstBytes}
                onChange={(event) => setBurstBytes(event.target.value)}
                placeholder="Inherit global burst"
                className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
            </Field>
          </div>
        </div>

        {status && (
          <p className={`text-xs ${status.tone === "success" ? "text-emerald-400" : "text-red-400"}`} role="status">
            {status.message}
          </p>
        )}

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={savePolicy}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-60 rounded-lg text-xs font-medium transition-all"
          >
            <Save size={12} /> {saving ? "Saving…" : "Save route policy"}
          </button>
          <button
            type="button"
            onClick={resetPolicy}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 disabled:opacity-60 rounded-lg text-xs font-medium transition-all"
          >
            <RotateCcw size={12} /> Reset overrides
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-300 block mb-1.5">{label}</label>
      {children}
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}
