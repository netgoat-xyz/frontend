"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-08-02T07:00:00Z").getTime();

const FlipBlock = ({ value, label }: { value: number; label: string }) => {
  const formattedValue = value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center flex-1 min-w-[60px] md:min-w-[80px]">
      <div className="relative w-full h-12 md:h-16 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl md:text-5xl font-semibold tabular-nums text-foreground tracking-tight"
          >
            {formattedValue}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-xs text-muted-foreground font-medium mt-1">
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
      <div className="text-center max-w-3xl mx-auto px-5 py-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
            {t("public_beta")}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight"
        >
          {t("sub_header")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto font-medium"
        >
          {t("detailed")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {isLaunched ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/auth")}
                className="w-full sm:w-auto group px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {t("get_started_button")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => document.getElementById("content-start")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                {t("hero.learnMore")}
              </button>
            </div>
          ) : (
            <div className="inline-flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 items-center justify-center bg-card border border-border/60 rounded-xl p-5 md:px-8 md:py-6 shadow-sm">
              <FlipBlock value={timeLeft.months} label={t("hero.countdown.months")} />
              <div className="hidden sm:block w-px h-10 bg-border/60" />
              <FlipBlock value={timeLeft.days} label={t("hero.countdown.days")} />
              <div className="hidden sm:block w-px h-10 bg-border/60" />
              <FlipBlock value={timeLeft.hours} label={t("hero.countdown.hours")} />
              <div className="hidden sm:block w-px h-10 bg-border/60" />
              <FlipBlock value={timeLeft.minutes} label={t("hero.countdown.minutes")} />
              <div className="hidden sm:block w-px h-10 bg-border/60" />
              <FlipBlock value={timeLeft.seconds} label={t("hero.countdown.seconds")} />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
