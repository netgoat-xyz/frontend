"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroContent() {
  const t = useTranslations("HomePage");
  const router = useRouter();

  return (
    <main className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-6">
        {/* Beta Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 relative"
            style={{ filter: "url(#glass-effect)" }}
          >
            <div className="absolute top-0 left-2 right-2 h-px bg-linear-to-r from-transparent via-white/20 to-transparent rounded-full" />
            <span className="text-white/80 text-[11px] font-light tracking-wide relative z-10">
              {t("public_beta")}
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-6xl md:text-8xl tracking-tight font-light text-white mb-6 leading-[1.05]"
        >
          {t("sub_header")}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm md:text-base font-light text-white/50 mb-10 leading-relaxed max-w-lg mx-auto"
        >
          {t("detailed")}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={() => router.push("/auth")}
            className="group px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-300 hover:shadow-lg hover:shadow-white/10 cursor-pointer flex items-center gap-2"
          >
            {t("get_started_button")}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("content-start");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-3 rounded-full bg-white/5 text-white/70 font-normal text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer backdrop-blur-sm"
          >
            Learn more
          </button>
        </motion.div>
      </div>
    </main>
  );
}