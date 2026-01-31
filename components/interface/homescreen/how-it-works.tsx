"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Terminal, Settings, Globe } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("HomePage.how_it_works");

  const steps = [
    {
      id: "step1",
      icon: Terminal,
    },
    {
      id: "step2",
      icon: Settings,
    },
    {
      id: "step3",
      icon: Globe,
    },
  ];

  return (
    <section className="relative z-20 py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
      <div className="mb-16">
        <h2 className="text-3xl font-light text-white mb-2">{t("title")}</h2>
        <div className="w-12 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10 md:hidden" />
        <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="relative flex md:flex-col gap-6 items-start md:items-center text-left md:text-center"
            >
              {/* Step Number/Icon */}
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white/80 overflow-hidden group hover:border-violet-500/50 transition-colors duration-500">
                  <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <step.icon size={20} className="relative z-10" />
              </div>

              <div>
                <h3 className="text-lg font-normal text-white mb-2">
                  {t(`${step.id}.title`)}
                </h3>
                <p className="text-sm font-light text-white/50 leading-relaxed max-w-xs mx-auto">
                  {t(`${step.id}.desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
