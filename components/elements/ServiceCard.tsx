"use client";
import React, { useState } from "react";

type Latest = {
  service_id: number;
  status: string;
  latency_ms?: number;
  cpu?: number;
  ram_mb?: number;
  disk_mb?: number;
  updated_at: number;
};

export function ServiceCard({ s, onAction }: { s: any; onAction: (id:number, action:'start'|'stop'|'restart')=>Promise<void> }) {
  const latest: Latest | null = s.latest || null;
  const statusColor = latest?.status === 'up' ? 'bg-green-500' : latest?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="rounded-lg border border-zinc-800 p-4 flex flex-col gap-3 bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <h3 className="font-semibold">{s.name}</h3>
        </div>
        <div className="text-xs text-zinc-400">{new URL(s.base_url).host}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-zinc-400">Status</div>
          <div className="font-medium">{latest?.status || 'unknown'}</div>
        </div>
        <div>
          <div className="text-zinc-400">Latency</div>
          <div className="font-medium">{latest?.latency_ms ?? '-'} ms</div>
        </div>
        <div>
          <div className="text-zinc-400">RAM</div>
          <div className="font-medium">{latest?.ram_mb ?? '-'} MB</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-zinc-800 rounded hover:bg-zinc-700 text-sm" onClick={()=>onAction(s.id,'start')}>Start</button>
        <button className="px-3 py-1.5 bg-zinc-800 rounded hover:bg-zinc-700 text-sm" onClick={()=>onAction(s.id,'stop')}>Stop</button>
        <button className="px-3 py-1.5 bg-zinc-800 rounded hover:bg-zinc-700 text-sm" onClick={()=>onAction(s.id,'restart')}>Restart</button>
        <a className="ml-auto text-sm text-blue-400 hover:underline" href={`/dashboard/${encodeURIComponent('control-plane')}/service/${s.id}`}>Details</a>
      </div>
    </div>
  )
}
