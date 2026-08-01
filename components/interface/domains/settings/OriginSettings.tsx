"use client";

import { updateDomainOrigin } from "@/actions/teamDomains";
import { validateOriginUrl } from "@/lib/origin-url";
import { Save, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function OriginSettings({
  teamSlug,
  domainId,
  initialTargetUrl,
}: {
  teamSlug: string;
  domainId: string;
  initialTargetUrl?: string;
}) {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl || "");
  const [saving, setSaving] = useState(false);

  const validation = validateOriginUrl(targetUrl);

  const handleSave = async () => {
    if (!validation.valid) {
      toast.error(validation.message || "Origin URL is invalid.");
      return;
    }

    try {
      setSaving(true);
      await updateDomainOrigin(teamSlug, domainId, {
        target_url: validation.normalized,
      });
      setTargetUrl(validation.normalized);
      toast.success("Origin saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save origin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Server size={16} className="text-neutral-400" /> Origin Configuration
      </h3>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-neutral-400">Primary Origin URL</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            className="w-full rounded-lg border border-neutral-700/50 bg-neutral-800/50 px-3 py-2 text-sm font-mono text-neutral-100 transition-all focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <p className={`mt-1.5 text-[10px] ${validation.valid ? "text-neutral-500" : "text-rose-300"}`}>
            {validation.valid
              ? "This is the primary upstream target for the root domain. Additional upstreams can be configured on the reverse-proxy page."
              : validation.message}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-800/50 bg-neutral-950/30 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Accepted formats
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              `http://127.0.0.1:3000`, `http://app.localhost:8080`, or `https://origin.internal`
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800/50 bg-neutral-950/30 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Local testing
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Reserved localhost and test domains are supported for stable end-to-end proxy development.
            </div>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !validation.valid}
            className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition-all hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={12} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
