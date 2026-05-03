"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Counter } from "@/components/ui/counter";

type StatsProps = {
  initialStats: {
    commits: number;
    stars: number;
    contributors: number;
  };
};

export default function Stats({ initialStats }: StatsProps) {
  const t = useTranslations("HomePage.stats");

  const stats = useMemo(() => [
    { 
      id: "commits", 
      value: initialStats.commits, 
      color: "from-chart-1 to-chart-2",
      suffix: "+"
    },
    { 
      id: "stars", 
      value: initialStats.stars, 
      color: "from-chart-2 to-chart-3",
      suffix: "+"
    },
    { 
      id: "contributors", 
      value: initialStats.contributors, 
      color: "from-chart-3 to-chart-4",
      suffix: "+"
    },
  ], [initialStats]);

  return (
    <section className="relative z-20 py-20 border-y border-border/60">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 md:divide-x divide-border/60">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center text-center px-8"
            >
              <div
                className={`text-5xl md:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-linear-to-br ${stat.color} mb-3`}
              >
                <Counter 
                  to={stat.value} 
                  duration={2} 
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {t(stat.id)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
