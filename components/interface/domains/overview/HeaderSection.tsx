"use client";

import { ExternalLink, PauseCircle, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

interface HeaderSectionProps {
  domainData: {
    name: string;
    status: string;
    origin: string;
    certExp: string;
    wafStatus: string;
  };
}

export function HeaderSection({ domainData }: HeaderSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyDomain = () => {
    navigator.clipboard.writeText(domainData.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 group">
            <h1 className="text-3xl font-semibold tracking-tight mr-1.5">
              {domainData.name}
            </h1>

            <div className="relative flex items-center">
              {/* Copy Button: Absolute position, fades in */}
              <button
                onClick={copyDomain}
                className="absolute left-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 rounded transition-all duration-200 z-10"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} className="text-neutral-400" />
                )}
              </button>

              {/* External Link Button: Shifts right on group hover */}
              <a
                href={`https://${domainData.name}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all duration-200 transform group-hover:translate-x-7"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4.5 py-2 cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-lg text-sm font-medium transition-all">
            <PauseCircle size={14} /> Pause
          </button>
          <button className="flex items-center gap-2 px-4.5 py-2 cursor-pointer bg-white text-black hover:bg-neutral-200 rounded-lg text-sm font-medium transition-all">
            <Terminal size={14} /> Live Logs
          </button>
        </div>
      </div>
    </div>
  );
}
