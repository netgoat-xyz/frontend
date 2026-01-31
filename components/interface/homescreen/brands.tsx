"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const brands = [
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
];

// Duplicate for infinite loop
const marqueeBrands = [...brands, ...brands, ...brands];

export default function Brands() {
  const t = useTranslations("HomePage.testimonials");

  return (
    <section className="relative z-20 py-12 border-b border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-xs font-light text-white/40 uppercase tracking-widest">
          {t("title")}
        </p>
      </div>
      
      <div className="relative flex w-full overflow-hidden mask-gradient-x">
          {/* Fading Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />

          <motion.div 
            className="flex gap-16 items-center whitespace-nowrap"
            animate={{ x: [0, -1000] }}
            transition={{ 
                duration: 30, 
                ease: "linear", 
                repeat: Infinity 
            }}
          >
             {marqueeBrands.map((brand, i) => (
                <div key={i} className="flex items-center gap-2 group cursor-default">
                   
                    <span className="text-lg font-light text-white/30 group-hover:text-white/60 transition-all">
                        {brand}
                    </span>
                </div>
             ))}
          </motion.div>
      </div>
    </section>
  );
}
