"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"

export default function CallToAction() {
  const t = useTranslations("HomePage.cta");
  const router = useRouter();

  return (
    <section className="relative z-20 py-32 px-6 text-center overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-linear-to-trrom-violet-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-2xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-light text-white mb-8 tracking-tight">
          {t("title")}
        </h2>
        
        <InteractiveHoverButton className="px-8 py-4 bg-white text-black rounded-full border-none font-medium text-sm" onClick={() => router.push('/auth')}>{t("button")}</InteractiveHoverButton>
      </motion.div>
    </section>
  );
}
