"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";

const brands = [
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
  "Coming Soon",
];

const marqueeBrands = [...brands, ...brands, ...brands];

export default function Brands() {
  const t = useTranslations("HomePage.testimonials");

  return (
    <section className="relative z-20 py-16 border-b border-white/5 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 mb-10 text-center">
        <p className="text-[11px] font-light text-white/30 uppercase tracking-[0.2em]">
          {t("title")}
        </p>
      </div>

      <div className="relative flex w-full overflow-hidden">
        {/* Fading Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-black to-transparent z-10" />

        <motion.div
          className="flex gap-20 items-center whitespace-nowrap"
          animate={{ x: [0, -800] }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {marqueeBrands.map((brand, i) => (
            <div
              key={i}
              className="flex items-center gap-2 select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5" />
              <span className="text-sm font-light text-white/20 tracking-wide">
                {brand}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
