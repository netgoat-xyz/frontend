"use client";

import { Server, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

const nameservers = [
  { ns: "ns1.netgoat.net", ip: "172.64.32.1", status: "active", responseTime: "12ms" },
  { ns: "ns2.netgoat.net", ip: "172.64.33.1", status: "active", responseTime: "14ms" },
  { ns: "ns3.netgoat.net", ip: "108.162.192.1", status: "active", responseTime: "18ms" },
];

const propagationChecks = [
  { location: "US East (Virginia)", status: "propagated", time: "2m ago" },
  { location: "EU West (Frankfurt)", status: "propagated", time: "2m ago" },
  { location: "Asia (Tokyo)", status: "propagated", time: "3m ago" },
  { location: "Oceania (Sydney)", status: "propagating", time: "checking..." },
  { location: "South America (São Paulo)", status: "propagated", time: "4m ago" },
];

export function DnsNameservers() {
  return (
    <div className="space-y-4">
      {/* Nameservers */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <Server size={16} className="text-neutral-400" /> Nameservers
        </h3>
        <div className="space-y-2">
          {nameservers.map((ns) => (
            <div
              key={ns.ns}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-800/50 hover:border-neutral-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={12} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-mono text-neutral-200">{ns.ns}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{ns.ip}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-md border border-neutral-700/50">
                <Clock size={10} /> {ns.responseTime}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Propagation */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4">DNS Propagation Status</h3>
        <div className="space-y-2">
          {propagationChecks.map((check) => (
            <div
              key={check.location}
              className="flex items-center justify-between py-2.5 px-1 border-b border-neutral-800/30 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                {check.status === "propagated" ? (
                  <div className="p-1 bg-emerald-500/10 rounded">
                    <CheckCircle size={12} className="text-emerald-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-amber-500/10 rounded">
                    <Loader2 size={12} className="text-amber-400 animate-spin" />
                  </div>
                )}
                <span className="text-sm text-neutral-300">{check.location}</span>
              </div>
              <span className="text-xs text-neutral-500">{check.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
