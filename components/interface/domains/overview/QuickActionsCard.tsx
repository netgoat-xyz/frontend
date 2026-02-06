"use client";

import Modal from "@/components/elements/Modal";
import { Zap, RotateCcw } from "lucide-react";
import React from "react";

export function QuickActionsCard() {
  const [purgeCache, setPurgeCache] = React.useState(false);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-sm uppercase text-neutral-500 mb-4 flex items-center gap-2">
        <Zap size={16} /> Quick Actions
      </h3> 
      <div className="space-y-4">
        <div className="flex items-center justify-between group cursor-pointer">
          <div>
            <div className="text-sm font-medium group-hover:text-indigo-400 transition-colors">
              Dev Mode
            </div>
            <div className="text-[10px] text-neutral-500">
              Bypass cache for 3 hours
            </div>
          </div>
          <div className="w-10 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full relative transition-colors">
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between group cursor-pointer">
          <div>
            <div className="text-sm font-medium group-hover:text-indigo-400 transition-colors">
              Under Attack
            </div>
            <div className="text-[10px] text-neutral-500">
              Show JS challenge to all
            </div>
          </div>
          <div className="w-10 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full relative transition-colors">
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between group cursor-pointer">
          <div>
            <div className="text-sm font-medium group-hover:text-indigo-400 transition-colors">
              Force HTTPS
            </div>
            <div className="text-[10px] text-neutral-500">
              Redirect all HTTP to HTTPS
            </div>
          </div>
          <div className="w-10 h-5 bg-indigo-400 rounded-full relative">
            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>

      <button
        onClick={() => setPurgeCache(true)}
        className="w-full mt-6 inline-flex items-center cursor-pointer justify-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 hover:text-red-600 transition-all"
      >
        <RotateCcw size={12} />
        Purge Cache
      </button>
      <Modal
        isOpen={purgeCache}
        onClose={() => setPurgeCache(false)}
        title={"Purge Cache?"}
        actionButtons={
          <>
            <button
              onClick={() => setPurgeCache(false)}
              className="px-4 py-2 text-sm bg-neutral-500/10 border-neutral-500/30 border rounded-md text-neutral-400 hover:bg-neutral-500/20 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Add your purge logic here
                setPurgeCache(false);
              }}
              className="px-4 py-2 text-sm border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 transition-all cursor-pointer rounded-md"
            >
              Purge
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-400">
          Are you sure you want to purge the cache? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
