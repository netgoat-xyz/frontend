"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ScrollIndicator() {
  const t = useTranslations("HomePage.scrollIndicator");
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
      <span className="text-[10px] font-light text-muted-foreground/70 tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {t("label")}
      </span>
      <div className="p-2 rounded-full flex items-center justify-center bg-foreground/5 backdrop-blur-sm border border-border/60 group-hover:bg-foreground/10 group-hover:border-border transition-all duration-300">
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
}
