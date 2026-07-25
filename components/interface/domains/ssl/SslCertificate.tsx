"use client";

import { AlertTriangle, Check, Clock3, KeyRound, Lock, Server } from "lucide-react";

type SslDomain = {
  domain?: string;
  verified?: boolean;
  auto_ssl?: boolean;
  ssl_enabled?: boolean;
  certificate_pem?: string | null;
};

type CertificateState = {
  label: string;
  description: string;
  icon: typeof Check;
  accent: string;
  badge: string;
};

function getCertificateState(domain?: SslDomain): CertificateState {
  const certificateConfigured = Boolean(domain?.ssl_enabled && domain?.certificate_pem);

  if (certificateConfigured) {
    return {
      label: "Certificate configured",
      description: "Certificate material is stored for this domain. Validity, issuer, and renewal dates are not recorded by the current model.",
      icon: Check,
      accent: "text-emerald-400",
      badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    };
  }

  if (domain?.auto_ssl) {
    return {
      label: "Certificate provisioning pending",
      description: domain.verified
        ? "Automatic SSL is requested, but no certificate material has been provisioned yet."
        : "Verify domain ownership before automatic certificate provisioning can begin.",
      icon: Clock3,
      accent: "text-amber-400",
      badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    };
  }

  return {
    label: "No certificate configured",
    description: domain?.verified
      ? "Upload or configure a certificate before serving TLS for this domain."
      : "Domain ownership is still pending; no certificate has been configured.",
    icon: AlertTriangle,
    accent: "text-neutral-400",
    badge: "bg-neutral-500/10 border-neutral-500/20 text-neutral-400",
  };
}

export function SslCertificate({ domain }: { domain?: SslDomain }) {
  const state = getCertificateState(domain);
  const StateIcon = state.icon;
  const certificateConfigured = Boolean(domain?.ssl_enabled && domain?.certificate_pem);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 relative overflow-hidden bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 rounded-xl shadow-inner">
            <Lock size={28} className={state.accent} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-100">{domain?.domain ?? "Domain"}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${state.badge}`}>
                <StateIcon size={10} /> {state.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400 leading-relaxed">{state.description}</p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatusItem
            label="Domain verification"
            value={domain?.verified ? "Verified" : "Pending"}
            tone={domain?.verified ? "success" : "pending"}
          />
          <StatusItem
            label="Certificate material"
            value={certificateConfigured ? "Configured" : "Not configured"}
            tone={certificateConfigured ? "success" : "neutral"}
          />
          <StatusItem
            label="Automatic SSL"
            value={domain?.auto_ssl ? "Requested" : "Not requested"}
            tone={domain?.auto_ssl ? "pending" : "neutral"}
          />
        </div>

        <div className="relative mt-6 rounded-lg border border-neutral-800/50 bg-neutral-950/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
            <KeyRound size={15} className="text-neutral-500" /> Certificate metadata
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            Serial number, fingerprint, issuer, issue date, and expiry date are unavailable until the control plane stores verified certificate metadata.
          </p>
        </div>
      </section>

      <aside className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-5">
        <h4 className="font-bold text-sm text-neutral-200 mb-4 flex items-center gap-2">
          <Server size={14} className="text-neutral-500" /> TLS configuration
        </h4>
        <p className="text-xs leading-relaxed text-neutral-500">
          This page reports the configuration stored by NetGoat. It does not make a live TLS connection or claim certificate health.
        </p>
      </aside>
    </div>
  );
}

function StatusItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "pending" | "neutral";
}) {
  const valueClass = {
    success: "text-emerald-400",
    pending: "text-amber-400",
    neutral: "text-neutral-300",
  }[tone];

  return (
    <div className="rounded-lg border border-neutral-800/50 bg-neutral-950/30 p-3">
      <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 text-sm font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}
