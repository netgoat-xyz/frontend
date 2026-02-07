"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const scrollToContent = () => {
    const content = document.getElementById("content-start");
    if (content) {
      content.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.button
      onClick={scrollToContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, 8, 0] }}
      transition={{
        opacity: { delay: 1.2, duration: 1 },
        y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
      }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
    >
      <span className="text-[10px] font-light text-white/30 tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore
      </span>
      <div className="p-2 rounded-full flex items-center justify-center bg-white/3 backdrop-blur-sm border border-white/8 group-hover:bg-white/8 group-hover:border-white/15 transition-all duration-300">
        <ChevronDown className="w-4 h-4 text-white/50" />
      </div>
    </motion.button>
  );
}
