"use client";

import { Ban, Eye, AlertTriangle } from "lucide-react";

const events = [
  { id: 1, time: "2m ago", ip: "185.220.101.42", country: "DE", rule: "SQLi Detection", path: "/api/v1/users?id=1' OR 1=1", action: "blocked", severity: "critical" },
  { id: 2, time: "8m ago", ip: "45.33.32.156", country: "US", rule: "XSS Filter", path: "/blog/comment", action: "blocked", severity: "high" },
  { id: 3, time: "14m ago", ip: "103.224.182.250", country: "CN", rule: "Rate Limit", path: "/api/v1/auth/login", action: "challenged", severity: "medium" },
  { id: 4, time: "21m ago", ip: "198.51.100.14", country: "GB", rule: "Path Traversal", path: "/../../etc/passwd", action: "blocked", severity: "critical" },
  { id: 5, time: "34m ago", ip: "91.189.88.142", country: "RU", rule: "Bot Detection", path: "/api/v1/data", action: "challenged", severity: "low" },
  { id: 6, time: "1h ago", ip: "203.0.113.50", country: "JP", rule: "CSRF Token Missing", path: "/api/v1/settings", action: "blocked", severity: "high" },
  { id: 7, time: "1h ago", ip: "198.18.0.12", country: "US", rule: "Rate Limit", path: "/api/v1/search", action: "challenged", severity: "medium" },
  { id: 8, time: "2h ago", ip: "45.77.65.89", country: "SG", rule: "Command Injection", path: "/api/v1/exec", action: "blocked", severity: "critical" },
];

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const actionStyles: Record<string, { icon: typeof Ban; color: string }> = {
  blocked: { icon: Ban, color: "text-red-400" },
  challenged: { icon: Eye, color: "text-amber-400" },
};

export function WafEvents() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-800/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="text-neutral-400" /> Recent Events
        </h3>
        <span className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-md border border-neutral-700/50">Last 24 hours</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-neutral-500 border-b border-neutral-800/50 bg-neutral-800/30">
              <th className="text-left px-5 py-3 uppercase tracking-wider">Time</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Origin</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Rule</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Path</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Severity</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const action = actionStyles[e.action] || actionStyles.blocked;
              const ActionIcon = action.icon;
              return (
                <tr
                  key={e.id}
                  className="group border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-all"
                >
                  <td className="px-5 py-3 text-xs text-neutral-400">{e.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-neutral-300">{e.ip}</span>
                      <span className="px-1 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[9px] font-medium text-neutral-400">{e.country}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-neutral-200">{e.rule}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-neutral-400 max-w-[200px] truncate">
                    {e.path}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${severityStyles[e.severity]}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${action.color}`}>
                      <ActionIcon size={12} />
                      {e.action}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
