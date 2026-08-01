"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Globe,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { getTeam } from "@/actions/teams";
import { createDomainForTeam } from "@/actions/teamDomains";
import {
  generateDomainVerification,
  verifyDomainOwnership,
} from "@/actions/domainVerification";
import { sanitizeDomainInput, validateDomainSyntax } from "@/lib/domain-validation";
import { validateOriginUrl } from "@/lib/origin-url";
import { cn } from "@/lib/utils";

type TeamSummary = {
  name?: string;
};

type VerificationMode = "dns" | "local";

export default function NewDomainPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamName as string;

  const [teamData, setTeamData] = useState<TeamSummary | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [step, setStep] = useState<"input" | "verify">("input");
  const [domain, setDomain] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [autoSsl, setAutoSsl] = useState(true);
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationMode, setVerificationMode] = useState<VerificationMode>("dns");
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!teamSlug) return;

    getTeam(teamSlug)
      .then((data) => {
        if (typeof data === "object" && data !== null && "name" in data && typeof data.name === "string") {
          setTeamData({ name: data.name });
          return;
        }

        setTeamData(null);
      })
      .catch((error) => {
        console.error(error);
        setTeamData(null);
      })
      .finally(() => setLoadingTeam(false));
  }, [teamSlug]);

  const teamLabel = useMemo(() => {
    return loadingTeam ? "Project" : teamData?.name || "Project";
  }, [loadingTeam, teamData?.name]);

  const handleNext = async () => {
    const domainValidation = validateDomainSyntax(domain);
    const originValidation = validateOriginUrl(originUrl);

    if (!domainValidation.valid) {
      toast.error(domainValidation.message || "Enter a valid domain.");
      return;
    }

    if (!originValidation.valid) {
      toast.error(originValidation.message || "Enter a valid origin URL.");
      return;
    }

    setDomain(domainValidation.sanitized);
    setOriginUrl(originValidation.normalized);

    try {
      setSubmitting(true);
      const result = await generateDomainVerification(teamSlug, domainValidation.sanitized);
      if (!result.success || !result.token) {
        throw new Error("Failed to prepare domain verification.");
      }

      setVerificationToken(result.token);
      setVerificationMode(result.verificationMode === "local" ? "local" : "dns");
      setStep("verify");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to prepare verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    const domainValidation = validateDomainSyntax(domain);
    const originValidation = validateOriginUrl(originUrl);

    if (!domainValidation.valid) {
      toast.error(domainValidation.message || "Enter a valid domain.");
      return;
    }

    if (!originValidation.valid) {
      toast.error(originValidation.message || "Enter a valid origin URL.");
      return;
    }

    try {
      setSubmitting(true);
      const verification = await verifyDomainOwnership(
        teamSlug,
        domainValidation.sanitized,
        verificationToken,
      );

      if (!verification.success || !verification.verified) {
        toast.error(verification.message || "Verification is still pending.");
        return;
      }

      await createDomainForTeam(teamSlug, {
        domain: domainValidation.sanitized,
        target_url: originValidation.normalized,
        auto_ssl: autoSsl,
        verification_token: verificationToken,
      });

      if (verificationMode === "local") {
        toast.success("Local development domain created.");
        toast.info("Open the SSL page next if you want to install a local certificate.");
        router.push(`/dashboard/${teamSlug}/${domainValidation.sanitized}/ssl`);
      } else {
        toast.success("Domain verified and created.");
        router.push(`/dashboard/${teamSlug}/${domainValidation.sanitized}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create domain.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success("Copied.");
    setTimeout(() => setCopiedField(null), 1500);
  };

  const verificationActionLabel = verificationMode === "local" ? "Create Domain" : "Verify & Create";

  return (
    <div className="min-h-svh bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link
            href={`/dashboard/${teamSlug}`}
            className="mb-6 inline-flex items-center text-sm text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to {teamLabel}
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
            Add a domain to {teamLabel}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Connect a public domain or a local development hostname, point it at an origin, and keep the
            proxy configuration ready for the agent snapshot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "input", label: "Configure" },
            { id: "verify", label: verificationMode === "local" ? "Review" : "Verify" },
          ].map((item, index) => (
            <div key={item.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center text-sm font-medium transition-colors",
                  step === item.id || (item.id === "input" && step === "verify")
                    ? "text-neutral-100"
                    : "text-neutral-500",
                )}
              >
                <span
                  className={cn(
                    "mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    step === item.id
                      ? "bg-white text-black"
                      : item.id === "input" && step === "verify"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-neutral-900 text-neutral-500",
                  )}
                >
                  {item.id === "input" && step === "verify" ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {item.label}
              </div>
              {index === 0 && <div className="mx-3 h-px w-8 bg-neutral-800" />}
            </div>
          ))}
        </div>

        {step === "input" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                  <Globe className="h-6 w-6 text-sky-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-100">Domain routing</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Choose the hostname users will visit and the upstream origin NetGoat should proxy to first.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Domain
                  </label>
                  <input
                    id="domain-name"
                    aria-label="Domain"
                    value={domain}
                    onChange={(event) => setDomain(sanitizeDomainInput(event.target.value))}
                    placeholder="app.example.com or app.localhost"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Origin URL
                  </label>
                  <input
                    id="origin-url"
                    aria-label="Origin URL"
                    value={originUrl}
                    onChange={(event) => setOriginUrl(event.target.value)}
                    placeholder="http://127.0.0.1:3000"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    The first upstream becomes the primary route target. You can add additional servers later.
                  </p>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Request automatic SSL</div>
                    <div className="text-xs text-neutral-500">
                      Public domains can request managed certificates. Local domains usually need a manual certificate.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSsl}
                    onChange={(event) => setAutoSsl(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                </label>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="text-sm font-semibold text-neutral-200">Environment tips</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-400">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                  Public domains use DNS TXT verification before they are marked trusted.
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                  `localhost`, `.test`, `.local`, and similar reserved development domains skip public DNS checks.
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                  You can refine upstream pools, WebSocket support, and health checks after creation.
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="mb-6 flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border",
                  verificationMode === "local"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-amber-500/20 bg-amber-500/10",
                )}
              >
                {verificationMode === "local" ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-300" />
                ) : (
                  <Lock className="h-6 w-6 text-amber-300" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">
                  {verificationMode === "local" ? "Review local setup" : "Verify domain ownership"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {verificationMode === "local"
                    ? "This domain matches a reserved local-development suffix, so NetGoat can trust it without waiting on public DNS."
                    : "Create the TXT record below, wait for propagation, and then verify ownership before the domain is activated."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryItem label="Domain" value={domain} />
              <SummaryItem label="Origin" value={originUrl} mono />
              <SummaryItem label="Automatic SSL" value={autoSsl ? "Requested" : "Disabled"} />
            </div>

            {verificationMode === "dns" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 divide-y divide-neutral-800 overflow-hidden">
                  <CopyRow
                    label="Record type"
                    value="TXT"
                    field="type"
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                  <CopyRow
                    label="Host"
                    value="_netgoat-verify"
                    field="host"
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                  <CopyRow
                    label="Value"
                    value={verificationToken}
                    field="value"
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                    mono
                  />
                </div>

                <div className="rounded-xl border border-sky-500/15 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                  <div className="flex items-center gap-2 font-medium">
                    <Info className="h-4 w-4" />
                    DNS propagation can take a few minutes
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
                    Once the TXT record resolves for `_netgoat-verify.{domain}`, verify and create the domain.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  No public DNS verification required
                </div>
                <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                  This domain will be created immediately. If you want HTTPS locally, the SSL page is the best
                  place to install a local certificate after creation.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("input")}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working
                  </>
                ) : (
                  verificationActionLabel
                )}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={cn("mt-1 text-sm text-neutral-100", mono && "font-mono text-xs")}>{value}</div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  field,
  copiedField,
  onCopy,
  mono = false,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (value: string, field: string) => Promise<void>;
  mono?: boolean;
}) {
  return (
    <div
      className="group flex cursor-pointer items-center justify-between px-4 py-4 transition-colors hover:bg-neutral-900/60"
      onClick={() => onCopy(value, field)}
    >
      <div className="min-w-0 pr-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
        <div className={cn("mt-1 text-sm text-neutral-100", mono && "truncate font-mono text-xs")}>{value}</div>
      </div>
      <div className="text-neutral-500 transition-colors group-hover:text-neutral-200">
        {copiedField === field ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
      </div>
    </div>
  );
}
