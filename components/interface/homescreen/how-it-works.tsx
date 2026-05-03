"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Settings, Globe, Shield } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("HomePage.how_it_works");

  const steps = [
    { id: "step1", icon: Settings, num: "01" },
    { id: "step2", icon: Globe, num: "02" },
    { id: "step3", icon: Shield, num: "03" },
  ];

  return (
    <section className="relative z-20 py-28 px-6 md:px-12 max-w-5xl mx-auto border-t border-border/60">
      <div className="mb-16 text-center">
        <h2 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight mb-4">
          {t("title")}
        </h2>
        <div className="w-12 h-px bg-linear-to-r from-primary to-accent mx-auto" />
      </div>

      <div className="relative">
        {/* Connecting Line — desktop only */}
        <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-linear-to-r from-transparent via-border/60 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step Icon */}
              <div className="relative z-10 w-12 h-12 rounded-xl bg-foreground/5 border border-border/60 flex items-center justify-center text-muted-foreground mb-6 group hover:border-primary/40 transition-all duration-500">
                <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <step.icon size={18} className="relative z-10" />
              </div>

              <span className="text-xs font-semibold text-primary uppercase mb-3 tracking-wider">
                {t("stepLabel", { number: step.num })}
              </span>

              <h3 className="text-lg font-medium text-foreground mb-2 tracking-tight">
                {t(`${step.id}.title`)}
              </h3>

              <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-xs">
                {t(`${step.id}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
