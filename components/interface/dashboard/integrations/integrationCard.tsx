"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: string;
  details?: string; // Add details here as well
}

// NOTE: This component will now accept an `onClick` prop
export default function IntegrationCard({
  item,
  onClick,
}: {
  item: Integration;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        {item.logo ? (
          <Image
            src={item.logo}
            alt={item.name}
            width={48}
            height={48}
            className="object-cover w-12 h-12 rounded-lg"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
            <div className="text-xl font-bold text-neutral-400 group-hover:text-white transition-colors">
              {item.name[0]}
            </div>
          </div>
        )}

        {item.status == "installed" && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium uppercase tracking-wider">
            Installed
          </span>
        )}
        {item.status == "disabled" && (
          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-medium uppercase tracking-wider">
            Disabled
          </span>
        )}
      </div>

      <div className="mb-2">
        <h3 className="text-neutral-100 font-semibold text-[15px]">
          {item.name}
        </h3>
        <p className="text-neutral-500 text-xs mt-1 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-900 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-tight">
          {item.category}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }} // Prevent card click from triggering modal twice
          className="text-xs text-neutral-300 hover:text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Details →
        </button>
      </div>
    </motion.div>
  );
}
