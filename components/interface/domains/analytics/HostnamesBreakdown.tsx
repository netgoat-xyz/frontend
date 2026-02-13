"use client";

import { Copy,  Server } from "lucide-react";

const hostnames = [
  { hostname: "example.com", requests: "1.12M", pct: 39.4 },
  { hostname: "example.org", requests: "412K", pct: 14.5 },
  { hostname: "example.net", requests: "298K", pct: 10.5 },
  { hostname: "example.jp", requests: "203K", pct: 7.1 },
  { hostname: "example.fr", requests: "178K", pct: 6.3 },
  { hostname: "example.ca", requests: "134K", pct: 4.7 },
  { hostname: "example.au", requests: "98K", pct: 3.5 },
  { hostname: "Others", requests: "387K", pct: 13.6 },
];

// Helper to convert ISO code to Flag Emoji
const getFlagEmoji = (countryCode: string) => {
  if (countryCode === "UN") return "🌐"; // Fallback for "Others"
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export function HostnamesBreakdown() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <Server size={16} className="text-neutral-500" /> Most Visited Hostnames
      </h3>

      <div className="space-y-3">
        {hostnames.map((h) => (
          <div key={h.hostname} className="group select-text relative w-full">
            <div className="relative h-8 rounded overflow-hidden p-0 w-full">
              {/* Progress Bar Background */}
              <div
                className="absolute h-8 rounded bg-neutral-200 dark:bg-neutral-700 opacity-40 transition-all duration-500"
                style={{ width: `${h.pct}%` }} // Simplified width calculation
              ></div>

              {/* Row Content */}
              <div className="flex justify-between px-3 h-8 items-center relative z-10">
                <div className="relative flex items-center gap-2 overflow-hidden w-0 flex-1">
                  
                  <span
                    className="text-left text-sm leading-8 w-full truncate font-medium"
                    title={h.hostname}
                  >
                    {h.hostname}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center backdrop-blur px-1 rounded">
                    <Copy className="w-3 h-3 text-neutral-500 mr-1" />
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <span className="text-right text-sm font-semibold">
                    {h.requests}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}