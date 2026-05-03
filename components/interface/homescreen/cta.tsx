"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  const t = useTranslations("HomePage.cta");
  const router = useRouter();

  return (
    <section className="relative z-20 py-36 px-6 text-center overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-2xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {t("title")}
        </h2>

        <p className="text-sm text-muted-foreground font-medium mb-10 max-w-md mx-auto">
          {t("description")}
        </p>

        <button
          onClick={() => router.push("/auth")}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
        >
          {t("button")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </section>
  );
}
