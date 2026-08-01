"use client";

import { updateDomainSslConfiguration } from "@/actions/teamDomains";
import { isLocalDevelopmentDomain } from "@/lib/domain-validation";
import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SslConfigurationForm({
  teamSlug,
  domainId,
  domainName,
  autoSslEnabled,
  hasManualCertificate,
}: {
  teamSlug: string;
  domainId: string;
  domainName: string;
  autoSslEnabled?: boolean;
  hasManualCertificate?: boolean;
}) {
  const router = useRouter();
  const [autoSsl, setAutoSsl] = useState(Boolean(autoSslEnabled));
  const [certificatePem, setCertificatePem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [clearManualSsl, setClearManualSsl] = useState(false);
  const [saving, setSaving] = useState(false);

  const localDevelopment = isLocalDevelopmentDomain(domainName);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDomainSslConfiguration(teamSlug, domainId, {
        auto_ssl: autoSsl,
        certificate_pem: certificatePem,
        private_key_pem: privateKeyPem,
        clear_manual_ssl: clearManualSsl,
      });
      toast.success("SSL settings saved.");
      setCertificatePem("");
      setPrivateKeyPem("");
      setClearManualSsl(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save SSL settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 backdrop-blur-md">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-950/60">
          <Lock className="h-5 w-5 text-neutral-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-100">TLS configuration</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Configure automatic SSL or store a manual certificate and private key for this domain.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <label className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/40 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-neutral-200">Automatic SSL</div>
            <div className="text-xs text-neutral-500">
              Leave this enabled for public domains that should request managed certificates.
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoSsl}
            onChange={(event) => setAutoSsl(event.target.checked)}
            className="h-4 w-4 accent-white"
          />
        </label>

        {localDevelopment && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Local development domain detected
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
              Reserved development domains skip public DNS verification. For local HTTPS, generate a local
              certificate with a tool like `mkcert` and paste the PEM pair below.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Certificate PEM
            </label>
            <textarea
              id="ssl-certificate-pem"
              aria-label="Certificate PEM"
              value={certificatePem}
              onChange={(event) => setCertificatePem(event.target.value)}
              rows={10}
              placeholder="-----BEGIN CERTIFICATE-----"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Private Key PEM
            </label>
            <textarea
              id="ssl-private-key-pem"
              aria-label="Private Key PEM"
              value={privateKeyPem}
              onChange={(event) => setPrivateKeyPem(event.target.value)}
              rows={10}
              placeholder="-----BEGIN PRIVATE KEY-----"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950/30 px-4 py-3 text-xs text-neutral-400">
          <p>Leave both PEM fields blank to keep the currently stored certificate unchanged.</p>
          {hasManualCertificate && (
            <label className="mt-3 flex items-center gap-2 text-neutral-300">
              <input
                type="checkbox"
                checked={clearManualSsl}
                onChange={(event) => setClearManualSsl(event.target.checked)}
                className="h-4 w-4 accent-white"
              />
              Clear the stored manual certificate on save
            </label>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save SSL settings"}
          </button>
        </div>
      </div>
    </section>
  );
}
