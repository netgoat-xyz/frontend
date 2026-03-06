"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-08-01T00:00:00Z").getTime();

const FlipBlock = ({ value, label }: { value: number; label: string }) => {
  const formattedValue = value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 md:w-20 h-16 md:h-20 flex items-center justify-center overflow-hidden mb-2 [perspective:1000px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ rotateX: -90, y: 20, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            exit={{ rotateX: 90, y: -20, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0 }}
            className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl font-light tabular-nums"
            style={{ transformOrigin: "center" }}
          >
            {formattedValue}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-[10px] text-white/50 uppercase tracking-widest font-medium w-full text-center">{label}</div>
    </div>
  );
};

export default function HeroContent() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
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
        
        // Calculate exact months and days difference to prevent approximations
        const nowDate = new Date();
        const targetDateObj = new Date(TARGET_DATE);
        
        let months = (targetDateObj.getFullYear() - nowDate.getFullYear()) * 12 + (targetDateObj.getMonth() - nowDate.getMonth());
        
        const tempDate = new Date(nowDate);
        tempDate.setMonth(tempDate.getMonth() + months);
        
        // If adding the months exceeds the target time, subtract one month
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
    <main className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-6">
        {/* Beta Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 relative"
            style={{ filter: "url(#glass-effect)" }}
          >
            <div className="absolute top-0 left-2 right-2 h-px bg-linear-to-r from-transparent via-white/20 to-transparent rounded-full" />
            <span className="text-white/80 text-[11px] font-light tracking-wide relative z-10">
              {t("public_beta")}
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-6xl md:text-8xl tracking-tight font-light text-white mb-6 leading-[1.05]"
        >
          {t("sub_header")}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm md:text-base font-light text-white/50 mb-10 leading-relaxed max-w-lg mx-auto"
        >
          {t("detailed")}
        </motion.p>

        {/* Buttons / Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex items-center justify-center gap-4"
        >
          {isLaunched ? (
            <>
              <button
                onClick={() => router.push("/auth")}
                className="group px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-300 hover:shadow-lg hover:shadow-white/10 cursor-pointer flex items-center gap-2"
              >
                {t("get_started_button")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("content-start");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-3 rounded-full bg-white/5 text-white/70 font-normal text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                Learn more
              </button>
            </>
          ) : (
            <div className="flex gap-4 sm:gap-6 md:gap-8 items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:px-10 sm:py-8 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <FlipBlock value={timeLeft.months} label="Months" />
              <div className="w-px h-16 bg-white/10 rounded-full" />
              <FlipBlock value={timeLeft.days} label="Days" />
              <div className="w-px h-16 bg-white/10 rounded-full" />
              <FlipBlock value={timeLeft.hours} label="Hours" />
              <div className="w-px h-16 bg-white/10 rounded-full" />
              <FlipBlock value={timeLeft.minutes} label="Mins" />
              <div className="w-px h-16 bg-white/10 rounded-full" />
              <FlipBlock value={timeLeft.seconds} label="Secs" />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
