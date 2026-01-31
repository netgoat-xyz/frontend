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
      animate={{ opacity: 1, y: [0, 10, 0] }}
      transition={{ 
        opacity: { delay: 1, duration: 1 },
        y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
    >
      <span className="text-[10px] font-light text-white/50 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore
      </span>
      <div className="p-2 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 group-hover:bg-white/10 transition-colors duration-300">
        <ChevronDown className="w-5 h-5 text-white/70" />
      </div>
    </motion.button>
  );
}
