"use client";

import { Copy, Globe } from "lucide-react";

const countries = [
  { country: "United States", code: "US", requests: "1.12M", pct: 39.4 },
  { country: "Germany", code: "DE", requests: "412K", pct: 14.5 },
  { country: "United Kingdom", code: "GB", requests: "298K", pct: 10.5 },
  { country: "Japan", code: "JP", requests: "203K", pct: 7.1 },
  { country: "France", code: "FR", requests: "178K", pct: 6.3 },
  { country: "Canada", code: "CA", requests: "134K", pct: 4.7 },
  { country: "Australia", code: "AU", requests: "98K", pct: 3.5 },
  { country: "Others", code: "UN", requests: "387K", pct: 13.6 }, // Changed -- to UN for a globe/map icon
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

export function GeoBreakdown() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <Globe size={16} className="text-neutral-500" /> Geographic Distribution
      </h3>

      <div className="space-y-3">
        {countries.map((c) => (
          <div key={c.country} className="group select-text relative w-full">
            <div className="relative h-8 rounded overflow-hidden p-0 w-full">
              {/* Progress Bar Background */}
              <div
                className="absolute h-8 rounded bg-neutral-200 dark:bg-neutral-700 opacity-40 transition-all duration-500"
                style={{ width: `${c.pct}%` }} // Simplified width calculation
              ></div>

              {/* Row Content */}
              <div className="flex justify-between px-3 h-8 items-center relative z-10">
                <div className="relative flex items-center gap-2 overflow-hidden w-0 flex-1">
                  {/* Flag Emoji Added Here */}
                  <span className="text-base leading-none" aria-hidden="true">
                    {getFlagEmoji(c.code)}
                  </span>
                  
                  <span
                    className="text-left text-sm leading-8 w-full truncate font-medium"
                    title={c.country}
                  >
                    {c.country}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center backdrop-blur px-1 rounded">
                    <Copy className="w-3 h-3 text-neutral-500 mr-1" />
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <span className="text-right text-sm font-semibold">
                    {c.requests}
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