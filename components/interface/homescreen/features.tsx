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
      color: "text-amber-300",
    },
    {
      id: "security",
      icon: Shield,
      color: "text-emerald-300",
    },
    {
      id: "scalability",
      icon: Network,
      color: "text-blue-300",
    },
  ];

  return (
    <section className="relative z-20 py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-colors duration-500"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className={`mb-6 p-3 w-fit rounded-2xl bg-white/5 ${feature.color}`}>
                <feature.icon size={24} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-xl font-light text-white mb-3">
                {t(`${feature.id}.title`)}
              </h3>
              
              <p className="text-sm font-light text-white/60 leading-relaxed">
                {t(`${feature.id}.description`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
