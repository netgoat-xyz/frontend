"use client";

import { Lock, ShieldCheck, RefreshCw, Copy, Check, Calendar, Server, Key } from "lucide-react";
import { useState } from "react";

export function SslCertificate() {
  const [copiedSerial, setCopiedSerial] = useState(false);
  
  const cert = {
    status: "active",
    issuer: "Let's Encrypt Authority X3",
    type: "DV (Domain Validated)",
    domains: ["netgoat.xyz", "*.netgoat.xyz"],
    issued: "2025-11-11",
    expires: "2026-05-08",
    daysLeft: 89,
    serial: "04:8A:3F:B2:C7:E1:9D:45:A8:2B:6C:F3:D0:E4:71:89",
    fingerprint: "A3:2F:8C:D1:E5:6B:94:07:F2:3A:C8:1D:B6:E9:04:5F:7A:2C:8B:D3",
    keyType: "EC P-256",
    signatureAlg: "SHA-256 with ECDSA",
    autoRenew: true,
  };

  const copySerial = () => {
    navigator.clipboard.writeText(cert.serial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  // Calculate progress for the visual bar
  const totalDuration = 180; // approximate days for 6 months
  const progressPercentage = ((totalDuration - cert.daysLeft) / totalDuration) * 100;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Main Certificate Status */}
      <div className="space-y-6 ">
        <div className="relative overflow-hidden bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-6 shadow-2xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 rounded-xl shadow-inner">
                <Lock size={28} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  {cert.domains[0]}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={10} /> Valid
                  </span>
                </h3>
                <p className="text-sm text-neutral-400 font-medium">{cert.issuer}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/50 rounded-lg text-xs font-semibold transition-all group">
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Renew Certificate
            </button>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-end">
                <div className="text-left">
                    <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Issued</div>
                    <div className="text-xs text-neutral-300 font-mono">{cert.issued}</div>
                </div>
                <div className="text-center pb-1">
                    <span className="text-sm font-bold text-emerald-400">{cert.daysLeft} Days</span>
                    <span className="text-xs text-neutral-500 ml-1">remaining</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Expires</div>
                    <div className="text-xs text-neutral-300 font-mono">{cert.expires}</div>
                </div>
            </div>
            
            <div className="h-3 bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-800 relative">
              {/* Progress Bar */}
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full relative"
                style={{ width: `${progressPercentage}%` }}
              >
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
              </div>
            </div>
          </div>

          {/* Technical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Serial Number Block */}
             <div className="bg-neutral-950/30 border border-neutral-800/50 rounded-lg p-3 group hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Serial Number</span>
                    <button onClick={copySerial} className="text-neutral-500 hover:text-emerald-400 transition-colors">
                        {copiedSerial ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
                <code className="text-[10px] text-neutral-400 font-mono break-all leading-relaxed">
                    {cert.serial}
                </code>
             </div>
             
             {/* Fingerprint Block */}
             <div className="bg-neutral-950/30 border border-neutral-800/50 rounded-lg p-3 group hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">SHA-256 Fingerprint</span>
                </div>
                <code className="text-[10px] text-neutral-400 font-mono break-all leading-relaxed">
                    {cert.fingerprint}
                </code>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Configuration Toggles & Meta */}
      <div className="space-y-4">
         {/* Configuration Card */}
        <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-xl p-5 h-full">
            <h4 className="font-bold text-sm text-neutral-200 mb-5 flex items-center gap-2">
                <Server size={14} className="text-neutral-500" /> Configuration
            </h4>
            
            <div className="space-y-4">
                {/* Auto Renew Toggle */}
                <div className="flex items-center justify-between p-3 bg-neutral-800/20 rounded-lg border border-neutral-800/50">
                    <div>
                        <div className="text-xs font-semibold text-neutral-200">Auto-Renewal</div>
                        <div className="text-[10px] text-neutral-500">Renews at 30 days</div>
                    </div>
                     <button className="relative w-9 h-5 bg-emerald-600 rounded-full transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform" />
                    </button>
                </div>

                {/* Force HTTPS Toggle */}
                <div className="flex items-center justify-between p-3 bg-neutral-800/20 rounded-lg border border-neutral-800/50">
                    <div>
                        <div className="text-xs font-semibold text-neutral-200">Always Use HTTPS</div>
                        <div className="text-[10px] text-neutral-500">Redirects HTTP traffic</div>
                    </div>
                     <button className="relative w-9 h-5 bg-emerald-600 rounded-full transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform" />
                    </button>
                </div>

                {/* HSTS Status */}
                 <div className="flex items-center justify-between p-3 bg-neutral-800/20 rounded-lg border border-neutral-800/50">
                    <div>
                        <div className="text-xs font-semibold text-neutral-200">HSTS Header</div>
                        <div className="text-[10px] text-neutral-500">Strict Transport Security</div>
                    </div>
                     <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/50">
                <h4 className="font-bold text-sm text-neutral-200 mb-3 flex items-center gap-2">
                    <Key size={14} className="text-neutral-500" /> Key Details
                </h4>
                <div className="space-y-2">
                     <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Type</span>
                        <span className="text-neutral-300 font-mono">{cert.keyType}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Signature</span>
                        <span className="text-neutral-300 font-mono">SHA-256 / ECDSA</span>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}