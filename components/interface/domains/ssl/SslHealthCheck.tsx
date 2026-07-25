import { Check, Clock3, Shield, X } from "lucide-react";

type SslDomain = {
  verified?: boolean;
  auto_ssl?: boolean;
  ssl_enabled?: boolean;
  certificate_pem?: string | null;
};

type CheckState = "pass" | "pending" | "unavailable";

type HealthCheck = {
  name: string;
  detail: string;
  state: CheckState;
};

export function SslHealthCheck({ domain }: { domain?: SslDomain }) {
  const certificateConfigured = Boolean(domain?.ssl_enabled && domain?.certificate_pem);
  const checks: HealthCheck[] = [
    {
      name: "Domain ownership",
      detail: domain?.verified ? "Verified in the control plane" : "Waiting for DNS TXT verification",
      state: domain?.verified ? "pass" : "pending",
    },
    {
      name: "Certificate material",
      detail: certificateConfigured ? "Certificate configuration is present" : "No certificate configuration is stored",
      state: certificateConfigured ? "pass" : "unavailable",
    },
    {
      name: "Automatic SSL",
      detail: domain?.auto_ssl ? "Requested; provisioning status is not available" : "Not requested",
      state: domain?.auto_ssl ? "pending" : "unavailable",
    },
    {
      name: "Live TLS health",
      detail: "No live certificate or endpoint probe is configured",
      state: "unavailable",
    },
  ];

  return (
    <section className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
            <Shield size={16} className="text-neutral-400" /> Configuration health
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">
            Stored configuration only — this is not a live certificate security scan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {checks.map((check) => (
          <HealthCheckCard key={check.name} check={check} />
        ))}
      </div>
    </section>
  );
}

function HealthCheckCard({ check }: { check: HealthCheck }) {
  const presentation = {
    pass: { icon: Check, color: "text-emerald-400", label: "Configured" },
    pending: { icon: Clock3, color: "text-amber-400", label: "Pending" },
    unavailable: { icon: X, color: "text-neutral-500", label: "Unavailable" },
  }[check.state];
  const Icon = presentation.icon;

  return (
    <div className="flex flex-col p-3 rounded-lg border border-neutral-800/50 bg-neutral-900/50">
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className="text-xs font-semibold text-neutral-300">{check.name}</span>
        <Icon size={14} className={presentation.color} strokeWidth={3} />
      </div>
      <span className={`text-[10px] font-medium ${presentation.color}`}>{presentation.label}</span>
      <span className="mt-1 text-[10px] leading-relaxed text-neutral-500">{check.detail}</span>
    </div>
  );
}
