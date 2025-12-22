"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import UsageItem from "./components/usageItem";

const usageData = [
  {
    label: "Analytics Data points",
    current: 1400,
    limit: 10000,
    displayCurrent: "1.4K",
    displayLimit: "10K",
  },
  {
    label: "Cache Limit",
    current: 48000,
    limit: 1000000,
    displayCurrent: "48GB",
    displayLimit: "10GB",
  },
  {
    label: "DDoS Requests Mitigation",
    current: 909,
    limit: 50000,
    displayCurrent: "450GB",
    displayLimit: "10TB",
  }
];

export default function UsageCard() {
  const [usageOpen, setUsageOpen] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

      <div className="flex justify-center p-2 border-t border-neutral-800 group cursor-pointer hover:bg-neutral-900 transition-colors">
        <button
          aria-label="Toggle usage"
          onClick={() => setUsageOpen((s) => !s)}
          className="w-6 h-6 flex items-center justify-center rounded-full"
        >
          <svg
            className={`w-4 h-4 text-neutral-500 transform transition-transform ${
              usageOpen ? "rotate-180" : "rotate-0"
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

