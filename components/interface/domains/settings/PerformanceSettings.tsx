"use client";

import { Sliders } from "lucide-react";

export function PerformanceSettings() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <Sliders size={16} className="text-neutral-400" /> Performance
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Auto Minify</div>
            <div className="text-[10px] text-neutral-500">Minify JS, CSS, and HTML on the fly</div>
          </div>
          <div className="flex gap-1.5">
            {["JS", "CSS", "HTML"].map((type) => (
              <button
                key={type}
                className="px-2 py-1 text-[10px] font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Brotli Compression</div>
            <div className="text-[10px] text-neutral-500">Apply Brotli to text resources</div>
          </div>
          <button className="relative w-11 h-6 bg-emerald-500 rounded-full transition-colors">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">HTTP/2</div>
            <div className="text-[10px] text-neutral-500">Enhanced protocol for performance</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            Enabled
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">HTTP/3 (QUIC)</div>
            <div className="text-[10px] text-neutral-500">Faster connections with QUIC</div>
          </div>
          <button className="relative w-11 h-6 bg-emerald-500 rounded-full transition-colors">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-neutral-800/30">
          <div>
            <div className="text-sm font-medium text-neutral-200">Early Hints (103)</div>
            <div className="text-[10px] text-neutral-500">Send preload hints early</div>
          </div>
          <button className="relative w-11 h-6 bg-emerald-500 rounded-full transition-colors">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-sm font-medium text-neutral-200">Image Optimization</div>
            <div className="text-[10px] text-neutral-500">Auto WebP/AVIF conversion</div>
          </div>
          <button className="relative w-11 h-6 bg-neutral-700 rounded-full transition-colors">
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
