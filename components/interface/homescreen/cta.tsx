"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  const t = useTranslations("HomePage.cta");
  const router = useRouter();

  return (
    <section className="relative z-20 py-36 px-6 text-center overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-2xl mx-auto"
      >
        <h2 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-tight leading-tight">
          {t("title")}
        </h2>

        <p className="text-sm text-white/35 font-light mb-10 max-w-md mx-auto">
          Deploy in minutes. No credit card required.
        </p>

        <button
          onClick={() => router.push("/auth")}
          className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full font-normal text-sm transition-all duration-300 hover:shadow-lg hover:shadow-white/10 cursor-pointer"
        >
          {t("button")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </section>
  );
}
