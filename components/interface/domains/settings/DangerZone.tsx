"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

export function DangerZone() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-5">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-red-400">
        <AlertTriangle size={16} /> Danger Zone
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border border-red-500/10 rounded-lg bg-red-500/5">
          <div>
            <div className="text-sm font-medium text-neutral-200">Pause Domain</div>
            <div className="text-[10px] text-neutral-500">
              Stop proxying traffic. DNS resolves but bypasses Netgoat.
            </div>
          </div>
          <button className="px-3 py-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-all">
            Pause
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-red-500/10 rounded-lg bg-red-500/5">
          <div>
            <div className="text-sm font-medium text-neutral-200">Remove Domain</div>
            <div className="text-[10px] text-neutral-500">
              Permanently delete domain with all config, analytics, and DNS.
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
