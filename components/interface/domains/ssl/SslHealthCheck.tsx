"use client";

import { Check, AlertTriangle, X, Shield, Activity } from "lucide-react";

const checks = [
  { name: "Certificate Valid", status: "pass", detail: "Valid until May 8, 2026" },
  { name: "Chain of Trust", status: "pass", detail: "Full chain verified" },
  { name: "OCSP Stapling", status: "pass", detail: "Response valid" },
  { name: "CT Logs", status: "pass", detail: "Present in 3 logs" },
  { name: "HSTS Header", status: "pass", detail: "max-age=31536000" },
  { name: "HSTS Preload", status: "warn", detail: "Not in preload list" },
  { name: "TLS 1.3", status: "pass", detail: "Enabled (0-RTT)" },
  { name: "Legacy TLS", status: "pass", detail: "1.0/1.1 Disabled" },
  { name: "Forward Secrecy", status: "pass", detail: "ECDHE active" },
  { name: "Weak Ciphers", status: "pass", detail: "None detected" },
  { name: "Mixed Content", status: "warn", detail: "2 HTTP resources" },
  { name: "CAA Record", status: "pass", detail: "letsencrypt.org" },
];

export function SslHealthCheck() {
  const passCount = checks.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  // Helper to get status styles
  const getStatusStyle = (status: string) => {
    switch(status) {
        case 'pass': return { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        case 'warn': return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        case 'fail': return { icon: X, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        default: return { icon: Activity, color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' };
    }
  }

  return (
    <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" /> 
            Configuration Health
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">Automated security analysis of your SSL setup</p>
        </div>
        
        {/* Score Badge */}
        <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Security Grade</span>
                <span className="text-xs text-neutral-400">{passCount}/{checks.length} Checks Passed</span>
             </div>
             <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                A+
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {checks.map((check, index) => {
          const style = getStatusStyle(check.status);
          const Icon = style.icon;
          
          return (
            <div 
                key={index} 
                className={`flex flex-col p-3 rounded-lg border bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors ${check.status === 'warn' ? 'border-amber-900/30' : 'border-neutral-800/50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-neutral-300">{check.name}</span>
                <div className={`p-1 rounded-md ${style.bg} ${style.color}`}>
                    <Icon size={12} strokeWidth={3} />
                </div>
              </div>
              <span className={`text-[10px] font-medium truncate ${check.status === 'warn' ? 'text-amber-500/80' : 'text-neutral-500'}`}>
                {check.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}