"use client";

import { Server, Save } from "lucide-react";

export function OriginSettings() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-5">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <Server size={16} className="text-neutral-400" /> Origin Configuration
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-2">Origin Address</label>
          <input
            type="text"
            defaultValue="http://10.0.0.4:3000"
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
          />
          <p className="text-[10px] text-neutral-500 mt-1.5">The IP address or hostname of your origin server</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-2">Origin Port</label>
            <input
              type="text"
              defaultValue="3000"
              className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-2">Origin Protocol</label>
            <select className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 block mb-2">Host Header Override</label>
          <input
            type="text"
            placeholder="Leave empty to use domain name"
            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all placeholder:text-neutral-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-2">Connection Timeout</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={30}
                className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
              />
              <span className="text-xs text-neutral-500 whitespace-nowrap">sec</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-2">Keep-Alive Timeout</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={90}
                className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
              />
              <span className="text-xs text-neutral-500 whitespace-nowrap">sec</span>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-medium transition-all">
            <Save size={12} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
