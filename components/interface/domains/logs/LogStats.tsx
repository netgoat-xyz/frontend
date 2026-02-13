"use client";

import { BarChart3, Clock, AlertCircle, Zap, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  { label: "Total Requests", value: "284,192", subtext: "Last 24h", change: "+12.5%", positive: true, icon: BarChart3, gradient: "from-indigo-500 to-purple-500" },
  { label: "Avg Response", value: "142ms", subtext: "p99: 890ms", change: "-8.2%", positive: true, icon: Clock, gradient: "from-emerald-500 to-teal-500" },
  { label: "Error Rate", value: "1.8%", subtext: "5,116 errors", change: "+0.3%", positive: false, icon: AlertCircle, gradient: "from-rose-500 to-red-500" },
  { label: "Throughput", value: "3.2K/s", subtext: "Peak: 8.4K/s", change: "+15.7%", positive: true, icon: Zap, gradient: "from-amber-500 to-orange-500" },
];

export function LogStats() {
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
                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 bg-gradient-to-br ${stat.gradient} rounded-lg opacity-80`}>
                  <Icon size={12} className="text-white" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{stat.subtext}</div>
                </div>
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendIcon size={10} />
                  {stat.change}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
