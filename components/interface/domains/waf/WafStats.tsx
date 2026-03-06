"use client";

import { Shield, Ban, Eye, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  { label: "Threats Blocked", value: "12,847", change: "+3.2%", positive: true, icon: Ban, gradient: "from-red-500 to-rose-500" },
  { label: "Challenges Issued", value: "3,412", change: "+1.8%", positive: true, icon: Eye, gradient: "from-amber-500 to-orange-500" },
  { label: "False Positives", value: "23", change: "-12.5%", positive: true, icon: AlertTriangle, gradient: "from-blue-500 to-indigo-500" },
  { label: "Rules Active", value: "1,336", change: "0%", positive: true, icon: Shield, gradient: "from-emerald-500 to-teal-500" },
];

export function WafStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.positive ? TrendingUp : TrendingDown;
        return (
          <div
            key={stat.label}
            className="group relative bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-lg`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendIcon size={10} />
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
              <div className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
