"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import UsageItem from "./components/usageItem";
import { useParams } from "next/navigation";
import { listTeamDomains } from "@/actions/teamDomains";

type UsageDomain = {
  stats?: {
    total_requests?: number;
    bandwidth_used?: number;
  };
};

type UsageTotals = {
  requests: number;
  bandwidth: number;
};

export default function UsageCard() {
  const params = useParams();
  const teamSlug = params.teamName as string;
  const [usageOpen, setUsageOpen] = useState(true);
  const [animate, setAnimate] = useState(false);
  
  const [usageData, setUsageData] = useState([
    {
      label: "Analytics Data points",
      current: 0,
      limit: 10000,
      displayCurrent: "0",
      displayLimit: "10K",
    },
    {
      label: "Bandwidth Used",
      current: 0,
      limit: 1000000,
      displayCurrent: "0GB",
      displayLimit: "10GB",
    },
    {
      label: "Total Requests",
      current: 0,
      limit: 50000,
      displayCurrent: "0",
      displayLimit: "50K",
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!teamSlug) return;
    
    // Fetch actual data
    listTeamDomains(teamSlug).then((result) => {
       const domains = result as unknown as UsageDomain[];
       const stats = domains.reduce<UsageTotals>((acc, domain) => {
         if (domain.stats) {
           acc.requests += domain.stats.total_requests || 0;
           acc.bandwidth += domain.stats.bandwidth_used || 0;
         }
         return acc;
       }, { requests: 0, bandwidth: 0 });

       setUsageData([
         {
           label: "Analytics Data points",
           current: Math.min(stats.requests, 10000),
           limit: 10000,
           displayCurrent: (stats.requests > 1000 ? (stats.requests/1000).toFixed(1) + 'K' : stats.requests.toString()),
           displayLimit: "10K",
         },
         {
           label: "Bandwidth Used",
           current: Math.min(stats.bandwidth, 10000000000), // 10GB in bytes maybe
           limit: 10000000000,
           displayCurrent: (stats.bandwidth / (1024*1024)).toFixed(1) + "MB",
           displayLimit: "10GB",
         },
         {
           label: "Total Requests",
           current: Math.min(stats.requests, 50000),
           limit: 50000,
           displayCurrent: stats.requests.toString(),
           displayLimit: "50K",
         },
       ]);
    }).catch(console.error);

  }, [teamSlug]);

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <div className="text-neutral-100 text-[15px] font-medium">
          Last 30 days
        </div>
        <button className="bg-white text-black px-3 py-1 rounded-md font-medium text-xs hover:bg-neutral-200 transition-colors">
          Upgrade
        </button>
      </div>

      <AnimatePresence initial={false}>
        {usageOpen && (
          <motion.div
            key="usage-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="px-4 pb-2"
          >
            {usageData.map((item, index) => (
              <UsageItem key={index} {...item} animate={animate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onClick={() => setUsageOpen((s) => !s)}
        className="flex justify-center p-2 border-t border-neutral-800 group cursor-pointer hover:bg-neutral-900 transition-colors"
      >
        <button
          aria-label="Toggle usage"
          className="w-6 h-6 flex items-center justify-center rounded-full"
        >
          <svg
            className={`w-4 h-4 text-neutral-500 transform transition-transform ${
              usageOpen ? "rotate-0" : "rotate-180"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
