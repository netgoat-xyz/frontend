"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export interface AlertData {
  _id: string;
  variant: "red" | "yellow" | "blue";
  title: string;
  body: string;
  actionText: string;
}

export default function AlertsCard({ initialAlerts = [] }: { initialAlerts?: AlertData[] }) {
  const [alertsOpen, setAlertsOpen] = useState(true);

  if (initialAlerts.length === 0) {
    return (
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="text-neutral-500 text-sm text-center">
          No active alerts.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <div className="text-neutral-100 text-[15px] font-medium">
          Latest Alerts
        </div>
      </div>

      <AnimatePresence initial={false}>
        {alertsOpen && (
          <motion.div
            key="alerts-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="px-4 pb-2"
          >
            {initialAlerts.map((a) => {
              const bg =
                a.variant === "red"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : a.variant === "yellow"
                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400";
              const dot =
                a.variant === "red"
                  ? "bg-red-500"
                  : a.variant === "yellow"
                    ? "bg-yellow-500"
                    : "bg-blue-500";
              return (
                <div
                  key={a._id}
                  className={`mb-4 rounded-lg ${bg} border p-3 flex items-start gap-3`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${dot} mt-1.5 animate-pulse`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        a.variant === "red"
                          ? "text-red-400"
                          : a.variant === "yellow"
                            ? "text-yellow-400"
                            : "text-blue-400"
                      }`}
                    >
                      {a.title}
                    </p>
                    <p className="text-neutral-300 text-sm">{a.body}</p>
                  </div>
                  <button className="text-white text-xs underline underline-offset-4 hover:text-neutral-300">
                    {a.actionText}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onClick={() => setAlertsOpen((s) => !s)}
        className="flex justify-center p-2 border-t border-neutral-800 group cursor-pointer hover:bg-neutral-900 transition-colors"
      >
        <button
          aria-label="Toggle alerts"
          className="w-6 h-6 flex items-center justify-center rounded-full"
        >
          <svg
            className="w-4 h-4 text-neutral-500"
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
