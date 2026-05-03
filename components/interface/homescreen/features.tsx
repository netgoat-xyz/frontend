"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Zap, Shield, Network } from "lucide-react";

export default function Features() {
  const t = useTranslations("HomePage.features");

  const features = [
    {
      id: "speed",
      icon: Zap,
      gradient: "from-chart-1/20 to-transparent",
      iconBg: "bg-chart-1/15",
      iconColor: "text-chart-1",
    },
    {
      id: "security",
      icon: Shield,
      gradient: "from-chart-2/20 to-transparent",
      iconBg: "bg-chart-2/15",
      iconColor: "text-chart-2",
    },
    {
      id: "scalability",
      icon: Network,
      gradient: "from-chart-3/20 to-transparent",
      iconBg: "bg-chart-3/15",
      iconColor: "text-chart-3",
    },
  ];

  return (
    <section className="relative z-20 py-28 px-6 md:px-12 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight mb-4">
          {t("heading")}
        </h2>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
          {t("description")}
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
            className="group relative p-8 rounded-xl bg-card border border-border/60 overflow-hidden hover:border-border transition-all duration-500"
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

              <h3 className="text-lg font-medium text-foreground mb-2 tracking-tight">
                {t(`${feature.id}.title`)}
              </h3>

              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {t(`${feature.id}.description`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
