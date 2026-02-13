"use client";

import { List, Plus, MoreHorizontal } from "lucide-react";

const rules = [
  { id: 1, name: "OWASP Core Ruleset", type: "Managed", rules: 842, status: "active" },
  { id: 2, name: "Bot Management", type: "Managed", rules: 156, status: "active" },
  { id: 3, name: "Rate Limiting", type: "Custom", rules: 12, status: "active" },
  { id: 4, name: "Geo Blocking", type: "Custom", rules: 3, status: "active" },
  { id: 5, name: "API Protection", type: "Managed", rules: 234, status: "active" },
  { id: 6, name: "DDoS L7 Mitigation", type: "Managed", rules: 89, status: "paused" },
];

export function WafRules() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-800/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <List size={16} className="text-neutral-400" /> Rule Sets
        </h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-medium transition-all">
          <Plus size={12} /> Add Rule
        </button>
      </div>

      <div className="p-4 space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-800/50 hover:border-neutral-700/50 hover:bg-neutral-800/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${rule.status === "active" ? "bg-emerald-400" : "bg-neutral-500"}`} />
              <div>
                <div className="text-sm font-medium text-neutral-200">{rule.name}</div>
                <div className="text-[10px] text-neutral-500">
                  <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">{rule.type}</span>
                  <span className="ml-2">{rule.rules} rules</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                rule.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
              }`}>
                {rule.status}
              </span>
              <button className="p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700 rounded transition-all opacity-0 group-hover:opacity-100">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
