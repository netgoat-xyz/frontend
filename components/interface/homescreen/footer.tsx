"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, ChevronUp, Globe } from "lucide-react";
import { useRef, useState } from "react";
import { Dropdown, DropdownItem } from "@/components/elements/Dropdown";

const languages: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Espanol",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  zh: "中文",
  tl: "Tagalog",
  jp: "日本語",
};

const LOCALE_SWITCH_TRACKER_KEY = "TOTALLY_VERY_IMPORTANT_AND_NOT_AT_ALL_SUSPICIOUS_LOCALE_SWITCH_TRACKER";

function trackLocaleSwitchesForToday(): number {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const raw = localStorage.getItem(LOCALE_SWITCH_TRACKER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || parsed.date !== today) {
      localStorage.setItem(
        LOCALE_SWITCH_TRACKER_KEY,
        JSON.stringify({ date: today, count: 1 }),
      );
      return 1;
    }

    const nextCount = Number(parsed.count || 0) + 1;
    localStorage.setItem(
      LOCALE_SWITCH_TRACKER_KEY,
      JSON.stringify({ date: today, count: nextCount }),
    );
    return nextCount;
  } catch {
    return 0;
  }
}

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("HomePage.footer");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const langTriggerRef = useRef<HTMLButtonElement>(null);

  const handleLanguageChange = (newLocale: string) => {
    const switchesToday = trackLocaleSwitchesForToday();

    if (switchesToday >= 10) {
      setShowEasterEgg(true);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      return setTimeout(() => {
        setShowEasterEgg(false);
        window.location.reload();
      }, 5000);
    }

    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <>
      {showEasterEgg && (
        <div
          className="fixed inset-0 z-1000 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("easterEgg.label")}
        >
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setShowEasterEgg(false)}
              className="absolute -top-3 -right-3 rounded-full bg-foreground text-background text-xs font-medium px-3 py-1 shadow-lg hover:bg-foreground/90 transition-colors"
            >
              {t("close")}
            </button>
            <img
              src="/mww.png"
              alt={t("easterEgg.alt")}
              className="w-full h-auto rounded-xl border border-border/60 shadow-2xl"
            />
          </div>
        </div>
      )}

      <footer className="relative z-20 py-16 px-4 sm:px-6">
        <div className="w-full h-px bg-linear-to-r from-transparent via-border/60 to-transparent mb-12" />

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("rights")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <div className="relative inline-flex">
                <button
                  ref={langTriggerRef}
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="inline-flex items-center gap-x-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t("changeLanguage")}
                >
                  <Globe className="size-4" />
                  <span>{languages[locale] || t("language")}</span>
                  <ChevronUp
                    className={`size-4 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <Dropdown
                  isOpen={isLangOpen}
                  onClose={() => setIsLangOpen(false)}
                  triggerRef={langTriggerRef}
                  className="bottom-full! top-auto! mt-0! mb-2! left-0! right-auto! min-w-45"
                >
                  <div className="p-1">
                    {Object.entries(languages).map(([key, label]) => (
                      <DropdownItem
                        key={key}
                        label={label}
                        onClick={() => handleLanguageChange(key)}
                        variant="primary"
                        rightSlot={
                          locale === key && (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          )
                        }
                      />
                    ))}
                  </div>
                </Dropdown>
              </div>

              <Link
                href={"/status" as any}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("links.status")}
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("links.docs")}
              </Link>
              <Link
                href="https://github.com/netgoat-xyz/netgoat"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("links.github")}
              </Link>
              <Link
                href="https://discord.gg/3aJ7MdJsZV"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("links.discord")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
