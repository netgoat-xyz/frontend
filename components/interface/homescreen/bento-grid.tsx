"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Globe, Shield, Activity, Code, Users } from "lucide-react";

const BentoCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm group hover:bg-white/[0.07] transition-colors duration-500 ${className}`}
  >
    {children}
  </motion.div>
);

export default function BentoGrid() {
  const t = useTranslations("HomePage.bento");

  return (
    <section className="relative z-20 py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 h-full">
        {/* Large Card: Global Network */}
        <BentoCard className="md:col-span-4 md:row-span-2 min-h-100 flex flex-col justify-between" delay={0.1}>
           <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           
           <div className="relative z-10">
             <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 text-violet-300">
               <Globe size={24} />
             </div>
             <h3 className="text-2xl font-light text-white mb-2">{t("network.title")}</h3>
             <p className="text-white/50 font-light max-w-sm">{t("network.desc")}</p>
           </div>
           
           {/* Abstract Map Graphic */}
</BentoCard>

        {/* Small Card: Analytics */}
        <BentoCard className="md:col-span-2 min-h-[200px]" delay={0.2}>
           <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-300">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-light text-white mb-1">{t("analytics.title")}</h3>
                <p className="text-xs text-white/50 font-light">{t("analytics.desc")}</p>
              </div>
           </div>
           {/* Mini Chart */}
           <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-1 px-6 pb-6 opacity-50">
              {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-500/50 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
           </div>
        </BentoCard>

        {/* Medium Card: API First */}
        <BentoCard className="md:col-span-2 min-h-[200px]" delay={0.3}>
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 text-amber-300">
               <Code size={20} />
            </div>
            <h3 className="text-lg font-light text-white mb-1">{t("api.title")}</h3>
             {/* Code Snippet */}
             <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-white/60">
               <div className="flex gap-2 mb-2">
                 <div className="w-2 h-2 rounded-full bg-red-500/50" />
                 <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                 <div className="w-2 h-2 rounded-full bg-green-500/50" />
               </div>
               <p><span className="text-purple-400">curl</span> -X POST \</p>
               <p className="pl-2">api.netgoat.xyz/v1/rules</p>
             </div>
        </BentoCard>

        {/* Small Card: DDoS */}
        <BentoCard className="md:col-span-2 min-h-[200px]" delay={0.4}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3 text-red-300">
             <Shield size={20} />
          </div>
          <h3 className="text-lg font-light text-white mb-1">{t("security.title")}</h3>
          <p className="text-xs text-white/50 font-light">{t("security.desc")}</p>
        </BentoCard>

      </div>
    </section>
  );
}
