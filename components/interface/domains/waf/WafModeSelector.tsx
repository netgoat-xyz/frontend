"use client";

import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Check } from "lucide-react";
import { useState } from "react";

const modes = [
  {
    id: "off",
    label: "Off",
    description: "WAF disabled. All traffic passes through unfiltered.",
    icon: ShieldOff,
    gradient: "from-neutral-500 to-neutral-600",
  },
  {
    id: "detect",
    label: "Detect Only",
    description: "Log threats but don't block. Good for testing rules.",
    icon: Shield,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Block known OWASP Top 10 threats. Recommended for most sites.",
    icon: ShieldCheck,
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    id: "strict",
    label: "Strict (Hawk)",
    description: "AI-powered deep inspection. May increase latency by ~5ms.",
    icon: ShieldAlert,
    gradient: "from-red-500 to-rose-500",
  },
] as const;

export function WafModeSelector() {
  const [activeMode, setActiveMode] = useState("standard");

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
      <h3 className="font-semibold text-sm mb-4">Protection Mode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.id === activeMode;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${
                isActive
                  ? "border-neutral-700 bg-neutral-800/50"
                  : "border-neutral-800/50 hover:border-neutral-700/50 hover:bg-neutral-800/30"
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 p-0.5 bg-white rounded-full">
                  <Check size={10} className="text-black" />
                </div>
              )}
              <div className={`mb-3 p-2 bg-gradient-to-br ${mode.gradient} rounded-lg w-fit ${
                isActive ? "opacity-100" : "opacity-50 group-hover:opacity-70"
              } transition-opacity`}>
                <Icon size={16} className="text-white" />
              </div>
              <div className="text-sm font-semibold mb-1">{mode.label}</div>
              <div className="text-[10px] text-neutral-400 leading-relaxed">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
