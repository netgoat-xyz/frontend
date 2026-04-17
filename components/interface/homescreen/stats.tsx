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
      color: "from-violet-400 to-indigo-400",
      suffix: "+"
    },
    { 
      id: "stars", 
      value: initialStats.stars, 
      color: "from-amber-300 to-orange-400",
      suffix: "+"
    },
    { 
      id: "contributors", 
      value: initialStats.contributors, 
      color: "from-emerald-400 to-teal-400",
      suffix: "+"
    },
  ], [initialStats]);

  return (
    <section className="relative z-20 py-20 border-y border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 md:divide-x divide-white/5">
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
                className={`text-5xl md:text-6xl font-extralight tracking-tight text-transparent bg-clip-text bg-linear-to-br ${stat.color} mb-3`}
              >
                <Counter 
                  to={stat.value} 
                  duration={2} 
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-[11px] font-light text-white/35 uppercase tracking-[0.2em]">
                {t(stat.id)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
