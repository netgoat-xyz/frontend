"use client";

import { Plus, Pencil, Trash2, Globe, Shield } from "lucide-react";

const fallbackRecords = [
  { id: 1, type: "A", name: "@", value: "76.76.21.21", ttl: "Auto", proxied: true },
  { id: 2, type: "A", name: "www", value: "76.76.21.21", ttl: "Auto", proxied: true },
  { id: 3, type: "AAAA", name: "@", value: "2606:4700:3030::6815:1521", ttl: "Auto", proxied: true },
  { id: 4, type: "CNAME", name: "api", value: "api.netgoat.xyz.cdn.netgoat.net", ttl: "Auto", proxied: true },
  { id: 5, type: "CNAME", name: "mail", value: "ghs.googlehosted.com", ttl: "3600", proxied: false },
  { id: 6, type: "MX", name: "@", value: "mx1.googlemail.com", ttl: "3600", proxied: false },
  { id: 7, type: "MX", name: "@", value: "mx2.googlemail.com", ttl: "3600", proxied: false },
  { id: 8, type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", ttl: "Auto", proxied: false },
  { id: 9, type: "TXT", name: "_dmarc", value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@netgoat.xyz", ttl: "Auto", proxied: false },
  { id: 10, type: "SRV", name: "_sip._tcp", value: "0 5 5060 sipserver.netgoat.xyz", ttl: "3600", proxied: false },
  { id: 11, type: "CAA", name: "@", value: '0 issue "letsencrypt.org"', ttl: "Auto", proxied: false },
];

const typeColors: Record<string, string> = {
  A: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  AAAA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CNAME: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MX: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  TXT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SRV: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  CAA: "bg-red-500/10 text-red-400 border-red-500/20",
  NS: "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

type DNSRecordRow = {
  id?: string | number
  _id?: string
  type: string
  name: string
  value: string
  ttl?: string | number
  proxied?: boolean
}

export function DnsRecords({ records = fallbackRecords }: { records?: DNSRecordRow[] }) {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-neutral-800/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Globe size={16} className="text-neutral-400" /> DNS Records
          <span className="ml-2 px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded-md text-[10px] text-neutral-400 font-medium">
            {records.length}
          </span>
        </h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-medium transition-all">
          <Plus size={12} /> Add Record
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-neutral-500 border-b border-neutral-800/50 bg-neutral-800/30">
              <th className="text-left px-5 py-3 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">Value</th>
              <th className="text-left px-4 py-3 uppercase tracking-wider">TTL</th>
              <th className="text-center px-4 py-3 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr
                key={r._id || r.id || `${r.type}-${r.name}-${idx}`}
                className="group border-b border-neutral-800/30 hover:bg-neutral-800/30 transition-all"
              >
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold ${typeColors[r.type] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-300">{r.name}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-neutral-400 max-w-[300px] truncate">
                  {r.value}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">{r.ttl ?? 'Auto'}</td>
                <td className="px-4 py-3 text-center">
                  {r.proxied ? (
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                      <Shield size={10} /> Proxied
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-500">DNS only</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors">
                      <Pencil size={12} className="text-neutral-400" />
                    </button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
