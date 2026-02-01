"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ExternalLink, Info } from "lucide-react";

// Mock data for the sparklines
const data = [
  { val: 10 }, { val: 12 }, { val: 11 }, { val: 8 }, { val: 12 }, { val: 12 }
];

export default function CloudflareDashboard() {
  const [activeTab, setActiveTab] = useState("24h");
  
  return (
    <div className="min-h-screen bg-black text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <p className="text-sm text-slate-400">Overview</p>
            <h1 className="text-3xl font-bold text-white mb-2">netgoat.xyz</h1>
            <p className="text-sm text-slate-400">
              Monitor and configure how Cloudflare processes your web traffic...
            </p>
            <a href="#" className="text-blue-400 text-sm flex items-center mt-1 hover:underline">
              Review Cloudflare fundamentals <ExternalLink className="ml-1 w-3 h-3" />
            </a>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4 border-b border-slate-800 pb-0">
                {["24h", "7d", "30d"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "border-blue-500 text-white"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab === "24h" ? "24 Hours" : tab === "7d" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 uppercase">31 January — 1 February</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Unique Visitors", value: "34" },
                { label: "Total Requests", value: "70" },
                { label: "Percent Cached", value: "0%", sub: "0 B" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between border-b border-slate-800 py-4">
                  <div className="w-32">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                  <div className="flex-1 h-16 max-w-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <Line type="stepAfter" dataKey="val" stroke="#2563eb" strokeWidth={2} dot={{ r: 2, fill: '#2563eb' }} fill="#1e3a8a" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">DNS</h2>
            <div className="flex items-center text-sm mb-2">
              <span className="text-slate-400 mr-2">DNS Setup: Full</span>
              <Info className="w-3 h-3 text-slate-500" />
            </div>
            <a href="#" className="text-blue-400 text-sm hover:underline">DNS Records</a>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Control AI crawlers</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Block AI training bots</label>
              <p className="text-xs text-slate-500">Deploys a Cloudflare-managed rule to block bots...</p>
              <Select defaultValue="allow">
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Do not block (allow crawlers)</SelectItem>
                  <SelectItem value="block">Block all crawlers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Under Attack Mode</p>
                <p className="text-xs text-slate-500 italic">Show visitors a JavaScript challenge</p>
              </div>
              <Switch />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Development Mode</p>
                <p className="text-xs text-slate-500 italic">Bypass cache to see site changes</p>
              </div>
              <Switch />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}