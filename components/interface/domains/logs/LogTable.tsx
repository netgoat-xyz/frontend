"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

const logEntries = [
  { id: 1, time: "14:32:01.234", method: "GET", status: 200, path: "/api/v1/users", ip: "192.168.1.42", country: "US", size: "2.4 KB", duration: "45ms", ua: "Mozilla/5.0" },
  { id: 2, time: "14:31:58.891", method: "POST", status: 201, path: "/api/v1/auth/login", ip: "10.0.0.15", country: "DE", size: "1.1 KB", duration: "312ms", ua: "axios/1.6.0" },
  { id: 3, time: "14:31:55.442", method: "GET", status: 304, path: "/assets/bundle.js", ip: "172.16.0.8", country: "GB", size: "0 B", duration: "3ms", ua: "Chrome/120.0" },
  { id: 4, time: "14:31:52.103", method: "DELETE", status: 403, path: "/api/v1/admin/users/5", ip: "185.220.101.42", country: "RU", size: "0.2 KB", duration: "12ms", ua: "curl/8.4.0" },
  { id: 5, time: "14:31:48.667", method: "GET", status: 500, path: "/api/v1/data/stream", ip: "203.0.113.50", country: "JP", size: "0.5 KB", duration: "5012ms", ua: "Python/3.12" },
  { id: 6, time: "14:31:44.221", method: "PUT", status: 200, path: "/api/v1/settings", ip: "198.51.100.14", country: "CA", size: "0.8 KB", duration: "89ms", ua: "Mozilla/5.0" },
  { id: 7, time: "14:31:41.009", method: "GET", status: 200, path: "/blog/my-first-post", ip: "91.189.88.142", country: "FR", size: "14.2 KB", duration: "67ms", ua: "Googlebot/2.1" },
  { id: 8, time: "14:31:37.554", method: "POST", status: 429, path: "/api/v1/auth/login", ip: "45.33.32.156", country: "CN", size: "0.1 KB", duration: "2ms", ua: "Go-http/2.0" },
  { id: 9, time: "14:31:34.112", method: "GET", status: 200, path: "/", ip: "10.0.0.22", country: "US", size: "18.7 KB", duration: "42ms", ua: "Safari/17.2" },
  { id: 10, time: "14:31:30.887", method: "PATCH", status: 200, path: "/api/v1/users/me", ip: "172.16.0.3", country: "AU", size: "0.6 KB", duration: "78ms", ua: "Mozilla/5.0" },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColors = (status: number) => {
  if (status < 300) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status < 400) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (status < 500) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
};

export function LogTable() {
  const [selectedLog, setSelectedLog] = useState<number | null>(null);

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-neutral-500 border-b border-neutral-800/50 bg-neutral-800/30">
              <th className="text-left px-4 py-3 uppercase tracking-wider">Time</th>
              <th className="text-left px-3 py-3 uppercase tracking-wider">Method</th>
              <th className="text-left px-3 py-3 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Path</th>
              <th className="text-left px-3 py-3 uppercase tracking-wider">Origin</th>
              <th className="text-right px-3 py-3 uppercase tracking-wider">Size</th>
              <th className="text-right px-3 py-3 uppercase tracking-wider">Time</th>
              <th className="px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {logEntries.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log.id)}
                className={`group border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-all cursor-pointer ${
                  selectedLog === log.id ? 'bg-neutral-800/50' : ''
                }`}
              >
                <td className="px-4 py-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                  {log.time}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold ${methodColors[log.method] || "bg-neutral-500/10 text-neutral-400"}`}>
                    {log.method}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-xs font-semibold ${statusColors(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-neutral-300 max-w-[280px] truncate">
                  {log.path}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-neutral-400">{log.ip}</span>
                    <span className="px-1 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[9px] font-medium text-neutral-400">{log.country}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-neutral-400">
                  {log.size}
                </td>
                <td className={`px-3 py-3 text-right font-mono text-xs ${
                  parseInt(log.duration) > 1000 ? "text-red-400 font-semibold" : 
                  parseInt(log.duration) > 500 ? "text-amber-400" : "text-neutral-400"
                }`}>
                  {log.duration}
                </td>
                <td className="px-3 py-3">
                  <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800/50 bg-neutral-800/20">
        <span className="text-xs text-neutral-500">
          Showing <span className="font-medium text-neutral-300">1-10</span> of <span className="font-medium text-neutral-300">284,192</span> entries
        </span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1 text-xs bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-md transition-all">
            Previous
          </button>
          <button className="px-2.5 py-1 text-xs bg-white text-black font-medium rounded-md">1</button>
          <button className="px-2.5 py-1 text-xs bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-md transition-all">2</button>
          <button className="px-2.5 py-1 text-xs bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-md transition-all">3</button>
          <span className="text-xs text-neutral-500 px-1">...</span>
          <button className="px-2.5 py-1 text-xs bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-md transition-all">28,420</button>
          <button className="px-3 py-1 text-xs bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-md transition-all">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
