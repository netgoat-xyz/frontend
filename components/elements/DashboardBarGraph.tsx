"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type DashboardBarGraphProps = {
  data: number[];
};

export default function DashboardBarGraph({ data }: DashboardBarGraphProps) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="h-48 w-full flex items-end gap-1">
      {data.map((h, i) => {
        const isActive = active === i;

        return (
          <motion.div
            key={i}
            onHoverStart={() => setActive(i)}
            onHoverEnd={() => setActive(null)}
            animate={{
              flexGrow: isActive ? 1.3 : active !== null ? 0.9 : 1,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex flex-col justify-end h-full flex-1"
          >
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-indigo-500 text-white whitespace-nowrap"
              >
                {h}%
              </motion.div>
            )}

            <div
              style={{ height: `${h}%` }}
              className={`w-full rounded-sm transition-all cursor- duration-300 bg-indigo-500 ${
                active !== null && !isActive ? "opacity-60" : "opacity-100"
              }`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
