"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function Stats() {
  const t = useTranslations("HomePage.stats");
  
  const stats = [
    { id: "commits", value: "200+", color: "from-violet-400 to-indigo-400" },
    { id: "stars", value: "200+", color: "from-yellow-400 to-orange-400" },
    { id: "pung", value: "0+", color: "from-teal-400 to-green-400" },
  ];

  return (
    <section className="relative z-20 py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {stats.map((stat, idx) => (
             <motion.div 
               key={stat.id}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.1, duration: 0.4 }}
               viewport={{ once: true }}
               className="py-8 md:py-0 px-8 flex flex-col items-center justify-center text-center"
             >
                <div className={`text-4xl md:text-5xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-xs font-light text-white/40 uppercase tracking-widest">
                  {t(stat.id)}
                </div>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
