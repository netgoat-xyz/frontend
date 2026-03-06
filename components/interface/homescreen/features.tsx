"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Zap, Shield, Network } from "lucide-react";

export default function Features() {
  const t = useTranslations("HomePage.features");

  const features = [
    {
      id: "speed",
      icon: Zap,
      gradient: "from-amber-500/15 to-transparent",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-300",
    },
    {
      id: "security",
      icon: Shield,
      gradient: "from-emerald-500/15 to-transparent",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
    },
    {
      id: "scalability",
      icon: Network,
      gradient: "from-blue-500/15 to-transparent",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-300",
    },
  ];

  return (
    <section className="relative z-20 py-28 px-6 md:px-12 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
          Built for the modern stack
        </h2>
        <p className="text-sm text-white/35 font-light max-w-md mx-auto">
          Everything you need to build, deploy, and scale your network infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="group relative p-8 rounded-2xl bg-white/2 border border-white/6 overflow-hidden hover:border-white/12 transition-all duration-500"
          >
            {/* Hover Glow */}
            <div
              className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            <div className="relative z-10">
              <div
                className={`mb-6 w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor}`}
              >
                <feature.icon size={20} strokeWidth={1.5} />
              </div>

              <h3 className="text-lg font-light text-white mb-2 tracking-tight">
                {t(`${feature.id}.title`)}
              </h3>

              <p className="text-sm font-light text-white/40 leading-relaxed">
                {t(`${feature.id}.description`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
