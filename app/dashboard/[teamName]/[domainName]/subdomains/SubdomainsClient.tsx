"use client";

import { addSubdomain, removeSubdomain } from "@/actions/teamDomains";
import { sanitizeSubdomainLabel } from "@/lib/domain-validation";
import { validateOriginUrl } from "@/lib/origin-url";
import { Globe, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type SubdomainRecord = {
  subdomain: string;
  full_domain: string;
  target_url: string;
  active: boolean;
  proxy_configs?: unknown[];
};

export function SubdomainsClient({
  teamSlug,
  domainId,
  subdomains,
}: {
  teamSlug: string;
  domainId: string;
  subdomains: SubdomainRecord[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleCreate = async () => {
    const sanitizedLabel = sanitizeSubdomainLabel(label);
    const originValidation = validateOriginUrl(targetUrl);

    if (!sanitizedLabel) {
      toast.error("Subdomain label is required.");
      return;
    }

    if (!originValidation.valid) {
      toast.error(originValidation.message || "Origin URL is invalid.");
      return;
    }

    try {
      setSubmitting(true);
      await addSubdomain(teamSlug, domainId, {
        subdomain: sanitizedLabel,
        target_url: originValidation.normalized,
      });
      toast.success("Subdomain added.");
      setLabel("");
      setTargetUrl("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add subdomain.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (subdomain: string) => {
    if (!window.confirm(`Remove ${subdomain}?`)) {
      return;
    }

    try {
      setRemoving(subdomain);
      await removeSubdomain(teamSlug, domainId, subdomain);
      toast.success("Subdomain removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove subdomain.");
    } finally {
      setRemoving(null);
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
            <h3 className="text-base font-semibold text-neutral-100">Add subdomain</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Each subdomain gets its own primary origin. Additional upstream pools can be configured
              from the reverse-proxy page.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Label
            </label>
            <input
              id="subdomain-label"
              aria-label="Label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="api"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Origin URL
            </label>
            <input
              id="subdomain-origin-url"
              aria-label="Origin URL"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="http://127.0.0.1:4000"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </section>

      {subdomains.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-6 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900">
            <Globe className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-100">No subdomains yet</h3>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            Add `api`, `app`, or any other label you want to proxy under this domain.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subdomains.map((subdomain) => (
            <div
              key={subdomain.subdomain}
              className="flex flex-col gap-4 rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-100">{subdomain.full_domain}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      subdomain.active
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {subdomain.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-neutral-400">{subdomain.target_url}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {(subdomain.proxy_configs || []).length} additional upstream configuration
                  {(subdomain.proxy_configs || []).length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(subdomain.subdomain)}
                disabled={removing === subdomain.subdomain}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {removing === subdomain.subdomain ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
