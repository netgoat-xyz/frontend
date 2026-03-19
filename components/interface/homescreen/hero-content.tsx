"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-08-01T00:00:00Z").getTime();

const FlipBlock = ({ value, label }: { value: number; label: string }) => {
  const formattedValue = value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center flex-1 min-w-15 md:min-w-20">
      <div className="relative w-full h-12 md:h-20 flex items-center justify-center overflow-hidden perspective-[1000px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-6xl font-light tabular-nums text-white"
          >
            {formattedValue}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">
        {label}
      </div>
    </div>
  );
};

export default function HeroContent() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    months: 0, days: 0, hours: 0, minutes: 0, seconds: 0
  });
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    const checkDate = () => {
      const now = Date.now();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        setIsLaunched(true);
      } else {
        setIsLaunched(false);
        const nowDate = new Date();
        const targetDateObj = new Date(TARGET_DATE);
        
        let months = (targetDateObj.getFullYear() - nowDate.getFullYear()) * 12 + (targetDateObj.getMonth() - nowDate.getMonth());
        const tempDate = new Date(nowDate);
        tempDate.setMonth(tempDate.getMonth() + months);
        
        if (tempDate.getTime() > TARGET_DATE) {
          months--;
          tempDate.setMonth(tempDate.getMonth() - 1);
        }
        
        const diffAfterMonths = TARGET_DATE - tempDate.getTime();

        setTimeLeft({
          months: Math.max(0, months),
          days: Math.floor(diffAfterMonths / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    checkDate();
    const interval = setInterval(checkDate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="absolute inset-0 z-20 flex items-center justify-center overflow-x-hidden">
      <div className="text-center max-w-3xl mx-auto px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <span className="text-white/80 text-[10px] md:text-[11px] font-light tracking-widest uppercase">
              {t("public_beta")}
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-6xl sm:text-6xl md:text-8xl tracking-tight font-light text-white mb-4 md:mb-6 leading-[1.1]"
        >
          {t("sub_header")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm md:text-base font-light text-white/50 mb-8 md:mb-12 leading-relaxed max-w-md mx-auto"
        >
          {t("detailed")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          {isLaunched ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/auth")}
                className="w-full sm:w-auto group px-8 py-4 rounded-full bg-white text-black font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t("get_started_button")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => document.getElementById("content-start")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white/70 font-medium text-sm border border-white/10 active:bg-white/10 backdrop-blur-sm"
              >
                Learn more
              </button>
            </div>
          ) : (
            <div className="inline-grid grid-cols-3 sm:flex sm:flex-row gap-4 sm:gap-6 md:gap-8 items-center justify-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-lg md:rounded-md p-5 md:px-10 md:py-8 text-white shadow-2xl">
              <FlipBlock value={timeLeft.months} label="Months" />
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              <FlipBlock value={timeLeft.days} label="Days" />
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              <FlipBlock value={timeLeft.hours} label="Hours" />
              
              {/* Divider visible only on larger screens when it's a single row */}
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              
              <FlipBlock value={timeLeft.minutes} label="Mins" />
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              <FlipBlock value={timeLeft.seconds} label="Secs" />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}