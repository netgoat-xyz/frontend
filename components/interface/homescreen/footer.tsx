"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("HomePage.footer");

  return (
    <footer className="relative z-20 py-12 text-center">
      <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-12" />
      <p className="text-xs font-light text-white/30">
        {t("rights")}
      </p>
    </footer>
  );
}
