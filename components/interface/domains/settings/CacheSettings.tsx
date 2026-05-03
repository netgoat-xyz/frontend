"use client";

import { Database, RotateCcw } from "lucide-react";
import { useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";

export function CacheSettings() {
  const [cacheLevel, setCacheLevel] = useState("aggressive");
  const [browserCacheTtl, setBrowserCacheTtl] = useState("respect");
  const [edgeCacheTtl, setEdgeCacheTtl] = useState("2h");

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <Database size={16} className="text-neutral-400" /> Caching
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Caching Level</div>
            <div className="text-[10px] text-neutral-500">How much of your site we cache</div>
          </div>
          <CustomSelect
            value={cacheLevel}
            onValueChange={setCacheLevel}
            options={[
              { value: "aggressive", label: "Aggressive" },
              { value: "standard", label: "Standard" },
              { value: "basic", label: "Basic" },
              { value: "bypass", label: "Bypass" },
            ]}
            triggerClassName="w-38 bg-neutral-800/50 border-neutral-700/50 text-xs"
          />
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Browser Cache TTL</div>
            <div className="text-[10px] text-neutral-500">Browser cache duration</div>
          </div>
          <CustomSelect
            value={browserCacheTtl}
            onValueChange={setBrowserCacheTtl}
            options={[
              { value: "respect", label: "Respect Headers" },
              { value: "1h", label: "1 Hour" },
              { value: "4h", label: "4 Hours" },
              { value: "1d", label: "1 Day" },
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
            ]}
            triggerClassName="w-38 bg-neutral-800/50 border-neutral-700/50 text-xs"
          />
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Edge Cache TTL</div>
            <div className="text-[10px] text-neutral-500">Edge server cache duration</div>
          </div>
          <CustomSelect
            value={edgeCacheTtl}
            onValueChange={setEdgeCacheTtl}
            options={[
              { value: "2h", label: "2 Hours" },
              { value: "4h", label: "4 Hours" },
              { value: "1d", label: "1 Day" },
              { value: "7d", label: "7 Days" },
            ]}
            triggerClassName="w-38 bg-neutral-800/50 border-neutral-700/50 text-xs"
          />
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Query String Caching</div>
            <div className="text-[10px] text-neutral-500">Include query strings in cache key</div>
          </div>
          <button className="relative w-11 h-6 bg-emerald-500 rounded-full transition-colors">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-sm font-medium text-neutral-200">Cache Everything</div>
            <div className="text-[10px] text-neutral-500">Cache all content including HTML</div>
          </div>
          <button className="relative w-11 h-6 bg-neutral-700 rounded-full transition-colors">
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>

        <div className="pt-3 flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all">
            <RotateCcw size={12} /> Purge Cache
          </button>
        </div>
      </div>
    </div>
  );
}
