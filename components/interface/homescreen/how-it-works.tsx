"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Terminal, Settings, Globe, Shield } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("HomePage.how_it_works");

  const steps = [
    { id: "step1", icon: Settings, num: "01", name: "Configure", description: "Configure your domain to use Netgoat" },
    { id: "step2", icon: Globe, num: "02", name: "Deploy", description: "Deploy your network infrastructure with ease" },
    { id: "step3", icon: Shield, num: "03", name: "Protect", description: "Protect your website with peace in mind" },
  ];

  return (
    <section className="relative z-20 py-28 px-6 md:px-12 max-w-5xl mx-auto border-t border-white/5">
      <div className="mb-16 text-center">
        <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
          {t("title")}
        </h2>
        <div className="w-12 h-px bg-linear-to-r from-violet-500 to-indigo-500 mx-auto" />
      </div>

      <div className="relative">
        {/* Connecting Line — desktop only */}
        <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

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
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white/3 border border-white/8 flex items-center justify-center text-white/60 mb-6 group hover:border-violet-500/40 transition-all duration-500">
                <div className="absolute inset-0 rounded-xl bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <step.icon size={18} className="relative z-10" />
              </div>

              <span className="text-[10px] font-light text-white/20 tracking-[0.2em] uppercase mb-3">
                Step {step.num}
              </span>

              <h3 className="text-lg font-light text-white mb-2 tracking-tight">
               {step.name}
              </h3>

              <p className="text-sm font-light text-white/35 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
